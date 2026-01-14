/**
 * Socket.IO Server Configuration with Authentication
 * 
 * Features:
 * - JWT-based authentication for socket connections
 * - Redis adapter support for horizontal scaling
 * - Room management for diagram collaboration
 * - Presence system for online users
 * - Connection health monitoring
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Diagram = require('../models/Diagram');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');

// Store for active connections and rooms
const activeConnections = new Map(); // socketId -> { userId, diagramId, username }
const diagramRooms = new Map(); // diagramId -> Set of { socketId, userId, username, cursor }

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
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);
    
    // Store connection info
    activeConnections.set(socket.id, {
      userId: socket.user.id,
      username: socket.user.username,
      diagramId: null
    });

    // Join diagram room for collaboration
    socket.on('join-diagram', async (data) => {
      await handleJoinDiagram(io, socket, data);
    });

    // Leave diagram room
    socket.on('leave-diagram', (data) => {
      handleLeaveDiagram(io, socket, data);
    });

    // Handle cursor position updates
    socket.on('cursor-move', (data) => {
      handleCursorMove(io, socket, data);
    });

    // Handle real-time diagram updates (Yjs sync)
    socket.on('sync-update', (data) => {
      handleSyncUpdate(io, socket, data);
    });

    // Handle awareness updates (presence)
    socket.on('awareness-update', (data) => {
      handleAwarenessUpdate(io, socket, data);
    });

    // Handle node operations
    socket.on('node-add', (data) => handleNodeOperation(io, socket, 'node-add', data));
    socket.on('node-update', (data) => handleNodeOperation(io, socket, 'node-update', data));
    socket.on('node-delete', (data) => handleNodeOperation(io, socket, 'node-delete', data));
    socket.on('node-move', (data) => handleNodeOperation(io, socket, 'node-move', data));

    // Handle edge operations
    socket.on('edge-add', (data) => handleEdgeOperation(io, socket, 'edge-add', data));
    socket.on('edge-delete', (data) => handleEdgeOperation(io, socket, 'edge-delete', data));

    // Handle selection changes
    socket.on('selection-change', (data) => {
      handleSelectionChange(io, socket, data);
    });

    // Request current diagram state (for late joiners)
    socket.on('request-state', (data) => {
      handleRequestState(io, socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      handleDisconnect(io, socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.username}:`, error);
    });
  });

  // Heartbeat to clean up stale connections
  setInterval(() => {
    cleanupStaleConnections(io);
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
      diagramId: diagramId
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
      joinedAt: Date.now()
    });

    // Get current users in the room
    const currentUsers = Array.from(roomUsers.values()).map(u => ({
      id: u.socketId,
      odUserId: u.userId,
      username: u.username,
      permission: u.permission,
      cursor: u.cursor
    }));

    // Notify the joining user
    socket.emit('joined-diagram', {
      diagramId,
      permission,
      users: currentUsers,
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

  // Remove from room tracking
  const roomUsers = diagramRooms.get(diagramId);
  if (roomUsers) {
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
 * Handle cursor position updates
 */
function handleCursorMove(io, socket, data) {
  const { diagramId, x, y } = data;
  
  if (!diagramId) return;

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

  const roomName = `diagram:${diagramId}`;
  socket.to(roomName).emit('selection-change', {
    userId: socket.user.id,
    username: socket.user.username,
    selectedNodes: selectedNodes || [],
    selectedEdges: selectedEdges || []
  });
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
  activeConnections,
  diagramRooms
};
