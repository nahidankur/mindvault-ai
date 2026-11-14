'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { MessageSourceCitation, ConversationSummary } from '@mindvault/shared';
import { Send, Bot, User, Bookmark, Sparkles, RefreshCw, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSourceCitation[];
}

export function ChatView() {
  const { setSelectedCitation, activeCollectionId } = useAppStore();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const data = await apiRequest<ConversationSummary[]>('/chat/conversations');
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id);
      }
    } catch {
      // Offline / Unauthenticated
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await apiRequest<{ messages: any[] }>(`/chat/conversations/${convId}`);
      setMessages(data.messages);
    } catch {
      //
    }
  };

  const createNewConversation = async () => {
    try {
      const newConv = await apiRequest<any>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Conversation',
          collectionId: activeCollectionId || undefined,
        }),
      });
      setConversations([newConv, ...conversations]);
      setActiveConversationId(newConv.id);
      setMessages([]);
    } catch (err: any) {
      alert(`Could not start conversation: ${err.message}`);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const newConv = await apiRequest<any>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: inputQuestion.slice(0, 30) }),
      });
      setConversations([newConv, ...conversations]);
      targetConvId = newConv.id;
      setActiveConversationId(newConv.id);
    }

    const questionText = inputQuestion.trim();
    setInputQuestion('');

    // Append user message immediately
    const tempUserMsg: ChatMessageUI = {
      id: `temp-u-${Date.now()}`,
      role: 'user',
      content: questionText,
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      // Call backend chat endpoint
      const result = await apiRequest<any>(`/chat/conversations/${targetConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ question: questionText }),
      });

      const assistantMsg: ChatMessageUI = {
        id: result.assistantMessage.id,
        role: 'assistant',
        content: result.assistantMessage.content,
        sources: result.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error retrieving answer: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Grounded Knowledge Assistant</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Zero Hallucination
          </span>
        </div>

        <button
          onClick={createNewConversation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </header>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              Ask anything about your saved knowledge
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Every factual answer is verified against your saved notes with pgvector similarity and full-text keyword search.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Citations Pill Bar */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Sources:</span>
                    {msg.sources.map((source) => (
                      <button
                        key={source.chunkId}
                        onClick={() => setSelectedCitation(source)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
                        title={source.snippet}
                      >
                        <Bookmark className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Source {source.rank}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1 text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1 text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Searching knowledge vault and verifying citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask a question about your saved notes..."
            className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex items-center justify-center shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
