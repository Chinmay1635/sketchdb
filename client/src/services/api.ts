import { API_BASE_URL } from '../config/runtime';

const isDesktopClient = typeof window !== 'undefined' && Boolean(window.electronAPI?.isDesktop);

const LOCAL_DB_KEY = 'sketchdb_desktop_db_v1';

type LocalUser = {
  id: string;
  username: string;
  email: string;
  prn: string;
  password: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type LocalCollaborator = {
  user: string;
  permission: 'view' | 'edit';
};

type LocalDiagram = {
  _id: string;
  user: string;
  slug: string;
  isPublic: boolean;
  collaborators: LocalCollaborator[];
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  sqlContent: string;
  viewport: { x: number; y: number; zoom: number };
  createdAt: string;
  updatedAt: string;
};

type LocalDb = {
  users: LocalUser[];
  diagrams: LocalDiagram[];
};

const createId = (prefix: string): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
};

const createSlug = (): string => {
  return Math.random().toString(36).slice(2, 12);
};

const loadLocalDb = (): LocalDb => {
  const raw = localStorage.getItem(LOCAL_DB_KEY);
  if (!raw) {
    return { users: [], diagrams: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      diagrams: Array.isArray(parsed?.diagrams) ? parsed.diagrams : [],
    };
  } catch {
    return { users: [], diagrams: [] };
  }
};

const saveLocalDb = (db: LocalDb): void => {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const getLocalAuthUser = (): LocalUser => {
  const token = getToken();
  if (!token) {
    throw new Error('Not authorized, no token provided');
  }

  const db = loadLocalDb();
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    removeToken();
    throw new Error('User not found');
  }

  return user;
};

const toPublicUser = (user: LocalUser) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  prn: user.prn,
});

const findDiagramById = (db: LocalDb, id: string) => db.diagrams.find((d) => d._id === id);

const getOwnerUsername = (db: LocalDb, userId: string): string => {
  return db.users.find((u) => u.id === userId)?.username || 'Unknown';
};

const toDiagramResponse = (db: LocalDb, diagram: LocalDiagram, viewerId?: string) => {
  const isOwner = viewerId === diagram.user;
  const collaborator = diagram.collaborators.find((c) => c.user === viewerId);
  const permission = isOwner ? 'owner' : (collaborator?.permission || 'view');
  return {
    ...diagram,
    ownerUsername: getOwnerUsername(db, diagram.user),
    permission,
  };
};

// Get stored token
const getToken = (): string | null => {
  return localStorage.getItem('sketchdb_token');
};

// Set token
const setToken = (token: string): void => {
  localStorage.setItem('sketchdb_token', token);
};

// Remove token
const removeToken = (): void => {
  localStorage.removeItem('sketchdb_token');
};

// API request helper
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  if (isDesktopClient) {
    throw new Error('Desktop mode uses local offline APIs and does not call remote endpoints directly.');
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please reconnect and try again.');
  }

  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(isDesktopClient ? { 'X-Client-Platform': 'desktop' } : {}),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('No internet connection. Please reconnect and try again.');
    }

    if (error instanceof TypeError || (error as any)?.name === 'AbortError') {
      throw new Error('Network error: unable to reach server. Check your internet connection and try again.');
    }

    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }
  }

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

