/**
 * Socket.IO Server Configuration with Authentication
 * 
 * Features:
 * - JWT-based authentication for socket connections
 * - Redis adapter support for horizontal scaling
 * - Room management for diagram collaboration
 * - Presence system for online users
 * - Connection health monitoring
 * - Rate limiting and throttling for free tier optimization
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Diagram = require('../models/Diagram');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');

// Store for active connections and rooms
const activeConnections = new Map(); // socketId -> { userId, diagramId, username }
const diagramRooms = new Map(); // diagramId -> Map of { socketId -> userData }
const tableLocks = new Map(); // diagramId -> Map of { nodeId -> lockData }

// ============ FREE TIER OPTIMIZATIONS ============
// Rate limiting and throttling stores
const cursorThrottles = new Map(); // socketId -> lastCursorTime
const eventRateLimits = new Map(); // socketId -> { count, resetTime }

// Configuration for free tier limits (optimized for 10 users/diagram)
const FREE_TIER_LIMITS = {
  MAX_USERS_PER_DIAGRAM: 10,      // Max collaborators per diagram
  MAX_TOTAL_CONNECTIONS: 150,     // Supports ~15 diagrams at full capacity
  CURSOR_THROTTLE_MS: 50,         // 20 cursor updates/sec max per user
  EVENT_RATE_LIMIT: 30,           // 30 operations/sec per user (450 total at capacity)
  EVENT_RATE_WINDOW_MS: 1000,     // Rate limit window
  STALE_CONNECTION_MS: 300000,    // 5 min - cleanup inactive connections
  TABLE_LOCK_TIMEOUT_MS: 60000,   // Auto-release lock after 1 minute of inactivity
};

function getDiagramLockMap(diagramId) {
  if (!tableLocks.has(diagramId)) {
    tableLocks.set(diagramId, new Map());
  }
  return tableLocks.get(diagramId);
}

function getSerializableLocks(diagramId) {
  const lockMap = tableLocks.get(diagramId);
  if (!lockMap) return {};

  const result = {};
  for (const [nodeId, lock] of lockMap.entries()) {
    result[nodeId] = {
      nodeId,
      userId: lock.userId,
      username: lock.username,
      socketId: lock.socketId,
      acquiredAt: lock.acquiredAt,
      lastActivityAt: lock.lastActivityAt,
    };
  }

  return result;
}

function emitLocksUpdate(io, diagramId) {
  io.to(`diagram:${diagramId}`).emit('table-locks-update', {
    locks: getSerializableLocks(diagramId)
  });
}

function clearUserSelections(roomUsers, socketId) {
  const user = roomUsers?.get(socketId);
  if (user) {
    user.selectedNodes = [];
    user.selectedEdges = [];
  }
}

function clearUserLocks(io, diagramId, socketId, reason = 'release') {
  const lockMap = tableLocks.get(diagramId);
  if (!lockMap) return;

  let changed = false;
  for (const [nodeId, lock] of lockMap.entries()) {
    if (lock.socketId === socketId) {
      lockMap.delete(nodeId);
      io.to(`diagram:${diagramId}`).emit('table-lock-released', {
        diagramId,
        nodeId,
        userId: lock.userId,
        username: lock.username,
        reason,
      });
      changed = true;
    }
  }

  if (lockMap.size === 0) {
    tableLocks.delete(diagramId);
  }

  if (changed) {
    emitLocksUpdate(io, diagramId);
  }
}

function isTableLockedByOther(diagramId, nodeId, socketId) {
  if (!diagramId || !nodeId) return false;
  const lockMap = tableLocks.get(diagramId);
  if (!lockMap) return false;

  const lock = lockMap.get(nodeId);
  if (!lock) return false;

  const now = Date.now();
  if (now - lock.lastActivityAt > FREE_TIER_LIMITS.TABLE_LOCK_TIMEOUT_MS) {
    return false;
  }

  return lock.socketId !== socketId;
}

function touchLockActivity(diagramId, nodeId, socketId) {
  if (!diagramId || !nodeId) return;
  const lockMap = tableLocks.get(diagramId);
  if (!lockMap) return;

  const lock = lockMap.get(nodeId);
  if (lock && lock.socketId === socketId) {
    lock.lastActivityAt = Date.now();
  }
}

// Get current stats for monitoring
function getServerStats() {
  return {
    totalConnections: activeConnections.size,
    activeRooms: diagramRooms.size,
    roomDetails: Array.from(diagramRooms.entries()).map(([id, users]) => ({
      diagramId: id,
      userCount: users.size
    })),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    uptime: Math.round(process.uptime())
  };
}

// Check rate limit for a socket
function checkRateLimit(socketId) {
  const now = Date.now();
  let rateData = eventRateLimits.get(socketId);
  
  if (!rateData || now > rateData.resetTime) {
    rateData = { count: 1, resetTime: now + FREE_TIER_LIMITS.EVENT_RATE_WINDOW_MS };
    eventRateLimits.set(socketId, rateData);
    return true;
  }
  
  if (rateData.count >= FREE_TIER_LIMITS.EVENT_RATE_LIMIT) {
    return false; // Rate limited
  }
  
  rateData.count++;
  return true;
}

// Update last activity timestamp for a connection
function updateActivity(socketId) {
  const connection = activeConnections.get(socketId);
  if (connection) {
    connection.lastActivity = Date.now();
  }
}

// Cleanup throttle/rate limit data for disconnected users
function cleanupUserData(socketId) {
  cursorThrottles.delete(socketId);
  eventRateLimits.delete(socketId);
}

/**
 * Initialize Socket.IO server with authentication and Redis adapter
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Setup Redis adapter for horizontal scaling (if Redis is configured)
  setupRedisAdapter(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password -otp');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      if (!user.isVerified) {
        return next(new Error('Email not verified'));
      }

      // Attach user to socket
      socket.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      };

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return next(new Error('Invalid token'));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      
      return next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    // Check total connection limit
    if (activeConnections.size >= FREE_TIER_LIMITS.MAX_TOTAL_CONNECTIONS) {
      console.log(`⚠️ Connection rejected: Server at capacity (${activeConnections.size} connections)`);
      socket.emit('error', { message: 'Server is at capacity. Please try again later.' });
      socket.disconnect(true);
      return;
    }

    console.log(`🔌 User connected: ${socket.user.username} (${socket.id}) [${activeConnections.size + 1} total]`);
    
    // Store connection info with timestamp for stale cleanup
    activeConnections.set(socket.id, {
      userId: socket.user.id,
      username: socket.user.username,
      diagramId: null,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });

    // Join diagram room for collaboration
    socket.on('join-diagram', async (data) => {
      updateActivity(socket.id);
      await handleJoinDiagram(io, socket, data);
    });

    // Leave diagram room
    socket.on('leave-diagram', (data) => {
      updateActivity(socket.id);
      handleLeaveDiagram(io, socket, data);
    });

    // Handle cursor position updates (with throttling)
    socket.on('cursor-move', (data) => {
      handleCursorMove(io, socket, data);
    });

    // Handle real-time diagram updates (Yjs sync)
    socket.on('sync-update', (data) => {
      if (!checkRateLimit(socket.id)) return;
      updateActivity(socket.id);
      handleSyncUpdate(io, socket, data);
    });

    // Handle awareness updates (presence)
    socket.on('awareness-update', (data) => {
      if (!checkRateLimit(socket.id)) return;
      handleAwarenessUpdate(io, socket, data);
    });

    // Handle node operations (with rate limiting)
    socket.on('node-add', (data) => {
      if (!checkRateLimit(socket.id)) return;
      updateActivity(socket.id);
      handleNodeOperation(io, socket, 'node-add', data);
    });
    socket.on('node-update', (data) => {
      if (!checkRateLimit(socket.id)) return;
      updateActivity(socket.id);
      handleNodeOperation(io, socket, 'node-update', data);
    });
    socket.on('node-delete', (data) => {
      if (!checkRateLimit(socket.id)) return;
      updateActivity(socket.id);
      handleNodeOperation(io, socket, 'node-delete', data);
    });
    socket.on('node-move', (data) => {
      if (!checkRateLimit(socket.id)) return;
      handleNodeOperation(io, socket, 'node-move', data);
    });

    // Handle edge operations (with rate limiting)
    socket.on('edge-add', (data) => {
      if (!checkRateLimit(socket.id)) return;
      updateActivity(socket.id);
      handleEdgeOperation(io, socket, 'edge-add', data);
    });
    socket.on('edge-delete', (data) => {
      if (!checkRateLimit(socket.id)) return;
      updateActivity(socket.id);
      handleEdgeOperation(io, socket, 'edge-delete', data);
    });

    // Handle selection changes
    socket.on('selection-change', (data) => {
      if (!checkRateLimit(socket.id)) return;
      handleSelectionChange(io, socket, data);
    });

    socket.on('table-lock-request', (data, ack) => {
      updateActivity(socket.id);
      handleTableLockRequest(io, socket, data, ack);
    });

    socket.on('table-lock-release', (data, ack) => {
      updateActivity(socket.id);
      handleTableLockRelease(io, socket, data, ack);
    });

    socket.on('table-lock-touch', (data) => {
      if (!checkRateLimit(socket.id)) return;
      updateActivity(socket.id);
      handleTableLockTouch(io, socket, data);
    });

    // Request current diagram state (for late joiners)
    socket.on('request-state', (data) => {
      handleRequestState(io, socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      handleDisconnect(io, socket, reason);
      cleanupUserData(socket.id); // Clean up throttle/rate limit data
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.username}:`, error);
    });
  });

  // Heartbeat to clean up stale connections and throttle data
  setInterval(() => {
    cleanupStaleConnections(io);
    // Clean up old rate limit entries
    const now = Date.now();
    for (const [socketId, data] of eventRateLimits.entries()) {
      if (now > data.resetTime + 60000) {
        eventRateLimits.delete(socketId);
      }
    }
  }, 30000);

  return io;
}

/**
 * Setup Redis adapter for horizontal scaling
 */
