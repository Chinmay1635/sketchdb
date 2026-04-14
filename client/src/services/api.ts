import { API_BASE_URL } from '../config/runtime';

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
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please reconnect and try again.');
  }

  const token = getToken();
  const isDesktopClient = typeof window !== 'undefined' && Boolean(window.electronAPI?.isDesktop);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(isDesktopClient && { 'X-Client-Platform': 'desktop' }),
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
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  verifyOTP: async (email: string, otp: string) => {
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
    return apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  login: async (email: string, password: string, turnstileToken?: string) => {
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
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  getCurrentUser: async () => {
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
    return apiRequest('/diagrams');
  },

  // Get all diagrams user has access to (owned + collaborated) - like Canva's "My Designs"
  getMyDiagrams: async () => {
    return apiRequest('/diagrams/my-diagrams');
  },

  getById: async (id: string) => {
    return apiRequest(`/diagrams/${id}`);
  },

  // Get diagram by URL params (username and slug)
  getBySlug: async (username: string, slug: string) => {
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
    return apiRequest(`/diagrams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(diagramData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/diagrams/${id}`, {
      method: 'DELETE',
    });
  },

  duplicate: async (id: string) => {
    return apiRequest(`/diagrams/${id}/duplicate`, {
      method: 'POST',
    });
  },

  // Add collaborator to diagram
  addCollaborator: async (id: string, email: string, permission: 'view' | 'edit') => {
    return apiRequest(`/diagrams/${id}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    });
  },

  // Remove collaborator from diagram
  removeCollaborator: async (id: string, userId: string) => {
    return apiRequest(`/diagrams/${id}/collaborators/${userId}`, {
      method: 'DELETE',
    });
  },

  // Update diagram visibility (public/private)
  updateVisibility: async (id: string, isPublic: boolean) => {
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
    return apiRequest(`/ai/chat/${diagramId}`);
  },

  // Send a message and get AI response
  sendMessage: async (
    diagramId: string,
    message: string,
    currentSchema?: { nodes: any[]; edges: any[] }
  ) => {
    return apiRequest(`/ai/chat/${diagramId}`, {
      method: 'POST',
      body: JSON.stringify({ message, currentSchema }),
    });
  },

  // Mark a schema as applied
  markSchemaApplied: async (diagramId: string, messageId: string) => {
    return apiRequest(`/ai/chat/${diagramId}/apply/${messageId}`, {
      method: 'POST',
    });
  },

  // Clear chat history
  clearChat: async (diagramId: string) => {
    return apiRequest(`/ai/chat/${diagramId}`, {
      method: 'DELETE',
    });
  },
};

export { getToken, setToken, removeToken };
