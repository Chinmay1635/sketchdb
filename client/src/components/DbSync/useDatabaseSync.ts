import { useCallback, useState } from 'react';
import { NormalizedSchema } from '../../utils/diagramToSchema';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = (): string | null => {
  return localStorage.getItem('sketchdb_token');
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export interface MigrationPlan {
  _id: string;
  diagramId: string;
  connectionId: string;
  sqlStatements: string[];
  riskWarnings: string[];
  status: 'draft' | 'approved' | 'applied' | 'failed';
  createdAt?: string;
}

export const useDatabaseSync = () => {
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MigrationPlan | null>(null);
  const [history, setHistory] = useState<MigrationPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectDatabase = useCallback(async (data: {
    diagramId: string;
    name: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/db-sync/connections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const connection = response.connection;
      setConnectionId(connection?._id || null);
      return connection;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    if (!connectionId) {
      setError('Save a connection before testing.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiRequest(`/db-sync/connections/${connectionId}/test`, { method: 'POST' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connectionId]);

  const generateMigration = useCallback(async (diagramId: string, diagramSchema: NormalizedSchema) => {
    if (!connectionId) {
      setError('No database connection found.');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/db-sync/migrations/generate', {
        method: 'POST',
        body: JSON.stringify({ connectionId, diagramId, diagramSchema }),
      });
      setCurrentPlan(response.plan);
      return response.plan as MigrationPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate migration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connectionId]);

  const approvePlan = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/db-sync/migrations/${planId}/approve`, { method: 'POST' });
      setCurrentPlan(response.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve migration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyPlan = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/db-sync/migrations/${planId}/apply`, { method: 'POST' });
      setCurrentPlan(response.plan);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply migration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (diagramId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/db-sync/migrations/history/${diagramId}`);
      setHistory(response.plans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    connectionId,
    currentPlan,
    history,
    isLoading,
    error,
    connectDatabase,
    testConnection,
    generateMigration,
    approvePlan,
    applyPlan,
    fetchHistory,
    setError,
  };
};
