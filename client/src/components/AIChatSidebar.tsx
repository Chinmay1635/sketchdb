import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiAPI } from '../services/api';
import { aiToasts } from '../utils/toast';

interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  generatedSchema?: {
    nodes: any[];
    edges: any[];
  } | null;
  schemaApplied?: boolean;
  timestamp: string;
}

interface SchemaExplanation {
  tables?: Array<{ name: string; purpose: string }>;
  relationships?: Array<{ from: string; to: string; type: string; reason: string }>;
  bestPractices?: string[];
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string | null;
  currentSchema: { nodes: any[]; edges: any[] };
  onApplySchema: (nodes: any[], edges: any[]) => void;
  isReadOnly?: boolean;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  isOpen,
  onClose,
  diagramId,
  currentSchema,
  onApplySchema,
  isReadOnly = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSchema, setPendingSchema] = useState<{ nodes: any[]; edges: any[]; messageId: string } | null>(null);
  const [explanation, setExplanation] = useState<SchemaExplanation | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history when dialog opens
  useEffect(() => {
    if (isOpen && diagramId) {
      loadChatHistory();
    }
  }, [isOpen, diagramId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isReadOnly) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isReadOnly]);

  const loadChatHistory = async () => {
    if (!diagramId) return;
    
    try {
      const response = await aiAPI.getChat(diagramId);
      if (response.success) {
        setMessages(response.chat.messages || []);
      }
    } catch (err: any) {
      console.error('Failed to load chat:', err);
      // Don't show error for empty chat
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !diagramId || isLoading || isReadOnly) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await aiAPI.sendMessage(diagramId, userMessage, currentSchema);

      if (response.success) {
        // Remove temp message and add real messages
        setMessages(prev => {
          const filtered = prev.filter(m => !m._id.startsWith('temp-'));
          return [
            ...filtered,
            { ...tempUserMessage, _id: `user-${Date.now()}` },
            {
              _id: response.response.messageId,
              role: 'assistant',
              content: response.response.message,
              generatedSchema: response.response.schema,
              schemaApplied: false,
              timestamp: new Date().toISOString(),
            },
          ];
        });

        // If schema was generated, show it as pending
        if (response.response.schema) {
          setPendingSchema({
            nodes: response.response.schema.nodes,
            edges: response.response.schema.edges,
            messageId: response.response.messageId,
          });
          setExplanation(response.response.explanation);
        }
      } else {
        setError(response.message || 'Failed to get response');
        // Remove optimistic message
        setMessages(prev => prev.filter(m => !m._id.startsWith('temp-')));
      }
    } catch (err: any) {
      aiToasts.schemaError(err.message);
      setError(err.message || 'Failed to send message');
      setMessages(prev => prev.filter(m => !m._id.startsWith('temp-')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySchema = useCallback(async () => {
    if (!pendingSchema || !diagramId) return;

    try {
      // Apply schema to diagram
      onApplySchema(pendingSchema.nodes, pendingSchema.edges);

      // Mark as applied
      await aiAPI.markSchemaApplied(diagramId, pendingSchema.messageId);

      // Update local state
      setMessages(prev =>
        prev.map(m =>
          m._id === pendingSchema.messageId ? { ...m, schemaApplied: true } : m
        )
      );

      setPendingSchema(null);
      setExplanation(null);
    } catch (err: any) {
      aiToasts.schemaError('Failed to apply schema');
      setError('Failed to apply schema');
    }
  }, [pendingSchema, diagramId, onApplySchema]);

  const handleRejectSchema = () => {
    setPendingSchema(null);
    setExplanation(null);
  };

  const handleClearChat = async () => {
    if (!diagramId || !confirm('Clear all chat history for this diagram?')) return;

    try {
      await aiAPI.clearChat(diagramId);
      setMessages([]);
      setPendingSchema(null);
      setExplanation(null);
    } catch (err: any) {
      setError('Failed to clear chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Suggested prompts for empty state
  const suggestedPrompts = [
    "Create a user authentication system with users, sessions, and password resets",
    "Design an e-commerce database with products, orders, and customers",
    "Build a blog system with posts, comments, and categories",
    "Create a project management schema with tasks, projects, and team members",
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed right-0 top-0 h-full w-96 shadow-xl z-50 flex flex-col"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.98)',
        borderLeft: '1px solid #2a2a3a',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ 
          background: 'linear-gradient(135deg, rgba(136, 85, 255, 0.3), rgba(0, 255, 255, 0.2))',
          borderBottom: '1px solid #2a2a3a'
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #8855ff, #00ffff)',
              boxShadow: '0 0 15px rgba(136, 85, 255, 0.3)'
            }}
          >
            <svg className="w-5 h-5" style={{ color: '#0a0a0f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 
              className="font-bold text-sm uppercase tracking-wider"
              style={{ 
                color: '#f0f0ff',
                fontFamily: "'Orbitron', sans-serif"
              }}
            >
              AI Assistant
            </h3>
            <p 
              className="text-xs"
              style={{ 
                color: '#8855ff',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              // Schema Generator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 transition-colors"
              style={{ color: '#8a8a9a' }}
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 transition-colors"
            style={{ color: '#8a8a9a' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* No diagram selected */}
      {!diagramId && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3" style={{ color: '#4a4a5a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
              Save your diagram first to use AI assistant
            </p>
          </div>
        </div>
      )}

      {/* Read-only mode */}
      {diagramId && isReadOnly && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3" style={{ color: '#4a4a5a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
              Edit access required to use AI assistant
            </p>
          </div>
        </div>
      )}

      {/* Chat content */}
      {diagramId && !isReadOnly && (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Empty state with suggestions */}
            {messages.length === 0 && (
              <div className="space-y-4">
                <div 
                  className="p-4"
                  style={{ 
                    backgroundColor: 'rgba(26, 26, 36, 0.8)',
                    border: '1px solid #2a2a3a'
                  }}
                >
                  <p 
                    className="text-sm mb-3"
                    style={{ color: '#c0c0d0', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    👋 Hi! I'm your AI database architect. Describe what you're building and I'll generate a schema for you.
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    // Try one of these:
                  </p>
                </div>
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left p-3 text-sm transition-all duration-300"
                    style={{ 
                      backgroundColor: 'rgba(26, 26, 36, 0.6)',
                      border: '1px solid #2a2a3a',
                      color: '#c0c0d0',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8855ff';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(136, 85, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a3a';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] p-3"
                  style={{
                    background: message.role === 'user' 
                      ? 'linear-gradient(135deg, #8855ff, #0088ff)' 
                      : 'rgba(26, 26, 36, 0.8)',
                    border: message.role === 'user' ? 'none' : '1px solid #2a2a3a',
                    color: message.role === 'user' ? '#f0f0ff' : '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    boxShadow: message.role === 'user' ? '0 0 20px rgba(136, 85, 255, 0.3)' : 'none'
                  }}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Schema indicator */}
                  {message.generatedSchema && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="flex items-center gap-2 text-xs">
                        {message.schemaApplied ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Schema applied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                            </svg>
                            {message.generatedSchema.nodes?.length || 0} tables generated
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs opacity-50 mt-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div 
                  className="p-3"
                  style={{ 
                    backgroundColor: 'rgba(26, 26, 36, 0.8)',
                    border: '1px solid #2a2a3a'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 animate-bounce" style={{ backgroundColor: '#8855ff', animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 animate-bounce" style={{ backgroundColor: '#8855ff', animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 animate-bounce" style={{ backgroundColor: '#8855ff', animationDelay: '300ms' }}></div>
                    </div>
                    <span 
                      className="text-sm"
                      style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Generating schema...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending schema preview */}
          {pendingSchema && (
            <div 
              className="px-4 py-3 flex-shrink-0"
              style={{ 
                backgroundColor: 'rgba(26, 26, 36, 0.9)',
                borderTop: '1px solid #2a2a3a'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="text-sm font-medium"
                  style={{ color: '#c0c0d0', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Generated: {pendingSchema.nodes.length} tables, {pendingSchema.edges.length} relationships
                </span>
                {explanation && (
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs transition-colors"
                    style={{ color: '#8855ff', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {showExplanation ? '// Hide' : '// Show'} explanation
                  </button>
                )}
              </div>
              
              {/* Explanation panel */}
              {showExplanation && explanation && (
                <div 
                  className="mb-3 p-3 text-xs space-y-2 max-h-40 overflow-y-auto"
                  style={{ 
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {explanation.tables && (
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#c0c0d0' }}>Tables:</p>
                      {explanation.tables.map((t, i) => (
                        <p key={i} style={{ color: '#8a8a9a' }}>• <span style={{ color: '#8855ff' }}>{t.name}</span>: {t.purpose}</p>
                      ))}
                    </div>
                  )}
                  {explanation.relationships && explanation.relationships.length > 0 && (
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#c0c0d0' }}>Relationships:</p>
                      {explanation.relationships.map((r, i) => (
                        <p key={i} style={{ color: '#8a8a9a' }}>{r.from} → {r.to} ({r.type})</p>
                      ))}
                    </div>
                  )}
                  {explanation.bestPractices && explanation.bestPractices.length > 0 && (
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#c0c0d0' }}>Best Practices Applied:</p>
                      {explanation.bestPractices.map((bp, i) => (
                        <p key={i} style={{ color: '#8a8a9a' }}>✓ {bp}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleApplySchema}
                  className="flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
                  style={{ 
                    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                    color: '#0a0a0f',
                    fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apply Schema
                </button>
                <button
                  onClick={handleRejectSchema}
                  className="py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  style={{ 
                    backgroundColor: 'rgba(42, 42, 58, 0.8)',
                    color: '#c0c0d0',
                    border: '1px solid #2a2a3a',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div 
              className="px-4 py-2 flex-shrink-0"
              style={{ 
                backgroundColor: 'rgba(255, 51, 102, 0.1)',
                borderTop: '1px solid rgba(255, 51, 102, 0.3)'
              }}
            >
              <p 
                className="text-sm"
                style={{ color: '#ff3366', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Input area */}
          <div 
            className="p-4 flex-shrink-0"
            style={{ borderTop: '1px solid #2a2a3a' }}
          >
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="// Describe your database schema..."
                className="flex-1 px-3 py-2 text-sm resize-none focus:outline-none"
                style={{ 
                  backgroundColor: 'rgba(10, 10, 15, 0.8)',
                  border: '1px solid #2a2a3a',
                  color: '#c0c0d0',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
                rows={2}
                maxLength={2000}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 transition-all duration-300"
                style={{ 
                  background: !input.trim() || isLoading 
                    ? 'rgba(42, 42, 58, 0.8)' 
                    : 'linear-gradient(135deg, #8855ff, #00ffff)',
                  color: !input.trim() || isLoading ? '#4a4a5a' : '#0a0a0f',
                  cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: !input.trim() || isLoading ? 'none' : '0 0 15px rgba(136, 85, 255, 0.3)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p 
              className="text-xs mt-2"
              style={{ color: '#4a4a5a', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatSidebar;
