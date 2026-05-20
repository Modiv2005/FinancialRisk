import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatAPI } from '../services/api';
import { Send, Bot, User, Sparkles, MessageSquare, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, ChatResponse } from '../types';

export default function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([
    'Show suspicious transactions',
    'Summarize compliance violations',
    'What is our current risk score?',
    'Forecast revenue for next quarter',
    'Generate audit observations',
    'Show top vendor spending patterns',
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => chatAPI.send(message, sessionId),
    onSuccess: (res) => {
      const data: ChatResponse = res.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        citations: data.citations,
      }]);
      setSessionId(data.session_id);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    },
  });

  const handleSend = (text?: string) => {
    const message = text || input.trim();
    if (!message || sendMutation.isPending) return;
    
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInput('');
    sendMutation.mutate(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setSuggestions([
      'Show suspicious transactions',
      'Summarize compliance violations',
      'What is our current risk score?',
      'Forecast revenue for next quarter',
    ]);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4 max-w-[1400px]">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-100">FinRisk AI Assistant</h3>
              <p className="text-xs text-accent-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-accent-400 rounded-full" />
                Online • Powered by Enterprise AI Engine
              </p>
            </div>
          </div>
          <button onClick={clearChat} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-200/40 hover:text-surface-200 transition-colors" title="New conversation">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center mb-6 animate-float">
                <Sparkles className="w-10 h-10 text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-2">Financial Intelligence at Your Fingertips</h2>
              <p className="text-surface-200/50 text-sm max-w-md mb-8">
                Ask about transactions, anomalies, compliance, risk scores, forecasts, or audit findings.
                I can analyze your enterprise financial data in real-time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-left p-3 rounded-xl bg-surface-800/30 border border-primary-500/10 text-sm text-surface-200/70 hover:text-surface-100 hover:border-primary-500/25 hover:bg-surface-800/50 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-primary-400 mb-1" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-primary-600/20 border border-primary-500/20 text-surface-100'
                  : 'bg-surface-800/40 border border-primary-500/5 text-surface-200'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-content text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-primary-500/10">
                        <p className="text-[10px] text-surface-200/40 uppercase tracking-wider mb-1">Sources</p>
                        {msg.citations.map((c, ci) => (
                          <span key={ci} className="inline-block text-[11px] text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded mr-1 mb-1">
                            {c.source}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-surface-200/60" />
                </div>
              )}
            </div>
          ))}

          {sendMutation.isPending && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-surface-800/40 rounded-2xl px-5 py-4 border border-primary-500/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-surface-200/40">Analyzing your data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions (after conversation started) */}
        {messages.length > 0 && suggestions.length > 0 && (
          <div className="px-6 pb-2 flex gap-2 flex-wrap">
            {suggestions.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/15 text-primary-300 hover:bg-primary-500/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-primary-500/10">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about transactions, anomalies, compliance, risk..."
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-800/50 border border-primary-500/10 text-surface-100 placeholder:text-surface-200/30 focus:border-primary-500/30 focus:outline-none focus:ring-1 focus:ring-primary-500/20 transition-all resize-none text-sm"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendMutation.isPending}
              className="p-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white disabled:opacity-30 hover:from-primary-500 hover:to-primary-400 transition-all glow-primary"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
