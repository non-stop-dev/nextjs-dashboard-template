// components/auth/session-provider.tsx
'use client'; // ¡Importante! Este componente debe ser un Client Component

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import React from 'react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}