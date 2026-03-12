import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Animated typing effect component
const TypeWriter: React.FC<{ text: string; delay?: number }> = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);
  
  return <span>{displayText}<span className="cursor-blink"></span></span>;
};

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
          className={`absolute ${icon.size} opacity-20`}
          style={{
            top: icon.top,
            left: icon.left,
            right: icon.right,
            animation: `float 6s ease-in-out infinite`,
            animationDelay: icon.delay,
          }}
        >
          <svg className="w-full h-full text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-void text-ghost relative overflow-hidden">
      {/* Animated grid background */}
      <div className="fixed inset-0 grid-bg opacity-50" />
      
      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-void via-transparent to-void pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-magenta/5 pointer-events-none" />
      
      {/* Floating elements */}
      <FloatingIcons />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="absolute inset-0 bg-void/80 backdrop-blur-xl border-b border-steel/30" />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-lg blur-lg group-hover:bg-neon-cyan/30 transition-all" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-lg flex items-center justify-center border border-neon-cyan/30">
                <svg className="w-5 h-5 text-void" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <span className="font-display text-xl font-bold tracking-wider text-pure">
              SKETCH<span className="text-neon-cyan">DB</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-mono text-silver hover:text-neon-cyan transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <button
              onClick={() => navigate('/playground')}
              className="relative group px-6 py-2.5 font-mono text-sm font-semibold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-blue opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-blue blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
              <span className="relative text-void uppercase tracking-widest text-xs">
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 border border-neon-cyan/30 bg-neon-cyan/5 rounded-sm">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="font-mono text-xs text-neon-cyan uppercase tracking-widest">
                  Real-time Collaboration
                </span>
              </div>
              
              {/* Main heading */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-pure">DESIGN</span>
                <br />
                <span className="text-pure">YOUR DATABASE</span>
                <br />
                <span className="gradient-text-cyber text-glow-cyan">VISUALLY</span>
              </h1>
              
              {/* Terminal-style description */}
              <div className="font-mono text-sm text-silver mb-10 space-y-1">
                <p><span className="text-neon-cyan">$</span> Create tables with drag-and-drop</p>
                <p><span className="text-neon-magenta">$</span> Define relationships & constraints</p>
                <p><span className="text-neon-green">$</span> Export production-ready SQL</p>
                <p><span className="text-neon-orange">$</span> Collaborate in real-time</p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/playground')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-blue font-mono font-bold text-void uppercase tracking-widest overflow-hidden transition-all hover:scale-105"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
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
                  className="px-8 py-4 border border-steel hover:border-neon-cyan/50 font-mono text-silver hover:text-neon-cyan uppercase tracking-widest transition-all"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
                >
                  Learn More
                </button>
              </div>
            </div>
            
            {/* Right content - Terminal preview */}
            <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20 blur-3xl opacity-50" />
                
                {/* Terminal window */}
                <div className="relative bg-abyss border border-steel rounded-lg overflow-hidden">
                  {/* Terminal header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-carbon border-b border-steel">
                    <div className="w-3 h-3 rounded-full bg-neon-red/80" />
                    <div className="w-3 h-3 rounded-full bg-neon-orange/80" />
                    <div className="w-3 h-3 rounded-full bg-neon-green/80" />
                    <span className="ml-3 font-mono text-xs text-chrome">sketchdb_schema.sql</span>
                  </div>
                  
                  {/* Terminal content */}
                  <div className="p-6 font-mono text-sm leading-relaxed">
                    <p className="text-chrome">-- Generated by SketchDB</p>
                    <p className="text-chrome">-- {new Date().toLocaleDateString()}</p>
                    <br />
                    <p><span className="text-neon-magenta">CREATE TABLE</span> <span className="text-neon-cyan">users</span> (</p>
                    <p className="pl-4"><span className="text-neon-orange">id</span> <span className="text-neon-blue">SERIAL</span> <span className="text-neon-green">PRIMARY KEY</span>,</p>
                    <p className="pl-4"><span className="text-neon-orange">email</span> <span className="text-neon-blue">VARCHAR(255)</span> <span className="text-neon-green">UNIQUE NOT NULL</span>,</p>
                    <p className="pl-4"><span className="text-neon-orange">created_at</span> <span className="text-neon-blue">TIMESTAMP</span> <span className="text-neon-green">DEFAULT NOW()</span></p>
                    <p>);</p>
                    <br />
                    <p><span className="text-neon-magenta">CREATE TABLE</span> <span className="text-neon-cyan">diagrams</span> (</p>
                    <p className="pl-4"><span className="text-neon-orange">id</span> <span className="text-neon-blue">SERIAL</span> <span className="text-neon-green">PRIMARY KEY</span>,</p>
                    <p className="pl-4"><span className="text-neon-orange">user_id</span> <span className="text-neon-blue">INT</span> <span className="text-neon-green">REFERENCES users(id)</span>,</p>
                    <p className="pl-4"><span className="text-neon-orange">name</span> <span className="text-neon-blue">VARCHAR(100)</span> <span className="text-neon-green">NOT NULL</span></p>
                    <p>);</p>
                    <br />
                    <p className="text-neon-green">-- ✓ Schema ready for production</p>
                  </div>
                </div>
                
                {/* Decorative corners */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-neon-cyan/50" />
                <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan/50" />
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-neon-magenta/50" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-neon-magenta/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        {/* Section divider */}
        <div className="absolute top-0 left-0 right-0 h-px animated-border" />
        
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <span className="font-mono text-xs text-neon-cyan uppercase tracking-[0.3em] mb-4 block">
              // CAPABILITIES
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-pure mb-4">
              POWER<span className="text-neon-magenta">.</span>PRECISION<span className="text-neon-cyan">.</span>SPEED
            </h2>
            <p className="font-body text-silver max-w-xl mx-auto">
              Everything you need to design professional database schemas, from rapid prototyping to production deployment.
            </p>
          </div>
          
          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group relative p-6 bg-gradient-to-br from-graphite to-carbon border border-steel hover:border-neon-cyan/50 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 mb-6 bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-neon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-pure mb-3 tracking-wide">
                VISUAL EDITOR
              </h3>
              <p className="font-body text-sm text-silver leading-relaxed">
                Drag-and-drop interface for creating tables, defining columns, and establishing relationships with zero SQL knowledge required.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="group relative p-6 bg-gradient-to-br from-graphite to-carbon border border-steel hover:border-neon-cyan/50 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 mb-6 bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-pure mb-3 tracking-wide">
                SQL GENERATION
              </h3>
              <p className="font-body text-sm text-silver leading-relaxed">
                Export production-ready SQL for PostgreSQL, MySQL, SQLite, and SQL Server with proper syntax and optimizations.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="group relative p-6 bg-gradient-to-br from-graphite to-carbon border border-steel hover:border-neon-cyan/50 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 mb-6 bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-pure mb-3 tracking-wide">
                REAL-TIME COLLAB
              </h3>
              <p className="font-body text-sm text-silver leading-relaxed">
                Work together with your team in real-time. See cursors, selections, and changes instantly as they happen.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="group relative p-6 bg-gradient-to-br from-graphite to-carbon border border-steel hover:border-neon-cyan/50 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 mb-6 bg-neon-magenta/10 border border-neon-magenta/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-neon-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-pure mb-3 tracking-wide">
                AI ASSISTANT
              </h3>
              <p className="font-body text-sm text-silver leading-relaxed">
                Describe your data model in plain English. Our AI generates complete schemas with tables, relationships, and constraints.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="group relative p-6 bg-gradient-to-br from-graphite to-carbon border border-steel hover:border-neon-cyan/50 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 mb-6 bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-pure mb-3 tracking-wide">
                EXPORT OPTIONS
              </h3>
              <p className="font-body text-sm text-silver leading-relaxed">
                Export as PNG, PDF, or SQL files. Share diagrams via public links or embed them in your documentation.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="group relative p-6 bg-gradient-to-br from-graphite to-carbon border border-steel hover:border-neon-cyan/50 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 mb-6 bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-pure mb-3 tracking-wide">
                UNDO / REDO
              </h3>
              <p className="font-body text-sm text-silver leading-relaxed">
                Full history support with 50-state undo/redo. Experiment freely knowing you can always revert changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6 bg-carbon/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="font-display text-4xl sm:text-5xl font-bold text-neon-cyan mb-2">4+</div>
              <div className="font-mono text-xs text-chrome uppercase tracking-widest">SQL Dialects</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl sm:text-5xl font-bold text-neon-magenta mb-2">∞</div>
              <div className="font-mono text-xs text-chrome uppercase tracking-widest">Tables</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl sm:text-5xl font-bold text-neon-green mb-2">50</div>
              <div className="font-mono text-xs text-chrome uppercase tracking-widest">Undo States</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl sm:text-5xl font-bold text-neon-orange mb-2">Live</div>
              <div className="font-mono text-xs text-chrome uppercase tracking-widest">Collaboration</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent" />
        
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="font-mono text-xs text-neon-magenta uppercase tracking-[0.3em] mb-4 block">
            // READY TO BUILD?
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-pure mb-6">
            START DESIGNING<br />
            <span className="gradient-text-cyber">YOUR DATABASE</span>
          </h2>
          <p className="font-body text-lg text-silver mb-10 max-w-xl mx-auto">
            No signup required. Jump straight into the playground and start creating your database schema in seconds.
          </p>
          
          <button
            onClick={() => navigate('/playground')}
            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-neon-cyan to-neon-blue font-mono font-bold text-void uppercase tracking-widest overflow-hidden transition-all hover:scale-105"
            style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-3 text-sm">
              Launch Playground
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-steel/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-void" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="font-display text-sm font-bold tracking-wider text-ghost">
                SKETCH<span className="text-neon-cyan">DB</span>
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-chrome hover:text-neon-cyan transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
            
            <p className="font-mono text-xs text-chrome">
              © {new Date().getFullYear()} SketchDB. Built with <span className="text-neon-red">♥</span> for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