// Auth API
export const authAPI = {
  signup: async (userData: {
    username: string;
    email: string;
    prn: string;
    password: string;
    turnstileToken?: string;
  }) => {
    if (isDesktopClient) {
      const username = userData.username?.trim();
      const email = normalizeEmail(userData.email || '');
      const prn = userData.prn?.trim();
      const password = userData.password || '';

      if (!username || username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (!email.endsWith('@walchandsangli.ac.in')) {
        throw new Error('Email must be from @walchandsangli.ac.in domain');
      }
      if (!prn) {
        throw new Error('PRN is required');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const db = loadLocalDb();
      const duplicate = db.users.find(
        (u) => u.email === email || u.username.toLowerCase() === username.toLowerCase() || u.prn === prn
      );

      if (duplicate) {
        if (duplicate.email === email) throw new Error('Email already exists');
        if (duplicate.prn === prn) throw new Error('PRN already exists');
        throw new Error('Username already exists');
      }

      const now = new Date().toISOString();
      const user: LocalUser = {
        id: createId('user'),
        username,
        email,
        prn,
        password,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      };

      db.users.push(user);
      saveLocalDb(db);
      setToken(user.id);

      return {
        success: true,
        message: 'Account created successfully!',
        token: user.id,
        user: toPublicUser(user),
      };
    }

    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  verifyOTP: async (email: string, otp: string) => {
    if (isDesktopClient) {
      const db = loadLocalDb();
      const user = db.users.find((u) => u.email === normalizeEmail(email));
      if (!user) {
        throw new Error('User not found');
      }
      const data = {
        success: true,
        message: 'Email verified successfully',
        token: user.id,
        user: toPublicUser(user),
      };
      setToken(data.token);
      return data;
    }

    const data = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  resendOTP: async (email: string) => {
    if (isDesktopClient) {
      const db = loadLocalDb();
      const user = db.users.find((u) => u.email === normalizeEmail(email));
      if (!user) {
        throw new Error('User not found');
      }
      return { success: true, message: 'OTP sent successfully' };
    }

    return apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  login: async (email: string, password: string, turnstileToken?: string) => {
    if (isDesktopClient) {
      const db = loadLocalDb();
      const normalizedEmail = normalizeEmail(email);
      const user = db.users.find((u) => u.email === normalizedEmail);

      if (!user || user.password !== password) {
        throw new Error('Invalid email or password');
      }

      const data = {
        success: true,
        message: 'Login successful',
        token: user.id,
        user: toPublicUser(user),
      };

      setToken(data.token);
      return data;
    }

    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, turnstileToken }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  forgotPassword: async (email: string) => {
    if (isDesktopClient) {
      return { success: true, message: 'If an account exists with this email, you will receive a reset code.' };
    }

    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    if (isDesktopClient) {
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const db = loadLocalDb();
      const user = db.users.find((u) => u.email === normalizeEmail(email));
      if (!user) {
        throw new Error('User not found');
      }

      user.password = newPassword;
      user.updatedAt = new Date().toISOString();
      saveLocalDb(db);

      return { success: true, message: 'Password reset successfully' };
    }

    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  getCurrentUser: async () => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      return {
        success: true,
        user: toPublicUser(user),
      };
    }

    return apiRequest('/auth/me');
  },

  logout: () => {
    removeToken();
  },

  isAuthenticated: (): boolean => {
    return !!getToken();
  },
};

// Diagrams API
export const diagramsAPI = {
  getAll: async () => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const diagrams = db.diagrams
        .filter((d) => d.user === user.id)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .map((d) => ({
          _id: d._id,
          name: d.name,
          description: d.description,
          slug: d.slug,
          isPublic: d.isPublic,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          username: user.username,
        }));

      return { success: true, count: diagrams.length, diagrams };
    }

    return apiRequest('/diagrams');
  },

  // Get all diagrams user has access to (owned + collaborated) - like Canva's "My Designs"
  getMyDiagrams: async () => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();

      const owned = db.diagrams
        .filter((d) => d.user === user.id)
        .map((d) => ({
          _id: d._id,
          name: d.name,
          description: d.description,
          slug: d.slug,
          isPublic: d.isPublic,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          ownerUsername: user.username,
          permission: 'owner',
          tableCount: d.nodes?.length || 0,
          role: 'owner',
        }));

      const collaborated = db.diagrams
        .filter((d) => d.user !== user.id && d.collaborators.some((c) => c.user === user.id))
        .map((d) => {
          const collaborator = d.collaborators.find((c) => c.user === user.id);
          return {
            _id: d._id,
            name: d.name,
            description: d.description,
            slug: d.slug,
            isPublic: d.isPublic,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            ownerUsername: getOwnerUsername(db, d.user),
            permission: collaborator?.permission || 'view',
            tableCount: d.nodes?.length || 0,
            role: 'collaborator',
          };
        });

      const diagrams = [...owned, ...collaborated].sort(
        (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
      );

      return {
        success: true,
        count: diagrams.length,
        ownedCount: owned.length,
        collaboratedCount: collaborated.length,
        diagrams,
      };
    }

    return apiRequest('/diagrams/my-diagrams');
  },

  getById: async (id: string) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const diagram = findDiagramById(db, id);

      if (!diagram) {
        throw new Error('Diagram not found');
      }

      const isOwner = diagram.user === user.id;
      const isCollaborator = diagram.collaborators.some((c) => c.user === user.id);
      if (!isOwner && !isCollaborator) {
        throw new Error('You do not have permission to view this diagram');
      }

      return {
        success: true,
        diagram: toDiagramResponse(db, diagram, user.id),
      };
    }

    return apiRequest(`/diagrams/${id}`);
  },

  // Get diagram by URL params (username and slug)
  getBySlug: async (username: string, slug: string) => {
    if (isDesktopClient) {
      const db = loadLocalDb();
      const viewer = getToken() ? getLocalAuthUser() : null;

      const owner = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!owner) {
        throw new Error('User not found');
      }

      const diagram = db.diagrams.find((d) => d.user === owner.id && d.slug === slug);
      if (!diagram) {
        throw new Error('Diagram not found');
      }

      const viewerId = viewer?.id;
      const isOwner = viewerId === diagram.user;
      const isCollaborator = !!viewerId && diagram.collaborators.some((c) => c.user === viewerId);
      if (!diagram.isPublic && !isOwner && !isCollaborator) {
        throw new Error('You do not have permission to view this diagram');
      }

      return {
        success: true,
        diagram: toDiagramResponse(db, diagram, viewerId),
      };
    }

    return apiRequest(`/diagrams/by-slug/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`);
  },

  // Update diagram by slug
  updateBySlug: async (
    slug: string,
    diagramData: {
      name: string;
      description?: string;
      nodes: any[];
      edges: any[];
      sqlContent: string;
      viewport?: { x: number; y: number; zoom: number };
      isPublic?: boolean;
    }
  ) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const diagram = db.diagrams.find((d) => d.slug === slug);

      if (!diagram) {
        throw new Error('Diagram not found');
      }

      const isOwner = diagram.user === user.id;
      const canEdit = isOwner || diagram.collaborators.some((c) => c.user === user.id && c.permission === 'edit');
      if (!canEdit) {
        throw new Error('You do not have permission to edit this diagram');
      }

      diagram.name = diagramData.name;
      diagram.description = diagramData.description || '';
      diagram.nodes = diagramData.nodes || [];
      diagram.edges = diagramData.edges || [];
      diagram.sqlContent = diagramData.sqlContent || '';
      diagram.viewport = diagramData.viewport || diagram.viewport;
      if (isOwner && typeof diagramData.isPublic === 'boolean') {
        diagram.isPublic = diagramData.isPublic;
      }
      diagram.updatedAt = new Date().toISOString();
      saveLocalDb(db);

      return {
        success: true,
        message: 'Diagram updated successfully',
        diagram: toDiagramResponse(db, diagram, user.id),
      };
    }

    return apiRequest(`/diagrams/by-slug/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(diagramData),
    });
  },

  create: async (diagramData: {
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    sqlContent: string;
    viewport?: { x: number; y: number; zoom: number };
  }) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const now = new Date().toISOString();

      const diagram: LocalDiagram = {
        _id: createId('diagram'),
        user: user.id,
        slug: createSlug(),
        isPublic: false,
        collaborators: [],
        name: diagramData.name,
        description: diagramData.description || '',
        nodes: diagramData.nodes || [],
        edges: diagramData.edges || [],
        sqlContent: diagramData.sqlContent || '',
        viewport: diagramData.viewport || { x: 0, y: 0, zoom: 1 },
        createdAt: now,
        updatedAt: now,
      };

      db.diagrams.push(diagram);
      saveLocalDb(db);

      return {
        success: true,
        message: 'Diagram created successfully',
        diagram: toDiagramResponse(db, diagram, user.id),
      };
    }

    return apiRequest('/diagrams', {
      method: 'POST',
      body: JSON.stringify(diagramData),
    });
  },

  update: async (
    id: string,
    diagramData: {
      name: string;
      description?: string;
      nodes: any[];
      edges: any[];
      sqlContent: string;
      viewport?: { x: number; y: number; zoom: number };
      isPublic?: boolean;
    }
  ) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const diagram = findDiagramById(db, id);

      if (!diagram) {
        throw new Error('Diagram not found');
      }

      const isOwner = diagram.user === user.id;
      const canEdit = isOwner || diagram.collaborators.some((c) => c.user === user.id && c.permission === 'edit');
      if (!canEdit) {
        throw new Error('You do not have permission to edit this diagram');
      }

      diagram.name = diagramData.name;
      diagram.description = diagramData.description || '';
      diagram.nodes = diagramData.nodes || [];
      diagram.edges = diagramData.edges || [];
      diagram.sqlContent = diagramData.sqlContent || '';
      diagram.viewport = diagramData.viewport || diagram.viewport;
      if (isOwner && typeof diagramData.isPublic === 'boolean') {
        diagram.isPublic = diagramData.isPublic;
      }
      diagram.updatedAt = new Date().toISOString();
      saveLocalDb(db);

      return {
        success: true,
        message: 'Diagram updated successfully',
        diagram: toDiagramResponse(db, diagram, user.id),
      };
    }

    return apiRequest(`/diagrams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(diagramData),
    });
  },

  delete: async (id: string) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const index = db.diagrams.findIndex((d) => d._id === id);
      if (index === -1) {
        throw new Error('Diagram not found');
      }
      if (db.diagrams[index].user !== user.id) {
        throw new Error('You do not have permission to delete this diagram');
      }

      db.diagrams.splice(index, 1);
      saveLocalDb(db);
      return { success: true, message: 'Diagram deleted successfully' };
    }

    return apiRequest(`/diagrams/${id}`, {
      method: 'DELETE',
    });
  },

  duplicate: async (id: string) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const original = findDiagramById(db, id);
      if (!original) {
        throw new Error('Diagram not found');
      }

      const isOwner = original.user === user.id;
      const isCollaborator = original.collaborators.some((c) => c.user === user.id);
      if (!isOwner && !isCollaborator) {
        throw new Error('You do not have permission to duplicate this diagram');
      }

      const now = new Date().toISOString();
      const duplicate: LocalDiagram = {
        ...original,
        _id: createId('diagram'),
        slug: createSlug(),
        user: user.id,
        collaborators: [],
        name: `${original.name} (Copy)`,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      };

      db.diagrams.push(duplicate);
      saveLocalDb(db);

      return {
        success: true,
        message: 'Diagram duplicated successfully',
        diagram: toDiagramResponse(db, duplicate, user.id),
      };
    }

    return apiRequest(`/diagrams/${id}/duplicate`, {
      method: 'POST',
    });
  },

  // Add collaborator to diagram
  addCollaborator: async (id: string, email: string, permission: 'view' | 'edit') => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const diagram = findDiagramById(db, id);
      if (!diagram) {
        throw new Error('Diagram not found');
      }
      if (diagram.user !== user.id) {
        throw new Error('Only owner can add collaborators');
      }

      const targetUser = db.users.find((u) => u.email === normalizeEmail(email));
      if (!targetUser) {
        throw new Error('User not found');
      }
      if (targetUser.id === user.id) {
        throw new Error('Owner is already part of this diagram');
      }

      const existing = diagram.collaborators.find((c) => c.user === targetUser.id);
      if (existing) {
        existing.permission = permission;
      } else {
        diagram.collaborators.push({ user: targetUser.id, permission });
      }
      diagram.updatedAt = new Date().toISOString();
      saveLocalDb(db);

      return {
        success: true,
        message: 'Collaborator added successfully',
        diagram: toDiagramResponse(db, diagram, user.id),
      };
    }

    return apiRequest(`/diagrams/${id}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    });
  },

  // Remove collaborator from diagram
  removeCollaborator: async (id: string, userId: string) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const diagram = findDiagramById(db, id);
      if (!diagram) {
        throw new Error('Diagram not found');
      }
      if (diagram.user !== user.id) {
        throw new Error('Only owner can remove collaborators');
      }

      diagram.collaborators = diagram.collaborators.filter((c) => c.user !== userId);
      diagram.updatedAt = new Date().toISOString();
      saveLocalDb(db);

      return {
        success: true,
        message: 'Collaborator removed successfully',
        diagram: toDiagramResponse(db, diagram, user.id),
      };
    }

    return apiRequest(`/diagrams/${id}/collaborators/${userId}`, {
      method: 'DELETE',
    });
  },

  // Update diagram visibility (public/private)
  updateVisibility: async (id: string, isPublic: boolean) => {
    if (isDesktopClient) {
      const user = getLocalAuthUser();
      const db = loadLocalDb();
      const diagram = findDiagramById(db, id);
      if (!diagram) {
        throw new Error('Diagram not found');
      }
      if (diagram.user !== user.id) {
        throw new Error('Only owner can change visibility');
      }

      diagram.isPublic = isPublic;
      diagram.updatedAt = new Date().toISOString();
      saveLocalDb(db);

      return {
        success: true,
        message: 'Visibility updated successfully',
        diagram: toDiagramResponse(db, diagram, user.id),
      };
    }

    return apiRequest(`/diagrams/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    });
  },
};

