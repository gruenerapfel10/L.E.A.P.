import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Common Goethe C1 exam topics
export const C1_TOPICS = [
  // Work & Career
  "Remote Work and Digital Transformation",
  "Work-Life Balance in Modern Society",
  "Career Development and Lifelong Learning",
  "Workplace Diversity and Inclusion",
  "Professional Networking in the Digital Age",
  
  // Society & Culture
  "Integration and Cultural Identity",
  "Demographic Change in German Society",
  "Social Media Impact on Relationships",
  "Urban Development and Smart Cities",
  "Cultural Heritage Preservation",
  
  // Environment & Sustainability
  "Renewable Energy Solutions",
  "Sustainable Urban Planning",
  "Climate Change Adaptation",
  "Biodiversity Conservation",
  "Zero Waste Movement",
  
  // Education & Research
  "Digital Learning Trends",
  "Higher Education Reform",
  "Research Ethics and Innovation",
  "Educational Inequality",
  "International Academic Exchange",
  
  // Technology & Innovation
  "Artificial Intelligence Ethics",
  "Digital Privacy and Data Protection",
  "Future of Transportation",
  "Biotechnology Advances",
  "Smart Home Technologies",
  
  // Health & Wellbeing
  "Mental Health Awareness",
  "Healthcare Digitalization",
  "Preventive Medicine",
  "Work-Related Stress Management",
  "Aging Population Care",
  
  // Media & Communication
  "Fake News and Media Literacy",
  "Digital Journalism Evolution",
  "Social Media Influence",
  "Public Broadcasting Future",
  "Cross-Cultural Communication",
  
  // Politics & Society
  "Democratic Participation",
  "European Integration",
  "Migration and Integration Policy",
  "Gender Equality Initiatives",
  "Civil Society Engagement",
  
  // Economy & Business
  "Startup Ecosystem Development",
  "Sharing Economy Impact",
  "Digital Currency Future",
  "Sustainable Business Models",
  "Global Trade Relations",
  
  // Arts & Culture
  "Contemporary Art Trends",
  "Digital Culture Impact",
  "Cultural Festival Evolution",
  "Museum Modernization",
  "Literature in Digital Age",
  
  // Science & Research
  "Space Exploration Ethics",
  "Genetic Research Implications",
  "Quantum Computing Future",
  "Neuroscience Advances",
  "Environmental Research Methods"
] as const;

export const ReadingSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleTranslation: z.string(),
  content: z.string(),
  contentTranslation: z.string(),
  type: z.enum(['informative', 'narrative', 'functional', 'opinion']),
  difficulty: z.literal('C1'),
  topic: z.enum(C1_TOPICS),
});

export type ReadingSource = z.infer<typeof ReadingSourceSchema>;

export type StreamingReadingSource = {
  id: string;
  title: string | null;
  titleTranslation: string | null;
  content: string | null;
  contentTranslation: string | null;
  type: ReadingSource['type'] | null;
  difficulty: 'C1';
  topic: typeof C1_TOPICS[number] | null;
  isComplete: boolean;
};

export function parseStreamingContent(content: string): Partial<StreamingReadingSource> {
  const result: Partial<StreamingReadingSource> = {};

  if (content.includes('TOPIC:')) {
    const match = content.match(/TOPIC:\s*([^\n]+)/);
    if (match && match[1]) {
      const topic = match[1].trim();
      if (C1_TOPICS.includes(topic as typeof C1_TOPICS[number])) {
        result.topic = topic as typeof C1_TOPICS[number];
      }
    }
  }

  if (content.includes('TITLE_DE:')) {
    const match = content.match(/TITLE_DE:\s*([^\n]+)/);
    if (match && match[1]) {
      result.title = match[1].trim();
    }
  }
  
  if (content.includes('TITLE_EN:')) {
    const match = content.match(/TITLE_EN:\s*([^\n]+)/);
    if (match && match[1]) {
      result.titleTranslation = match[1].trim();
    }
  }

  if (content.includes('TYPE:')) {
    const match = content.match(/TYPE:\s*([^\n]+)/);
    if (match && match[1]) {
      const type = match[1].trim().toLowerCase();
      if (type === 'informative' || type === 'narrative' || type === 'functional' || type === 'opinion') {
        result.type = type;
      }
    }
  }

  if (content.includes('CONTENT_DE:')) {
    const match = content.match(/CONTENT_DE:\s*\n([\s\S]*?)(?=\nCONTENT_EN:|$)/);
    if (match && match[1]) {
      result.content = match[1].trim();
    }
  }

  if (content.includes('CONTENT_EN:')) {
    const match = content.match(/CONTENT_EN:\s*\n([\s\S]*?)$/);
    if (match && match[1]) {
      result.contentTranslation = match[1].trim();
    }
  }

  return result;
}

export function isSourceComplete(source: Partial<StreamingReadingSource>): boolean {
  return !!(
    source.title &&
    source.titleTranslation &&
    source.content &&
    source.contentTranslation &&
    source.type &&
    source.topic
  );
}

export function getRandomTopic(): typeof C1_TOPICS[number] {
  return C1_TOPICS[Math.floor(Math.random() * C1_TOPICS.length)];
} 