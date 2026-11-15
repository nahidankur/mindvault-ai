'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { MessageSourceCitation, ConversationSummary } from '@mindvault/shared';
import {
  Send,
  Bot,
  User,
  Bookmark,
  Sparkles,
  RefreshCw,
  Plus,
  Compass,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSourceCitation[];
}

export function ChatView() {
  const {
    setSelectedCitation,
    activeConversationId,
    setActiveConversationId,
    conversations,
    setConversations,
  } = useAppStore();

  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If there are conversations and no active chat selected, pick the latest one
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversationId]);

  // Load messages when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadMessages = async (convId: string) => {
    try {
      const data = await apiRequest<{ messages: any[] }>(`/chat/conversations/${convId}`);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    // If we are already on an empty new chat with no messages, do nothing!
    if (!activeConversationId && messages.length === 0) {
      return;
    }
    // Switch to empty new chat state without creating anything in DB yet
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSend = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = (promptOverride || inputQuestion).trim();
    if (!textToSend || isLoading) return;

    let targetConvId = activeConversationId;
    let isBrandNewConversation = false;

    // Only create a new conversation thread in DB when the user actually submits their first message!
    if (!targetConvId) {
      isBrandNewConversation = true;
      try {
        const newConv = await apiRequest<ConversationSummary>('/chat/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: textToSend.length > 35 ? `${textToSend.slice(0, 32)}...` : textToSend,
          }),
        });
        targetConvId = newConv.id;
        setActiveConversationId(newConv.id);
        setConversations([newConv, ...conversations]);
      } catch (err: any) {
        alert(`Failed to create conversation: ${err?.message}`);
        return;
      }
    }

    setInputQuestion('');

    // Append user message immediately
    const tempUserMsg: ChatMessageUI = {
      id: `temp-u-${Date.now()}`,
      role: 'user',
      content: textToSend,
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      // Call backend chat endpoint
      const result = await apiRequest<any>(`/chat/conversations/${targetConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ question: textToSend }),
      });

      const assistantMsg: ChatMessageUI = {
        id: result.assistantMessage.id,
        role: 'assistant',
        content: result.assistantMessage.content,
        sources: result.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If it was a brand new conversation, reload conversation list from backend
      // so that the auto-generated title from backend appears in the left sidebar
      if (isBrandNewConversation) {
        apiRequest<ConversationSummary[]>('/chat/conversations')
          .then((updatedList) => setConversations(updatedList || []))
          .catch(() => {});
      }
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
    <div className="flex-1 flex flex-col h-[calc(100dvh-3.5rem)] md:h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur shrink-0">
        <div className="flex items-center gap-2 min-w-0 mr-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-200 truncate">
            Grounded Knowledge Assistant
          </span>
          <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
            Zero Hallucination
          </span>
        </div>

        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </header>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-100">
              Ask anything about your saved knowledge
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Every answer is grounded strictly in your personal vault notes with hybrid pgvector search and verified source citations.
            </p>

            {/* Starter Prompt Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              <button
                type="button"
                onClick={() => handleSend(undefined, 'What topics are covered in my saved knowledge notes?')}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/40 transition text-xs text-slate-300 space-y-1 group"
              >
                <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-medium">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore notes</span>
                </div>
                <p className="text-slate-400 text-[11px] line-clamp-2">
                  &quot;What topics are covered in my saved knowledge notes?&quot;
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSend(undefined, 'Provide a concise summary of my latest research notes.')}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/40 transition text-xs text-slate-300 space-y-1 group"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Summarize knowledge</span>
                </div>
                <p className="text-slate-400 text-[11px] line-clamp-2">
                  &quot;Provide a concise summary of my latest research notes.&quot;
                </p>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-2xl md:max-w-3xl ${
                msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed overflow-hidden ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="prose prose-invert prose-xs sm:prose-sm max-w-none break-words">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Citations Pill Bar */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium mr-1">
                      Sources:
                    </span>
                    {msg.sources.map((source) => (
                      <button
                        key={source.chunkId}
                        onClick={() => setSelectedCitation(source)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
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
          <div className="flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-2xl mr-auto">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1 text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
              <span>Verifying citations & generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/30 shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask a question about your saved notes..."
            className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[42px]"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex items-center justify-center shadow-md shadow-indigo-600/30 min-h-[42px] min-w-[42px]"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
