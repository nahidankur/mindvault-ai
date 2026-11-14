import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from '@mindvault/shared';

export const metadata: Metadata = {
  title: `${APP_NAME} — Personal Knowledge Vault`,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