// AI Chat API
export const aiAPI = {
  // Get chat history for a diagram
  getChat: async (diagramId: string) => {
    if (isDesktopClient) {
      return { success: true, chat: { messages: [] } };
    }
    return apiRequest(`/ai/chat/${diagramId}`);
  },

  // Send a message and get AI response
  sendMessage: async (
    diagramId: string,
    message: string,
    currentSchema?: { nodes: any[]; edges: any[] }
  ) => {
    if (isDesktopClient) {
      throw new Error('AI assistant is unavailable in offline desktop mode.');
    }
    return apiRequest(`/ai/chat/${diagramId}`, {
      method: 'POST',
      body: JSON.stringify({ message, currentSchema }),
    });
  },

  // Mark a schema as applied
  markSchemaApplied: async (diagramId: string, messageId: string) => {
    if (isDesktopClient) {
      return { success: true, message: 'Schema marked as applied' };
    }
    return apiRequest(`/ai/chat/${diagramId}/apply/${messageId}`, {
      method: 'POST',
    });
  },

  // Clear chat history
  clearChat: async (diagramId: string) => {
    if (isDesktopClient) {
      return { success: true, message: 'Chat cleared' };
    }
    return apiRequest(`/ai/chat/${diagramId}`, {
      method: 'DELETE',
    });
  },
};

export { getToken, setToken, removeToken };
