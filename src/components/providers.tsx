"use client"

import { ThemeProvider } from "@/components/theme-provider";
import { I18nextProvider } from 'react-i18next';
import i18nClient from '@/lib/i18n.client';
import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/navbar";
import { Toaster } from 'sonner';
import { LoadingScreen } from "./loading-screen";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const showNavbar = !pathname.startsWith('/dashboard') && !pathname.startsWith('/login') && !pathname.startsWith('/signup');

  return (
    <I18nextProvider i18n={i18nClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            {showNavbar && <Navbar />}
            {children}
            <Toaster richColors position="top-right" />
          </>
        )}
      </ThemeProvider>
    </I18nextProvider>
  );
} 