async function setupRedisAdapter(io) {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('⚠️  Redis URL not configured, running in single-server mode');
    return;
  }

  try {
    const pubClient = createClient(redisUrl);
    const subClient = pubClient.duplicate();

    await Promise.all([
      pubClient.connect ? pubClient.connect() : Promise.resolve(),
      subClient.connect ? subClient.connect() : Promise.resolve()
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter connected for horizontal scaling');
  } catch (error) {
    console.error('❌ Redis connection failed, running in single-server mode:', error.message);
  }
}

/**
 * Handle user joining a diagram room
 */
async function handleJoinDiagram(io, socket, data) {
  const { diagramId } = data;
  
  if (!diagramId) {
    socket.emit('error', { message: 'Diagram ID required' });
    return;
  }

  try {
    // Check if user has access to this diagram
    const diagram = await Diagram.findById(diagramId).populate('user', 'username');
    
    if (!diagram) {
      socket.emit('error', { message: 'Diagram not found' });
      return;
    }

    const isOwner = diagram.user._id.toString() === socket.user.id;
    const isCollaborator = diagram.collaborators?.some(
      c => c.user?.toString() === socket.user.id
    );
    const isPublic = diagram.isPublic;

    // Check access permissions
    if (!isOwner && !isCollaborator && !isPublic) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    // Determine permission level
    let permission = 'view';
    if (isOwner) {
      permission = 'edit';
    } else if (isCollaborator) {
      const collab = diagram.collaborators.find(c => c.user?.toString() === socket.user.id);
      permission = collab?.permission || 'view';
    }

    // Check room capacity limit (free tier optimization)
    const existingRoom = diagramRooms.get(diagramId);
    if (existingRoom && existingRoom.size >= FREE_TIER_LIMITS.MAX_USERS_PER_DIAGRAM) {
      // Check if user is already in the room (reconnecting)
      if (!existingRoom.has(socket.id)) {
        socket.emit('error', { 
          message: `This diagram has reached capacity (${FREE_TIER_LIMITS.MAX_USERS_PER_DIAGRAM} users). Please try again later.` 
        });
        return;
      }
    }

    // Leave any previous diagram room
    const prevConnection = activeConnections.get(socket.id);
    if (prevConnection?.diagramId && prevConnection.diagramId !== diagramId) {
      handleLeaveDiagram(io, socket, { diagramId: prevConnection.diagramId });
    }

    // Join the new room
    const roomName = `diagram:${diagramId}`;
    socket.join(roomName);

    // Update connection info
    activeConnections.set(socket.id, {
      userId: socket.user.id,
      username: socket.user.username,
      diagramId: diagramId,
      lastActivity: Date.now()
    });

    // Add to diagram room tracking
    if (!diagramRooms.has(diagramId)) {
      diagramRooms.set(diagramId, new Map());
    }
    
    const roomUsers = diagramRooms.get(diagramId);
    roomUsers.set(socket.id, {
      socketId: socket.id,
      userId: socket.user.id,
      username: socket.user.username,
      permission: permission,
      cursor: null,
      selectedNodes: [],
      selectedEdges: [],
      joinedAt: Date.now()
    });

    // Get current users in the room (including their selections)
    const currentUsers = Array.from(roomUsers.values()).map(u => ({
      id: u.socketId,
      odUserId: u.userId,
      username: u.username,
      permission: u.permission,
      cursor: u.cursor,
      selectedNodes: u.selectedNodes || [],
      selectedEdges: u.selectedEdges || []
    }));

    // Notify the joining user
    socket.emit('joined-diagram', {
      diagramId,
      permission,
      users: currentUsers,
      tableLocks: getSerializableLocks(diagramId),
      ownerUsername: diagram.user.username,
      diagramName: diagram.name
    });

    // Notify others in the room
    socket.to(roomName).emit('user-joined', {
      id: socket.id,
      odUserId: socket.user.id,
      username: socket.user.username,
      permission
    });

    console.log(`👤 ${socket.user.username} joined diagram ${diagramId} with ${permission} permission`);

  } catch (error) {
    console.error('Error joining diagram:', error);
    socket.emit('error', { message: 'Failed to join diagram' });
  }
}

/**
 * Handle user leaving a diagram room
 */
function handleLeaveDiagram(io, socket, data) {
  const { diagramId } = data;
  
  if (!diagramId) return;

  const roomName = `diagram:${diagramId}`;
  socket.leave(roomName);

  clearUserLocks(io, diagramId, socket.id, 'leave');

  // Remove from room tracking
  const roomUsers = diagramRooms.get(diagramId);
  if (roomUsers) {
    clearUserSelections(roomUsers, socket.id);
    roomUsers.delete(socket.id);
    
    // Clean up empty rooms
    if (roomUsers.size === 0) {
      diagramRooms.delete(diagramId);
    }
  }

  // Update connection info
  const connection = activeConnections.get(socket.id);
  if (connection) {
    connection.diagramId = null;
  }

  // Notify others
  socket.to(roomName).emit('user-left', {
    id: socket.id,
    userId: socket.user.id,
    username: socket.user.username
  });

  console.log(`👤 ${socket.user.username} left diagram ${diagramId}`);
}

/**
 * Handle cursor position updates (with server-side throttling)
 */
function handleCursorMove(io, socket, data) {
  const { diagramId, x, y } = data;
  
  if (!diagramId) return;

  // Server-side throttling - limit cursor updates per user
  const now = Date.now();
  const lastUpdate = cursorThrottles.get(socket.id) || 0;
  if (now - lastUpdate < FREE_TIER_LIMITS.CURSOR_THROTTLE_MS) {
    return; // Throttled - skip this update
  }
  cursorThrottles.set(socket.id, now);

  // Update cursor in room tracking
  const roomUsers = diagramRooms.get(diagramId);
  if (roomUsers) {
    const user = roomUsers.get(socket.id);
    if (user) {
      user.cursor = { x, y };
    }
  }

  // Broadcast to others in the room
  const roomName = `diagram:${diagramId}`;
  socket.to(roomName).emit('cursor-update', {
    id: socket.id,
    username: socket.user.username,
    x,
    y
  });
}

/**
 * Handle Yjs document sync updates
 */
function handleSyncUpdate(io, socket, data) {
  const { diagramId, update, origin } = data;
  
  if (!diagramId || !update) return;

  // Verify user has edit permission
  const roomUsers = diagramRooms.get(diagramId);
  if (!roomUsers) return;
  
  const user = roomUsers.get(socket.id);
  if (!user || user.permission !== 'edit') {
    socket.emit('error', { message: 'Edit permission required' });
    return;
  }

  // Broadcast update to others in the room
  const roomName = `diagram:${diagramId}`;
  socket.to(roomName).emit('sync-update', {
    update,
    origin: socket.user.username
  });
}

/**
 * Handle awareness updates (user presence, selections, etc.)
 */
function handleAwarenessUpdate(io, socket, data) {
  const { diagramId, awareness } = data;
  
  if (!diagramId) return;

  const roomName = `diagram:${diagramId}`;
  socket.to(roomName).emit('awareness-update', {
    userId: socket.user.id,
    username: socket.user.username,
    awareness
  });
}

/**
 * Handle node operations (add, update, delete, move)
 */
function handleNodeOperation(io, socket, eventType, data) {
  const { diagramId, node, nodeId, changes, position } = data;
  
  if (!diagramId) return;

  // Verify user has edit permission
  const roomUsers = diagramRooms.get(diagramId);
  if (!roomUsers) return;
  
  const user = roomUsers.get(socket.id);
  if (!user || user.permission !== 'edit') {
    socket.emit('error', { message: 'Edit permission required' });
    return;
  }

  const targetNodeId = nodeId || node?.id;
  if ((eventType === 'node-update' || eventType === 'node-move' || eventType === 'node-delete') && targetNodeId) {
    if (isTableLockedByOther(diagramId, targetNodeId, socket.id)) {
      socket.emit('error', { message: 'This table is locked by another collaborator' });
      return;
    }
    touchLockActivity(diagramId, targetNodeId, socket.id);
  }

  if (eventType === 'node-delete' && targetNodeId) {
    const lockMap = tableLocks.get(diagramId);
    const lock = lockMap?.get(targetNodeId);
    if (lock && lock.socketId === socket.id) {
      lockMap.delete(targetNodeId);
      if (lockMap.size === 0) {
        tableLocks.delete(diagramId);
      }
      clearUserSelections(roomUsers, socket.id);
      socket.to(`diagram:${diagramId}`).emit('selection-change', {
        userId: socket.user.id,
        username: socket.user.username,
        socketId: socket.id,
        selectedNodes: [],
        selectedEdges: []
      });
      io.to(`diagram:${diagramId}`).emit('table-lock-released', {
        diagramId,
        nodeId: targetNodeId,
        userId: socket.user.id,
        username: socket.user.username,
        reason: 'delete',
      });
      emitLocksUpdate(io, diagramId);
    }
  }

  // Broadcast operation to others
  const roomName = `diagram:${diagramId}`;
  socket.to(roomName).emit(eventType, {
    node,
    nodeId,
    changes,
    position,
    userId: socket.user.id,
    username: socket.user.username
  });
}

/**
 * Handle edge operations (add, delete)
 */
function handleEdgeOperation(io, socket, eventType, data) {
  const { diagramId, edge, edgeId } = data;
  
  if (!diagramId) return;

  // Verify user has edit permission
  const roomUsers = diagramRooms.get(diagramId);
  if (!roomUsers) return;
  
  const user = roomUsers.get(socket.id);
  if (!user || user.permission !== 'edit') {
    socket.emit('error', { message: 'Edit permission required' });
    return;
  }

  // Broadcast operation to others
  const roomName = `diagram:${diagramId}`;
  socket.to(roomName).emit(eventType, {
    edge,
    edgeId,
    userId: socket.user.id,
    username: socket.user.username
  });
}

/**
 * Handle selection change broadcasts
 */
function handleSelectionChange(io, socket, data) {
  const { diagramId, selectedNodes, selectedEdges } = data;
  
  if (!diagramId) return;

  // Update selection in room tracking
  const roomUsers = diagramRooms.get(diagramId);
  if (roomUsers) {
    const user = roomUsers.get(socket.id);
    if (user) {
      user.selectedNodes = selectedNodes || [];
      user.selectedEdges = selectedEdges || [];
    }
  }

  const roomName = `diagram:${diagramId}`;
  socket.to(roomName).emit('selection-change', {
    userId: socket.user.id,
    username: socket.user.username,
    socketId: socket.id,
    selectedNodes: selectedNodes || [],
    selectedEdges: selectedEdges || []
  });
}

function handleTableLockRequest(io, socket, data, ack) {
  const { diagramId, nodeId } = data || {};

  if (!diagramId || !nodeId) {
    ack?.({ success: false, error: 'diagramId and nodeId are required' });
    return;
  }

  const roomUsers = diagramRooms.get(diagramId);
  const user = roomUsers?.get(socket.id);
  if (!user || user.permission !== 'edit') {
    ack?.({ success: false, error: 'Edit permission required' });
    return;
  }

  const lockMap = getDiagramLockMap(diagramId);
  const now = Date.now();
  const existing = lockMap.get(nodeId);

  if (existing && now - existing.lastActivityAt > FREE_TIER_LIMITS.TABLE_LOCK_TIMEOUT_MS) {
    lockMap.delete(nodeId);
  }

  const current = lockMap.get(nodeId);
  if (current && current.socketId !== socket.id) {
    ack?.({ success: false, error: `${current.username} is currently editing this table` });
    return;
  }

  // Release all previous locks owned by this socket in this diagram before acquiring a new one
  for (const [lockedNodeId, lock] of lockMap.entries()) {
    if (lock.socketId === socket.id && lockedNodeId !== nodeId) {
      lockMap.delete(lockedNodeId);
      io.to(`diagram:${diagramId}`).emit('table-lock-released', {
        diagramId,
        nodeId: lockedNodeId,
        userId: socket.user.id,
        username: socket.user.username,
        reason: 'switch',
      });
    }
  }

  const lock = {
    nodeId,
    userId: socket.user.id,
    username: socket.user.username,
    socketId: socket.id,
    acquiredAt: now,
    lastActivityAt: now,
  };
  lockMap.set(nodeId, lock);

  if (roomUsers) {
    const selectedUser = roomUsers.get(socket.id);
    if (selectedUser) {
      selectedUser.selectedNodes = [nodeId];
      selectedUser.selectedEdges = [];
    }
  }

  socket.to(`diagram:${diagramId}`).emit('selection-change', {
    userId: socket.user.id,
    username: socket.user.username,
    socketId: socket.id,
    selectedNodes: [nodeId],
    selectedEdges: []
  });

  io.to(`diagram:${diagramId}`).emit('table-lock-acquired', {
    diagramId,
    nodeId,
    userId: socket.user.id,
    username: socket.user.username,
  });

  emitLocksUpdate(io, diagramId);
  ack?.({ success: true, lock });
}

function handleTableLockRelease(io, socket, data, ack) {
  const { diagramId, nodeId } = data || {};
  if (!diagramId || !nodeId) {
    ack?.({ success: false, error: 'diagramId and nodeId are required' });
    return;
  }

  const roomUsers = diagramRooms.get(diagramId);
  const lockMap = tableLocks.get(diagramId);
  const lock = lockMap?.get(nodeId);

  if (!lock) {
    if (roomUsers?.get(socket.id)) {
      clearUserSelections(roomUsers, socket.id);
      socket.to(`diagram:${diagramId}`).emit('selection-change', {
        userId: socket.user.id,
        username: socket.user.username,
        socketId: socket.id,
        selectedNodes: [],
        selectedEdges: []
      });
    }
    ack?.({ success: true });
    return;
  }

  if (lock.socketId !== socket.id) {
    ack?.({ success: false, error: 'You do not own this lock' });
    return;
  }

  lockMap.delete(nodeId);
  if (lockMap.size === 0) {
    tableLocks.delete(diagramId);
  }

  if (roomUsers?.get(socket.id)) {
    clearUserSelections(roomUsers, socket.id);
    socket.to(`diagram:${diagramId}`).emit('selection-change', {
      userId: socket.user.id,
      username: socket.user.username,
      socketId: socket.id,
      selectedNodes: [],
      selectedEdges: []
    });
  }

  io.to(`diagram:${diagramId}`).emit('table-lock-released', {
    diagramId,
    nodeId,
    userId: socket.user.id,
    username: socket.user.username,
    reason: 'release',
  });

  emitLocksUpdate(io, diagramId);
  ack?.({ success: true });
}

function handleTableLockTouch(io, socket, data) {
  const { diagramId, nodeId } = data || {};
  if (!diagramId || !nodeId) return;
  touchLockActivity(diagramId, nodeId, socket.id);
}

/**
 * Handle state request from late joiners
 */
function handleRequestState(io, socket, data) {
  const { diagramId } = data;
  
  if (!diagramId) return;

  const roomName = `diagram:${diagramId}`;
  
  // Request state from the first connected user in the room
  const roomUsers = diagramRooms.get(diagramId);
  if (roomUsers && roomUsers.size > 1) {
    // Find another user to provide state
    for (const [socketId, user] of roomUsers) {
      if (socketId !== socket.id) {
        io.to(socketId).emit('provide-state', {
          requesterId: socket.id,
          requesterUsername: socket.user.username
        });
        break;
      }
    }
  }
}

/**
 * Handle disconnection
 */
function handleDisconnect(io, socket, reason) {
  console.log(`🔌 User disconnected: ${socket.user.username} (${reason})`);

  // Get connection info before removing
  const connection = activeConnections.get(socket.id);
  
  if (connection?.diagramId) {
    handleLeaveDiagram(io, socket, { diagramId: connection.diagramId });
  }

  // Remove from active connections
  activeConnections.delete(socket.id);
}

/**
 * Cleanup stale connections
 */
function cleanupStaleConnections(io) {
  const now = Date.now();
  const staleTimeout = 5 * 60 * 1000; // 5 minutes

  for (const [diagramId, roomUsers] of diagramRooms) {
    for (const [socketId, user] of roomUsers) {
      // Check if socket is still connected
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) {
        roomUsers.delete(socketId);
        activeConnections.delete(socketId);
      }
    }

    // Clean up empty rooms
    if (roomUsers.size === 0) {
      diagramRooms.delete(diagramId);
      tableLocks.delete(diagramId);
    }

    const lockMap = tableLocks.get(diagramId);
    if (lockMap && lockMap.size > 0) {
      let locksChanged = false;
      for (const [nodeId, lock] of lockMap.entries()) {
        if (now - lock.lastActivityAt > FREE_TIER_LIMITS.TABLE_LOCK_TIMEOUT_MS) {
          lockMap.delete(nodeId);
          const lockOwner = roomUsers.get(lock.socketId);
          if (lockOwner) {
            lockOwner.selectedNodes = [];
            lockOwner.selectedEdges = [];
          }

          io.to(`diagram:${diagramId}`).emit('selection-change', {
            userId: lock.userId,
            username: lock.username,
            socketId: lock.socketId,
            selectedNodes: [],
            selectedEdges: []
          });

          io.to(`diagram:${diagramId}`).emit('table-lock-released', {
            diagramId,
            nodeId,
            userId: lock.userId,
            username: lock.username,
            reason: 'timeout',
          });

          locksChanged = true;
        }
      }

      if (lockMap.size === 0) {
        tableLocks.delete(diagramId);
      }

      if (locksChanged) {
        emitLocksUpdate(io, diagramId);
      }
    }
  }
}

/**
 * Get room statistics (for monitoring/debugging)
 */
function getRoomStats() {
  const stats = {
    totalConnections: activeConnections.size,
    activeRooms: diagramRooms.size,
    rooms: {}
  };

  for (const [diagramId, roomUsers] of diagramRooms) {
    stats.rooms[diagramId] = {
      userCount: roomUsers.size,
      users: Array.from(roomUsers.values()).map(u => ({
        username: u.username,
        permission: u.permission
      }))
    };
  }

  return stats;
}

module.exports = {
  initializeSocket,
  getRoomStats,
  getServerStats,
  activeConnections,
  diagramRooms
};
