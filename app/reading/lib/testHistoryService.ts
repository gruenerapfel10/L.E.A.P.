import { v4 as uuidv4 } from 'uuid';
import type { TestHistory, ReadingText } from './questionSchemas';

const STORAGE_KEY = 'reading-test-history';

export function saveTestHistory(readingText: ReadingText, score: number, answers: Record<string, any>): TestHistory {
  const history: TestHistory = {
    id: uuidv4(),
    date: new Date().toISOString(),
    score,
    readingText,
    userAnswers: answers,
  };

  // Get existing history
  const existingHistory = getTestHistory();
  
  // Add new history to the beginning of the array
  const updatedHistory = [history, ...existingHistory];
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  return history;
}

export function getTestHistory(): TestHistory[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const historyString = localStorage.getItem(STORAGE_KEY);
  if (!historyString) {
    return [];
  }

  try {
    return JSON.parse(historyString);
  } catch (error) {
    console.error('Failed to parse test history:', error);
    return [];
  }
}

export function clearTestHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function deleteTestHistory(id: string): void {
  const history = getTestHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  }
} 