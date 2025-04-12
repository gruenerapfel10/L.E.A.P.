'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFlagIconClass } from '@/lib/languages';

interface TargetLanguageSelectorProps {
  currentTargetLanguage: string;
  onLanguageChange: (newLanguage: string) => void;
  userId: string;
}

const languageOptions = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'pt', name: 'Português' },
];

export function TargetLanguageSelector({ 
  currentTargetLanguage, 
  onLanguageChange,
  userId 
}: TargetLanguageSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === currentTargetLanguage) return;
    
    setIsLoading(true);
    try {
      // Optimistically update the UI
      onLanguageChange(newLanguage);
      
      // Update the database
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ target_language: newLanguage })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      toast.success(`Target language changed to ${languageOptions.find(lang => lang.code === newLanguage)?.name}`);
    } catch (error) {
      console.error('Error updating target language:', error);
      toast.error('Failed to update target language');
      // Revert the optimistic update
      onLanguageChange(currentTargetLanguage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select
      value={currentTargetLanguage}
      onValueChange={handleLanguageChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
        <div className="flex items-center gap-2">
          <span className={`${getFlagIconClass(currentTargetLanguage)} text-lg`}></span>
          <SelectValue placeholder="Select target language" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languageOptions.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span className={`${getFlagIconClass(lang.code)} text-lg`}></span>
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 