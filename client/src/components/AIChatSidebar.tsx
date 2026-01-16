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
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-purple-200">Schema Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400">Save your diagram first to use AI assistant</p>
          </div>
        </div>
      )}

      {/* Read-only mode */}
      {diagramId && isReadOnly && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-gray-400">Edit access required to use AI assistant</p>
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
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-3">
                    👋 Hi! I'm your AI database architect. Describe what you're building and I'll generate a schema for you.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Try one of these:
                  </p>
                </div>
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 rounded-lg text-sm text-gray-300 transition-colors"
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
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Schema indicator */}
                  {message.generatedSchema && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
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
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">Generating schema...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending schema preview */}
          {pendingSchema && (
            <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">
                  Generated: {pendingSchema.nodes.length} tables, {pendingSchema.edges.length} relationships
                </span>
                {explanation && (
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    {showExplanation ? 'Hide' : 'Show'} explanation
                  </button>
                )}
              </div>
              
              {/* Explanation panel */}
              {showExplanation && explanation && (
                <div className="mb-3 p-3 bg-gray-900 rounded-lg text-xs space-y-2 max-h-40 overflow-y-auto">
                  {explanation.tables && (
                    <div>
                      <p className="font-medium text-gray-300 mb-1">Tables:</p>
                      {explanation.tables.map((t, i) => (
                        <p key={i} className="text-gray-400">• <span className="text-purple-400">{t.name}</span>: {t.purpose}</p>
                      ))}
                    </div>
                  )}
                  {explanation.relationships && explanation.relationships.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-300 mb-1">Relationships:</p>
                      {explanation.relationships.map((r, i) => (
                        <p key={i} className="text-gray-400">• {r.from} → {r.to} ({r.type})</p>
                      ))}
                    </div>
                  )}
                  {explanation.bestPractices && explanation.bestPractices.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-300 mb-1">Best Practices Applied:</p>
                      {explanation.bestPractices.map((bp, i) => (
                        <p key={i} className="text-gray-400">✓ {bp}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleApplySchema}
                  className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apply Schema
                </button>
                <button
                  onClick={handleRejectSchema}
                  className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="px-4 py-2 bg-red-900/50 border-t border-red-700 flex-shrink-0">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your database schema..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                rows={2}
                maxLength={2000}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatSidebar;
