'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pt'] as const;
const FAST_TRANSLATIONS = {
  en: 'FAST',
  de: 'SCHNELL',
  es: 'RÁPIDO',
  fr: 'RAPIDE',
  it: 'VELOCE',
  ja: '速く',
  pt: 'RÁPIDO'
};

const COUNTRY_GRADIENTS = {
  en: 'from-blue-500 via-white to-red-500', // USA colors
  de: 'from-black via-red-500 to-yellow-500', // Germany colors
  es: 'from-red-500 via-yellow-500 to-red-500', // Spain colors
  fr: 'from-blue-500 via-white to-red-500', // France colors
  it: 'from-green-500 via-white to-red-500', // Italy colors
  ja: 'from-red-500 via-white to-red-500', // Japan colors
  pt: 'from-green-500 via-red-500 to-yellow-500', // Portugal colors
};

export function AnimatedFast() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentLanguage = languages[currentIndex];
    const targetText = FAST_TRANSLATIONS[currentLanguage];
    const speed = isDeleting ? 30 : 70; // Faster typing and deleting

    const timer = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(targetText.substring(0, displayText.length - 1));
        if (displayText.length === 0) {
          setIsDeleting(false);
          setCurrentIndex((currentIndex + 1) % languages.length);
        }
      } else {
        setDisplayText(targetText.substring(0, displayText.length + 1));
        if (displayText === targetText) {
          setTimeout(() => setIsDeleting(true), 1500); // Shorter pause
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex]);

  const currentGradient = COUNTRY_GRADIENTS[languages[currentIndex]];

  return (
    <span className={`inline-block italic font-extrabold bg-gradient-to-r ${currentGradient} bg-clip-text text-transparent animate-gradient-x px-1 transform -skew-x-12 min-w-[4ch] h-[1.2em] font-mono`}>
      {displayText}
    </span>
  );
} 