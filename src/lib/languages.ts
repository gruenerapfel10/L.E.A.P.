// Define supported languages directly to avoid importing from i18n.ts in RSC
export const supportedLngs = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pt'];

// Language names in their native language
export const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  pt: 'Português'
};

// Flag color mappings for different languages
export const flagColors: Record<string, string[]> = {
  'gb': ['#012169', '#FFFFFF', '#C8102E'], // UK flag colors (navy blue, white, red)
  'de': ['#000000', '#DD0000', '#FFCC00'], // German flag colors (black, red, gold)
  'fr': ['#002395', '#FFFFFF', '#ED2939'], // French flag colors (blue, white, red)
  'es': ['#C60B1E', '#FFC400', '#C60B1E'], // Spanish flag colors (red, yellow, red)
  'it': ['#009246', '#FFFFFF', '#CE2B37'], // Italian flag colors (green, white, red)
  'pt': ['#006600', '#FF0000', '#FFCC00'], // Portuguese flag colors (green, red, yellow)
  'ja': ['#FFFFFF', '#BC002D', '#FFFFFF'], // Japanese flag colors (white, red, white)
  'nl': ['#AE1C28', '#FFFFFF', '#21468B'], // Dutch flag colors (red, white, blue)
  'ru': ['#FFFFFF', '#0039A6', '#D52B1E'], // Russian flag colors (white, blue, red)
  'zh': ['#DE2910', '#FFDE00', '#DE2910'], // Chinese flag colors (red, yellow, red)
  'ko': ['#FFFFFF', '#000000', '#C60C30'], // Korean flag colors (white, black, red)
};

// Country gradients for animations
export const countryGradients: Record<string, string> = {
  en: 'from-[#012169] via-white to-[#C8102E]', // UK colors
  de: 'from-black via-[#DD0000] to-[#FFCC00]', // Germany colors
  es: 'from-[#C60B1E] via-[#FFC400] to-[#C60B1E]', // Spain colors
  fr: 'from-[#002395] via-white to-[#ED2939]', // France colors
  it: 'from-[#009246] via-white to-[#CE2B37]', // Italy colors
  ja: 'from-[#BC002D] via-white to-[#BC002D]', // Japan colors
  pt: 'from-[#006600] via-[#FF0000] to-[#FFCC00]', // Portugal colors
  nl: 'from-[#AE1C28] via-white to-[#21468B]', // Dutch colors
  ru: 'from-[#FFFFFF] via-[#0039A6] to-[#D52B1E]', // Russian colors
  zh: 'from-[#DE2910] via-[#FFDE00] to-[#DE2910]', // Chinese colors
  ko: 'from-[#FFFFFF] via-[#000000] to-[#C60C30]', // Korean colors
};

// Helper function to get gradient colors for a language
export const getFlagGradient = (language: string) => {
  const colors = flagColors[language === 'en' ? 'gb' : language] || flagColors['gb'];
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2] || colors[0]} 100%)`;
};

// Helper function to get the flag icon class
export const getFlagIconClass = (language: string) => {
  return `fi fi-${language === 'en' ? 'gb' : language} fis`;
};

// Language level colors
export const getLevelColor = (level: string) => {
  switch (level) {
    case "A1": return "text-blue-500";
    case "A2": return "text-green-500";
    case "B1": return "text-yellow-500";
    case "B2": return "text-orange-500";
    case "C1": return "text-red-500";
    case "C2": return "text-purple-500";
    default: return "text-gray-500";
  }
};

// Difficulty level colors
export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner": return "text-green-500";
    case "intermediate": return "text-yellow-500";
    case "advanced": return "text-red-500";
    default: return "text-gray-500";
  }
};

// Language translations for "FAST"
export const fastTranslations: Record<string, string> = {
  en: 'FAST',
  de: 'SCHNELL',
  es: 'RÁPIDO',
  fr: 'RAPIDE',
  it: 'VELOCE',
  ja: '速く',
  pt: 'RÁPIDO'
}; 