'use client';

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Languages, Check, ChevronDown, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import i18nClient from "@/lib/i18n.client";
import { supportedLngs } from "@/lib/languages";
import { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import type { User } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  pt: 'Português'
};

export function Navbar() {
  const { t, i18n: i18nInstance } = useTranslation();
  const supabase = createClient();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const changeLanguage = (lng: string) => {
    i18nInstance.changeLanguage(lng);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-slate-200/5 dark:border-white/[0.02] bg-white/[0.02] dark:bg-[#030014]/[0.02] backdrop-blur-[8px] supports-[backdrop-filter]:bg-white/[0.02] dark:supports-[backdrop-filter]:bg-[#030014]/[0.02]">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                LEAP
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/#features"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {isMounted ? t('nav.features') : null}
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {isMounted ? t('nav.howItWorks') : null}
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-foreground/80 hover:text-primary hover:bg-white/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <Languages className="h-4 w-4" />
                  <span className="ml-2">{languageNames[i18nInstance.language] || 'English'}</span>
                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] bg-white/80 dark:bg-[#030014]/80 backdrop-blur-[8px]">
                {supportedLngs.map((lng: string) => (
                  <DropdownMenuItem 
                    key={lng} 
                    onClick={() => changeLanguage(lng)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{languageNames[lng]}</span>
                    {i18nInstance.language === lng && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />

            {/* Conditional Auth Buttons */}
            {!isLoading && user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground/80 hover:text-primary hover:bg-white/[0.02] dark:hover:bg-white/[0.02]"
                  asChild
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-foreground/80 hover:text-primary hover:bg-white/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : !isLoading ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground/80 hover:text-primary hover:bg-white/[0.02] dark:hover:bg-white/[0.02]"
                  asChild
                >
                  <Link href="/login">{t('nav.login')}</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 text-white hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-lg shadow-indigo-500/20"
                  asChild
                >
                  <Link href="/signup">{t('nav.getStarted')}</Link>
                </Button>
              </>
            ) : (
              <div className="h-8 w-36"></div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 inline-flex items-center justify-center text-foreground/80 hover:text-primary hover:bg-white/[0.02] dark:hover:bg-white/[0.02]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              href="/#features"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {isMounted ? t('nav.features') : null}
            </Link>
            <Link
              href="/#how-it-works"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {isMounted ? t('nav.howItWorks') : null}
            </Link>
             {/* Language Switcher Mobile */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-base font-medium text-foreground/80 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:text-primary"
                >
                  <Languages className="h-5 w-5 mr-2" />
                  {languageNames[i18nInstance.language] || 'English'}
                  <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[calc(100vw-1rem)] bg-white/80 dark:bg-[#030014]/80 backdrop-blur-[8px]">
                {supportedLngs.map((lng: string) => (
                  <DropdownMenuItem 
                    key={lng} 
                    onClick={() => { changeLanguage(lng); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{languageNames[lng]}</span>
                    {i18nInstance.language === lng && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="border-t border-slate-200/5 dark:border-white/[0.02] pb-3 pt-4">
            <div className="space-y-1 px-2">
              {/* Conditional Auth Buttons Mobile */}
              {!isLoading && user ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base font-medium text-foreground/80 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                    asChild
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-5 w-5" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base font-medium text-foreground/80 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:text-primary"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </>
              ) : !isLoading ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base font-medium text-foreground/80 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                    asChild
                  >
                    <Link href="/login">{t('nav.login')}</Link>
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 text-white hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-lg shadow-indigo-500/20"
                    onClick={() => setIsMobileMenuOpen(false)}
                    asChild
                  >
                    <Link href="/signup">{t('nav.getStarted')}</Link>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
} 