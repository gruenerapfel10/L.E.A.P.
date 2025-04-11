'use client';

import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, ChevronDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  pt: 'Português'
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  // Load the UI language from the user profile on mount
  useEffect(() => {
    const loadUserLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('ui_language')
            .eq('id', user.id)
            .single();
            
          if (data?.ui_language && !error) {
            i18n.changeLanguage(data.ui_language);
          }
        } catch (error) {
          console.error("Error loading user language preference:", error);
        }
      }
    };
    
    loadUserLanguage();
  }, [supabase, i18n]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'pt', name: 'Português' },
  ];

  const handleLanguageChange = async (langCode: string) => {
    setIsLoading(true);
    try {
      // Change i18n language for UI
      i18n.changeLanguage(langCode);
      
      // Save language preference to user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            ui_language: langCode, 
            native_language: langCode 
          })
          .eq('id', user.id);
          
        if (error) {
          throw error;
        }
        
        toast.success(`Language changed to ${languageNames[langCode]}`);
      }
    } catch (error) {
      console.error("Error saving language preference:", error);
      toast.error("Failed to save language preference");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-foreground/80 hover:text-primary hover:bg-white/[0.02] dark:hover:bg-white/[0.02]"
          disabled={isLoading}
        >
          <Languages className="h-4 w-4 mr-2" />
          <span className="text-sm">{languageNames[i18n.language] || 'English'}</span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] bg-white/80 dark:bg-[#030014]/80 backdrop-blur-[8px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{lang.name}</span>
            {i18n.language === lang.code && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 