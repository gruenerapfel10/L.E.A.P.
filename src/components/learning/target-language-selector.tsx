'use client';

import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Target, ChevronDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { supportedLngs } from '@/lib/i18n';

const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  pt: 'Português'
};

interface TargetLanguageSelectorProps {
  currentTargetLanguage: string;
  userId: string;
}

export function TargetLanguageSelector({ currentTargetLanguage, userId }: TargetLanguageSelectorProps) {
  const [targetLanguage, setTargetLanguage] = useState(currentTargetLanguage || 'de');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === targetLanguage) return;
    
    setIsLoading(true);
    try {
      // Save target language preference to user profile
      const { error } = await supabase
        .from('profiles')
        .update({ target_language: langCode })
        .eq('id', userId);
        
      if (error) throw error;
      
      setTargetLanguage(langCode);
      toast.success(`Target language changed to ${languageNames[langCode]}`);
      
      // Refresh the page to update the module list
      window.location.reload();
    } catch (error) {
      console.error("Error saving target language preference:", error);
      toast.error("Failed to save target language preference");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-foreground/80 hover:text-primary"
          disabled={isLoading}
        >
          <Target className="h-4 w-4 mr-2" />
          <span className="text-sm">Learning: {languageNames[targetLanguage] || 'German'}</span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] bg-white/80 dark:bg-[#030014]/80 backdrop-blur-[8px]">
        {supportedLngs.map((langCode) => (
          <DropdownMenuItem
            key={langCode}
            onClick={() => handleLanguageChange(langCode)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{languageNames[langCode]}</span>
            {targetLanguage === langCode && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 