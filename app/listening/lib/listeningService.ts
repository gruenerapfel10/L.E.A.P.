import { 
  AudioContent, 
  ListeningSubmission, 
  ListeningEvaluation, 
  ListeningHistoryEntry, 
  ListeningStats,
  AudioTaskType,
  Voice
} from './listeningSchemas';

// Local storage keys
const STORAGE_KEYS = {
  LISTENING_HISTORY: 'listening_history',
  LISTENING_STATS: 'listening_stats',
  CACHED_VOICES: 'cached_voices',
  CURRENT_AUDIO: 'current_audio',
} as const;

// Service class for managing listening practice data
export class ListeningService {
  // History management
  static saveHistoryEntry(entry: ListeningHistoryEntry): void {
    const history = this.getHistory();
    history.unshift(entry); // Add to beginning
    // Keep only last 50 entries
    const trimmedHistory = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.LISTENING_HISTORY, JSON.stringify(trimmedHistory));
    
    // Update statistics
    this.updateStats(entry);
  }

  static getHistory(): ListeningHistoryEntry[] {
    const stored = localStorage.getItem(STORAGE_KEYS.LISTENING_HISTORY);
    return stored ? JSON.parse(stored) : [];
  }

  static clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.LISTENING_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.LISTENING_STATS);
  }

  // Statistics management
  static getStats(): ListeningStats {
    const stored = localStorage.getItem(STORAGE_KEYS.LISTENING_STATS);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default stats
    return {
      total_tests: 0,
      average_score: 0,
      best_score: 0,
      total_time_minutes: 0,
      improvement_trend: 0,
      completion_rate: 0,
    };
  }

  private static updateStats(entry: ListeningHistoryEntry): void {
    const currentStats = this.getStats();
    const history = this.getHistory();
    
    // Calculate new stats
    const totalTests = history.length;
    const scores = history.map(h => h.evaluation.score_percentage);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const totalTimeMinutes = history.reduce((total, h) => total + (h.evaluation.time_taken_seconds / 60), 0);
    
    // Calculate improvement trend (last 5 vs previous 5)
    let improvementTrend = 0;
    if (history.length >= 10) {
      const recent5 = scores.slice(0, 5);
      const previous5 = scores.slice(5, 10);
      const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
      const previousAvg = previous5.reduce((a, b) => a + b, 0) / previous5.length;
      improvementTrend = ((recentAvg - previousAvg) / previousAvg) * 100;
    }
    
    // Calculate completion rate (assuming all entries in history are completed)
    const completionRate = 100; // Since we only store completed tests
    
    // Find favorite task type
    const taskTypeCounts = history.reduce((acc, h) => {
      const type = h.audio_content.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<AudioTaskType, number>);
    
    const favoriteTaskType = Object.entries(taskTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as AudioTaskType;

    const updatedStats: ListeningStats = {
      total_tests: totalTests,
      average_score: averageScore,
      best_score: bestScore,
      total_time_minutes: totalTimeMinutes,
      favorite_task_type: favoriteTaskType,
      improvement_trend: improvementTrend,
      completion_rate: completionRate,
    };

    localStorage.setItem(STORAGE_KEYS.LISTENING_STATS, JSON.stringify(updatedStats));
  }

  // Current audio management
  static saveCurrentAudio(audio: AudioContent): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_AUDIO, JSON.stringify(audio));
  }

  static getCurrentAudio(): AudioContent | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_AUDIO);
    return stored ? JSON.parse(stored) : null;
  }

  static clearCurrentAudio(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_AUDIO);
  }

  // Voice management
  static cacheVoices(voices: Voice[]): void {
    const voiceCache = {
      voices,
      cached_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.CACHED_VOICES, JSON.stringify(voiceCache));
  }

  static getCachedVoices(): Voice[] | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CACHED_VOICES);
    if (!stored) return null;
    
    const cache = JSON.parse(stored);
    const cachedAt = new Date(cache.cached_at);
    const now = new Date();
    const hoursSinceCached = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);
    
    // Cache voices for 24 hours
    if (hoursSinceCached > 24) {
      localStorage.removeItem(STORAGE_KEYS.CACHED_VOICES);
      return null;
    }
    
    return cache.voices;
  }

  // Utility functions
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }

  static getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  static getScoreBadgeColor(score: number): string {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 70) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }

  static getTaskTypeDisplay(type: AudioTaskType): string {
    const displayNames: Record<AudioTaskType, string> = {
      lecture: 'Lecture',
      panel_discussion: 'Panel Discussion',
      interview: 'Interview',
      podcast: 'Podcast',
      conversation: 'Conversation',
      news_report: 'News Report',
    };
    return displayNames[type] || type;
  }

  static getTaskTypeIcon(type: AudioTaskType): string {
    const icons: Record<AudioTaskType, string> = {
      lecture: '🎓',
      panel_discussion: '💬',
      interview: '🎤',
      podcast: '🎧',
      conversation: '👥',
      news_report: '📰',
    };
    return icons[type] || '🔊';
  }

  // Filter and search functions
  static filterHistoryByType(history: ListeningHistoryEntry[], type: AudioTaskType): ListeningHistoryEntry[] {
    return history.filter(entry => entry.audio_content.type === type);
  }

  static filterHistoryByScore(history: ListeningHistoryEntry[], minScore: number): ListeningHistoryEntry[] {
    return history.filter(entry => entry.evaluation.score_percentage >= minScore);
  }

  static searchHistory(history: ListeningHistoryEntry[], query: string): ListeningHistoryEntry[] {
    const lowercaseQuery = query.toLowerCase();
    return history.filter(entry => 
      entry.audio_content.title.toLowerCase().includes(lowercaseQuery) ||
      entry.audio_content.topic.toLowerCase().includes(lowercaseQuery) ||
      entry.audio_content.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Audio generation helpers
  static getRandomTaskType(): AudioTaskType {
    const types: AudioTaskType[] = ['lecture', 'panel_discussion', 'interview', 'podcast', 'conversation', 'news_report'];
    return types[Math.floor(Math.random() * types.length)];
  }

  static getTopicsForTaskType(type: AudioTaskType): string[] {
    const topics: Record<AudioTaskType, string[]> = {
      lecture: [
        'Climate Change and Environmental Policy',
        'Digital Transformation in Business',
        'German History and Culture',
        'Artificial Intelligence and Society',
        'Sustainable Energy Solutions',
        'European Union Politics',
        'Philosophy and Ethics',
        'Modern Art and Literature'
      ],
      panel_discussion: [
        'Future of Work and Remote Employment',
        'Social Media and Mental Health',
        'Immigration and Integration',
        'Education System Reform',
        'Healthcare Innovation',
        'Urban Planning and Smart Cities',
        'Gender Equality in the Workplace',
        'Cultural Diversity in Modern Society'
      ],
      interview: [
        'Entrepreneurship and Innovation',
        'Scientific Research and Discovery',
        'Arts and Creative Industries',
        'Sports and Athletic Performance',
        'Travel and Cultural Exchange',
        'Technology and Privacy',
        'Environmental Activism',
        'Career Development and Life Balance'
      ],
      podcast: [
        'Personal Development and Psychology',
        'History and Historical Events',
        'Science and Technology Trends',
        'Literature and Book Reviews',
        'Music and Entertainment Industry',
        'Food Culture and Culinary Arts',
        'Philosophy and Life Perspectives',
        'Current Events and News Analysis'
      ],
      conversation: [
        'University Life and Academic Challenges',
        'Professional Networking and Conferences',
        'Travel Planning and Experiences',
        'Cultural Events and Festivals',
        'Hobby Groups and Interests',
        'Community Projects and Volunteering',
        'Technology and Digital Life',
        'Health and Wellness Discussions'
      ],
      news_report: [
        'Economic Developments and Market Trends',
        'Political Elections and Government Policy',
        'Scientific Breakthroughs and Research',
        'Cultural Events and Celebrations',
        'Environmental Issues and Climate Action',
        'International Relations and Diplomacy',
        'Social Issues and Community Impact',
        'Technology Innovation and Digital Society'
      ]
    };
    return topics[type] || [];
  }

  static getRandomTopic(type: AudioTaskType): string {
    const topics = this.getTopicsForTaskType(type);
    return topics[Math.floor(Math.random() * topics.length)];
  }
}

export default ListeningService; 