const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
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

  getById: async (id: string) => {
    return apiRequest(`/diagrams/${id}`);
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
};

export { getToken, setToken, removeToken };
