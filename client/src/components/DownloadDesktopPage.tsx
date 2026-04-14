import React from 'react';
import { useNavigate } from 'react-router-dom';

const DOWNLOAD_FILE_NAME = 'SketchDB 1.0.0.exe';
const DOWNLOAD_URL = import.meta.env.VITE_DESKTOP_DOWNLOAD_URL || '/downloads/SketchDB%201.0.0.exe';

const requirementItems = [
  { label: 'Operating System', value: 'Windows 10 or Windows 11 (64-bit)' },
  { label: 'RAM', value: '4 GB minimum (8 GB recommended)' },
  { label: 'Storage', value: 'At least 500 MB free space' },
  { label: 'Internet', value: 'Required for login, collaboration, and cloud sync' },
];

const DownloadDesktopPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-ghost relative overflow-hidden" style={{ backgroundColor: '#09090b' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(20, 184, 166, 0.12) 0%, transparent 45%)' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 90%, rgba(20, 184, 166, 0.08) 0%, transparent 40%)' }} />

      <nav className="h-16 border-b" style={{ backgroundColor: 'rgba(9, 9, 11, 0.85)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#14b8a6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>

          <span className="text-sm uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#14b8a6' }}>
            Desktop Download
          </span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-8">
        <section
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'rgba(17, 17, 20, 0.85)',
            border: '1px solid rgba(20, 184, 166, 0.2)',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45)'
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ backgroundColor: 'rgba(20, 184, 166, 0.12)', border: '1px solid rgba(20, 184, 166, 0.25)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#14b8a6' }} />
            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#14b8a6' }}>
              Stable Build
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa' }}>
            Download SketchDB for Windows
          </h1>

          <p className="text-sm sm:text-base mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}>
            Install the desktop app for the same SketchDB interface you use on web, optimized for Windows 10/11.
          </p>

          <div className="grid gap-3 mb-8">
            <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#0c0c0f', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#a1a1aa' }}>Version</span>
              <span className="text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#fafafa' }}>1.0.0</span>
            </div>

            <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#0c0c0f', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#a1a1aa' }}>File</span>
              <span className="text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#fafafa' }}>{DOWNLOAD_FILE_NAME}</span>
            </div>
          </div>

          <a
            href={DOWNLOAD_URL}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-lg font-bold uppercase tracking-widest transition-all"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.8rem',
              backgroundColor: '#14b8a6',
              color: '#09090b'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
            Download for Desktop
          </a>

          <p className="text-xs mt-4" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#71717a' }}>
            If download does not start, open this link directly: {DOWNLOAD_URL}
          </p>
        </section>

        <section className="rounded-2xl p-8" style={{ backgroundColor: '#111114', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa' }}>
            System Requirements
          </h2>

          <div className="space-y-3 mb-8">
            {requirementItems.map((item) => (
              <div key={item.label} className="rounded-lg px-4 py-3" style={{ backgroundColor: '#0c0c0f', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#71717a' }}>{item.label}</p>
                <p className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e4e4e7' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg px-4 py-4" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.25)' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#14b8a6' }}>
              Coming Soon
            </p>
            <p className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#d4d4d8' }}>
              Linux and macOS installers are in progress. Windows support is currently stable and recommended.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DownloadDesktopPage;
