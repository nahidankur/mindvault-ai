'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  MessageSquare,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { clearAuthToken } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { APP_NAME } from '@mindvault/shared';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Knowledge Vault', href: '/dashboard/knowledge', icon: BookOpen },
  { name: 'RAG Assistant', href: '/dashboard/chat', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAppStore();

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <aside className="w-64 flex flex-col justify-between border-r border-slate-800 bg-slate-950/70 backdrop-blur-md p-4 min-h-screen">
      <div>
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-6">
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

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="truncate">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user?.fullName || 'Active User'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@vault.ai'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
