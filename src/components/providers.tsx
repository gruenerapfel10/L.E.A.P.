"use client"

import { ThemeProvider } from "@/components/theme-provider";
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/navbar";
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = !pathname.startsWith('/dashboard') && !pathname.startsWith('/login') && !pathname.startsWith('/signup');

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {showNavbar && <Navbar />}
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </I18nextProvider>
  );
} 