import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Floating database icons for hero background
const FloatingIcons: React.FC = () => {
  const icons = [
    { top: '10%', left: '5%', delay: '0s', size: 'w-8 h-8' },
    { top: '20%', right: '10%', delay: '1s', size: 'w-6 h-6' },
    { top: '60%', left: '8%', delay: '0.5s', size: 'w-10 h-10' },
    { top: '70%', right: '15%', delay: '1.5s', size: 'w-7 h-7' },
    { top: '85%', left: '20%', delay: '2s', size: 'w-5 h-5' },
  ];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, i) => (
        <div
          key={i}
          className={`absolute ${icon.size} opacity-10`}
          style={{
            top: icon.top,
            left: icon.left,
            right: icon.right,
            animation: `float 6s ease-in-out infinite`,
            animationDelay: icon.delay,
          }}
        >
          <svg className="w-full h-full" style={{ color: '#14b8a6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen text-ghost relative overflow-hidden" style={{ backgroundColor: '#09090b' }}>
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.08) 0%, transparent 50%)' }} />
      
      {/* Floating elements */}
      <FloatingIcons />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="absolute inset-0 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', borderColor: 'rgba(255, 255, 255, 0.06)' }} />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#14b8a6' }}>
              <svg className="w-5 h-5" style={{ color: '#09090b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa' }}>
              SKETCH<span style={{ color: '#14b8a6' }}>DB</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm transition-colors"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#a1a1aa'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <button
              onClick={() => navigate('/playground')}
              className="relative px-6 py-2.5 text-sm font-semibold rounded-lg overflow-hidden transition-all"
              style={{ 
                fontFamily: "'Space Grotesk', sans-serif",
                backgroundColor: '#14b8a6',
                color: '#09090b'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
            >
              <span className="relative uppercase tracking-widest text-xs font-bold">
                {isAuthenticated ? 'Open App' : 'Launch'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className={`transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              {/* Status badge */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full"
                style={{ 
                  backgroundColor: 'rgba(20, 184, 166, 0.1)',
                  border: '1px solid rgba(20, 184, 166, 0.2)'
                }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#14b8a6' }} />
                <span className="text-xs uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#14b8a6' }}>
                  Real-time Collaboration
                </span>
              </div>
              
              {/* Main heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span style={{ color: '#fafafa' }}>Design Your</span>
                <br />
                <span style={{ color: '#fafafa' }}>Database</span>
                <br />
                <span style={{ 
                  background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>Visually</span>
              </h1>
              
              {/* Description */}
              <div className="text-base mb-10 space-y-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}>
                <p>Create tables with drag-and-drop simplicity</p>
                <p>Define relationships & constraints intuitively</p>
                <p>Export production-ready SQL in seconds</p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/playground')}
                  className="group relative px-8 py-4 font-bold uppercase tracking-widest overflow-hidden transition-all duration-200 rounded-lg"
                  style={{ 
                    fontFamily: "'Space Grotesk', sans-serif",
                    backgroundColor: '#14b8a6',
                    color: '#09090b',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#14b8a6';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span className="relative flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Building
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    const featuresSection = document.getElementById('features');
                    featuresSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 uppercase tracking-widest transition-all duration-200 rounded-lg"
                  style={{ 
                    fontFamily: "'Space Grotesk', sans-serif",
                    border: '1px solid #27272a',
                    color: '#a1a1aa',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.5)';
                    e.currentTarget.style.color = '#14b8a6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.color = '#a1a1aa';
                  }}
                >
                  Learn More
                </button>
              </div>
            </div>
            
            {/* Right content - Terminal preview */}
            <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="relative">
                {/* Subtle glow effect */}
                <div className="absolute -inset-4 blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3), transparent)' }} />
                
                {/* Terminal window */}
                <div 
                  className="relative rounded-xl overflow-hidden"
                  style={{ 
                    backgroundColor: '#0c0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  {/* Terminal header */}
                  <div 
                    className="flex items-center gap-2 px-4 py-3"
                    style={{ 
                      backgroundColor: '#111114',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                    <span className="ml-3 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#71717a' }}>sketchdb_schema.sql</span>
                  </div>
                  
                  {/* Terminal content */}
                  <div className="p-6 text-sm leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <p style={{ color: '#71717a' }}>-- Generated by SketchDB</p>
                    <p style={{ color: '#71717a' }}>-- {new Date().toLocaleDateString()}</p>
                    <br />
                    <p><span style={{ color: '#14b8a6' }}>CREATE TABLE</span> <span style={{ color: '#fafafa' }}>users</span> (</p>
                    <p className="pl-4"><span style={{ color: '#f59e0b' }}>id</span> <span style={{ color: '#a1a1aa' }}>SERIAL</span> <span style={{ color: '#14b8a6' }}>PRIMARY KEY</span>,</p>
                    <p className="pl-4"><span style={{ color: '#f59e0b' }}>email</span> <span style={{ color: '#a1a1aa' }}>VARCHAR(255)</span> <span style={{ color: '#14b8a6' }}>UNIQUE NOT NULL</span>,</p>
                    <p className="pl-4"><span style={{ color: '#f59e0b' }}>created_at</span> <span style={{ color: '#a1a1aa' }}>TIMESTAMP</span> <span style={{ color: '#14b8a6' }}>DEFAULT NOW()</span></p>
                    <p style={{ color: '#fafafa' }}>);</p>
                    <br />
                    <p><span style={{ color: '#14b8a6' }}>CREATE TABLE</span> <span style={{ color: '#fafafa' }}>diagrams</span> (</p>
                    <p className="pl-4"><span style={{ color: '#f59e0b' }}>id</span> <span style={{ color: '#a1a1aa' }}>SERIAL</span> <span style={{ color: '#14b8a6' }}>PRIMARY KEY</span>,</p>
                    <p className="pl-4"><span style={{ color: '#f59e0b' }}>user_id</span> <span style={{ color: '#a1a1aa' }}>INT</span> <span style={{ color: '#14b8a6' }}>REFERENCES users(id)</span>,</p>
                    <p className="pl-4"><span style={{ color: '#f59e0b' }}>name</span> <span style={{ color: '#a1a1aa' }}>VARCHAR(100)</span> <span style={{ color: '#14b8a6' }}>NOT NULL</span></p>
                    <p style={{ color: '#fafafa' }}>);</p>
                    <br />
                    <p style={{ color: '#22c55e' }}>-- ✓ Schema ready for production</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.3), transparent)' }} />
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs uppercase tracking-widest mb-4 block" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#14b8a6' }}>
              // CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa' }}>
              Power. Precision. Speed.
            </h2>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa', maxWidth: '32rem', margin: '0 auto' }}>
              Everything you need to design professional database schemas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />, title: 'Visual Editor', description: 'Drag-and-drop interface for creating tables and relationships.' },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />, title: 'SQL Generation', description: 'Export production-ready SQL for PostgreSQL, MySQL, SQLite, and more.' },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />, title: 'Real-time Collab', description: 'Work together with your team. See changes instantly.' },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />, title: 'AI Assistant', description: 'Describe your schema in plain English. AI generates it for you.' },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />, title: 'Export Options', description: 'Export as PNG, PDF, or SQL. Share via public links.' },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />, title: 'Undo / Redo', description: 'Full history with 50-state undo/redo support.' }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group relative p-6 rounded-xl transition-all duration-300"
                style={{ backgroundColor: '#111114', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div className="w-12 h-12 mb-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                  <svg className="w-6 h-6" style={{ color: '#14b8a6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{feature.icon}</svg>
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6" style={{ backgroundColor: '#0c0c0f' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[{ value: '4+', label: 'SQL Dialects' }, { value: '∞', label: 'Tables' }, { value: '50', label: 'Undo States' }, { value: 'Live', label: 'Collaboration' }].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#14b8a6' }}>{stat.value}</div>
                <div className="text-xs uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#71717a' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(20, 184, 166, 0.05) 0%, transparent 50%)' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-widest mb-4 block" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}>// READY TO BUILD?</span>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fafafa' }}>
            Start Designing<br /><span style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Your Database</span>
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}>
            No signup required. Jump straight into the playground and start creating.
          </p>
          <button
            onClick={() => navigate('/playground')}
            className="group relative inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-widest rounded-lg transition-all"
            style={{ fontFamily: "'Space Grotesk', sans-serif", backgroundColor: '#14b8a6', color: '#09090b', fontSize: '0.875rem' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0d9488'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#14b8a6'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Launch Playground
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#14b8a6' }}>
                <svg className="w-4 h-4" style={{ color: '#09090b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#a1a1aa' }}>
                SKETCH<span style={{ color: '#14b8a6' }}>DB</span>
              </span>
            </div>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: '#71717a' }} onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'} onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <p className="text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#71717a' }}>© {new Date().getFullYear()} SketchDB. Built with <span style={{ color: '#dc2626' }}>♥</span> for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
