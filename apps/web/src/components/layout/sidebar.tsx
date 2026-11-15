'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Sparkles,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { clearAuthToken, apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { APP_NAME, ConversationSummary } from '@mindvault/shared';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Knowledge Vault', href: '/dashboard/knowledge', icon: BookOpen },
  { name: 'RAG Assistant', href: '/dashboard/chat', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    setUser,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
  } = useAppStore();

  useEffect(() => {
    // Fetch conversations list for sidebar
    apiRequest<ConversationSummary[]>('/chat/conversations')
      .then((data) => setConversations(data || []))
      .catch(() => {});
  }, [setConversations]);

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    if (isMobileSidebarOpen) setMobileSidebarOpen(false);
    router.push('/login');
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    router.push('/dashboard/chat');
    if (isMobileSidebarOpen) setMobileSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    router.push('/dashboard/chat');
    if (isMobileSidebarOpen) setMobileSidebarOpen(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      await apiRequest(`/chat/conversations/${id}`, { method: 'DELETE' });
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err: any) {
      alert(`Could not delete: ${err?.message}`);
    }
  };

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, setMobileSidebarOpen]);

  // Sidebar content component (reused in both desktop and mobile drawer)
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-3 mb-4 shrink-0">
          <Link
            href="/dashboard"
            onClick={() => isMobile && setMobileSidebarOpen(false)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-tight text-base leading-tight">
                {APP_NAME}
              </h1>
              <p className="text-[10px] text-indigo-400 font-mono tracking-wider">
                GROUNDED RAG
              </p>
            </div>
          </Link>

          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 overflow-y-auto flex-1 pr-1 pb-4">
          {navigation.map((item) => {
            const isItemActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <div key={item.name} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => isMobile && setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isItemActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isItemActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>

                {/* Nested Chat History directly under RAG Assistant */}
                {item.href === '/dashboard/chat' && (
                  <div className="mt-1 ml-4 pl-2.5 border-l border-slate-800 space-y-1">
                    {/* New Chat Button */}
                    <button
                      type="button"
                      onClick={handleStartNewChat}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition group ${
                        pathname === '/dashboard/chat' && !activeConversationId
                          ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                          : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Chat</span>
                      </span>
                    </button>

                    {/* Chat History Items */}
                    <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                      {conversations.length === 0 ? (
                        <p className="px-2 py-1.5 text-[11px] text-slate-500 italic">
                          No past chats
                        </p>
                      ) : (
                        conversations.map((conv) => {
                          const isChatActive =
                            pathname === '/dashboard/chat' && activeConversationId === conv.id;

                          return (
                            <div
                              key={conv.id}
                              onClick={() => handleSelectConversation(conv.id)}
                              className={`group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                                isChatActive
                                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-medium'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <MessageSquare
                                  className={`w-3 h-3 shrink-0 ${
                                    isChatActive
                                      ? 'text-indigo-400'
                                      : 'text-slate-500 group-hover:text-slate-400'
                                  }`}
                                />
                                <span className="truncate">{conv.title}</span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-rose-400 transition shrink-0"
                                title="Delete chat"
                                aria-label="Delete chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="pt-3 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="truncate mr-2">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user?.fullName || 'Active User'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@vault.ai'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (md and up) */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-800 bg-slate-950/70 backdrop-blur-md p-4 min-h-screen relative z-40 shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile Navigation Drawer (below md) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Sheet */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Drawer"
            className="relative z-50 w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 p-4 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 h-full overflow-y-auto"
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
