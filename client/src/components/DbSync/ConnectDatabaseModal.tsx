import React, { useState } from 'react';

interface ConnectDatabaseModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error?: string | null;
  connectionId: string | null;
  diagramId: string;
  onClose: () => void;
  onConnect: (data: {
    diagramId: string;
    name: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  }) => Promise<void>;
  onTestConnection: () => Promise<void>;
}

export const ConnectDatabaseModal: React.FC<ConnectDatabaseModalProps> = ({
  isOpen,
  isLoading,
  error,
  connectionId,
  diagramId,
  onClose,
  onConnect,
  onTestConnection,
}) => {
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(3306);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onConnect({
      diagramId,
      name,
      host,
      port,
      database,
      username,
      password,
      ssl,
    });
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-xl rounded-xl p-5 sm:p-6"
        style={{
          backgroundColor: 'rgba(17, 17, 20, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          className="text-sm sm:text-base font-bold uppercase tracking-widest"
          style={{ color: '#14b8a6', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          // Connect MySQL Database
        </h2>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Connection name"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ backgroundColor: '#11111c', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder="Host"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ backgroundColor: '#11111c', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              type="number"
              value={port}
              onChange={(event) => setPort(Number(event.target.value))}
              placeholder="Port"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ backgroundColor: '#11111c', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              value={database}
              onChange={(event) => setDatabase(event.target.value)}
              placeholder="Database"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ backgroundColor: '#11111c', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ backgroundColor: '#11111c', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ backgroundColor: '#11111c', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={ssl}
              onChange={(event) => setSsl(event.target.checked)}
            />
            Use SSL
          </label>

          {error && (
            <div className="text-xs text-red-400">{error}</div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-widest"
              style={{ background: '#14b8a6', color: '#09090b' }}
            >
              {isLoading ? 'Saving...' : 'Save Connection'}
            </button>
            <button
              type="button"
              disabled={!connectionId || isLoading}
              onClick={onTestConnection}
              className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              Test Connection
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
