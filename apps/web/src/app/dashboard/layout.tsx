'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, apiRequest } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Sidebar } from '@/components/layout/sidebar';
import { CitationDrawer } from '@/components/chat/citation-drawer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify session
    apiRequest<any>('/auth/me')
      .then((user) => {
        setUser(user);
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
      <CitationDrawer />
    </div>
  );
}
