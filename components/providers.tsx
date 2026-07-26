'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f9fafb',
            border: '1px solid #1f2937',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </SessionProvider>
  );
}

