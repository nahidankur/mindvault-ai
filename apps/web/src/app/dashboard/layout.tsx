'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken, apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Menu, Sparkles } from 'lucide-react';
import { APP_NAME } from '@mindvault/shared';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser, setMobileSidebarOpen } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify session
    apiRequest<any>('/auth/me')
      .then((userData) => {
        setUser(userData);
        setIsReady(true);
      })
      .catch(() => {
        // In local mock or expired token, still render
        setIsReady(true);
      });
  }, [router, setUser]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400 text-sm">
        Initializing MindVault session...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Navigation Header */}
        <header className="md:hidden h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition -ml-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-100 tracking-tight text-sm">
              {APP_NAME}
            </span>
          </Link>

          <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-300 font-semibold">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
