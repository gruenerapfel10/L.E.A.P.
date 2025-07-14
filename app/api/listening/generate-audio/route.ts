import { streamText } from "ai";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AudioGenerationPromptSchema } from '@/app/listening/lib/listeningSchemas';
import { NextRequest } from 'next/server';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
}

// Initialize the Google client with the API key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('[Audio Generation API] Starting audio content generation');
  
  try {
    const body = await request.json();
    console.log('[Audio Generation API] Request body:', body);
    
    // Validate request
    const validatedRequest = AudioGenerationPromptSchema.parse(body);
    
    const { 
      type, 
      topic, 
      difficulty, 
      duration_minutes, 
      num_speakers, 
      include_questions,
      question_types,
      voice_preferences 
    } = validatedRequest;
    
    // Generate the prompt based on the task type
    const prompt = generatePrompt(type, topic, difficulty, duration_minutes, num_speakers, include_questions, question_types, voice_preferences);
    
    console.log('[Audio Generation API] Generated prompt for type:', type);
    console.log('[Audio Generation API] Calling Gemini API');
    
    const response = await streamText({
      model: google('models/gemini-2.5-flash'),
      prompt,
    });

    console.log('[Audio Generation API] Got response from Gemini, converting to stream');
    const stream = response.toDataStream();
    
    console.log('[Audio Generation API] Returning stream response');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1'
      }
    });
    
  } catch (error) {
    console.error('[Audio Generation API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate audio content' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function generatePrompt(
  type: string,
  topic: string | undefined,
  difficulty: string,
  duration_minutes: number,
  num_speakers: number,
  include_questions: boolean,
  question_types: string[] | undefined,
  voice_preferences: any
): string {
  const topicText = topic || getRandomTopicForType(type);
  const speakerText = num_speakers === 1 ? 'monologue' : `${num_speakers} speakers`;
  
  let prompt = `Generate a German ${difficulty} level listening comprehension ${type} about "${topicText}" that matches the authentic Goethe C1 exam format.

This should be a ${speakerText} lasting approximately ${duration_minutes} minutes when spoken at natural speed (approximately ${duration_minutes * 150} words for natural German speech).

CRITICAL REQUIREMENTS:
- Content must be at ${difficulty} level (advanced German) with complex vocabulary and sophisticated structures
- Generate realistic, authentic dialogue that sounds like native German speakers
- Include cultural references, idiomatic expressions, and regional variations
- Create natural conversation flow with interruptions, hesitations, and realistic speech patterns
- For multi-speaker content, ensure clear speaker differentiation and natural turn-taking
- Length should be substantial enough for ${duration_minutes} minutes of audio content

Format the response as follows:
TITLE: [German title]
TITLE_EN: [English translation]
TYPE: ${type}
TOPIC: ${topicText}
DURATION: ${duration_minutes} minutes
SPEAKERS: ${num_speakers}

CONTENT_STRUCTURE:
[Brief description of the content structure and context]

TRANSCRIPT_DE:
[Full German transcript with speaker labels if multiple speakers]
[Use Speaker 1:, Speaker 2:, etc. for multiple speakers]
[Include natural pauses, interruptions, and conversational elements]

TRANSCRIPT_EN:
[Full English translation of the transcript]

SPEAKER_ROLES:
[If multiple speakers, describe each speaker's role, background, and speaking style]
Speaker 1: [Name, role, speaking characteristics]
Speaker 2: [Name, role, speaking characteristics]
[etc.]

CULTURAL_CONTEXT:
[Explanation of any cultural references, idioms, or context needed for understanding]

VOCABULARY_HIGHLIGHTS:
[List of advanced vocabulary and expressions used, with explanations]

`;

  if (include_questions) {
    const questionTypesText = question_types?.join(', ') || 'multiple_choice, short_answer, true_false, matching';
    
    prompt += `
LISTENING_QUESTIONS:
Generate 8-12 comprehension questions testing different skills:
- Main idea identification
- Specific detail extraction
- Inference and implied meaning
- Speaker attitude and opinion recognition
- Context and cultural understanding

Use these question types: ${questionTypesText}

Format each question as:
Q[number]: [Question in German]
TYPE: [question_type]
OPTIONS: [For multiple choice: A) B) C) D) options in German]
ANSWER: [Correct answer]
EXPLANATION: [Brief explanation in German and English]
POINTS: [1-3 points based on difficulty]

`;
  }

  // Add specific instructions based on audio type
  switch (type) {
    case 'lecture':
      prompt += `
LECTURE SPECIFIC REQUIREMENTS:
- Academic tone with formal register
- Clear structure with introduction, main points, and conclusion
- Use of academic vocabulary and complex sentence structures
- Include examples, statistics, or case studies
- Natural lecturer speaking patterns with emphasis and pauses
`;
      break;
      
    case 'panel_discussion':
      prompt += `
PANEL DISCUSSION SPECIFIC REQUIREMENTS:
- Multiple viewpoints and perspectives
- Natural interruptions and turn-taking
- Formal but conversational tone
- Use of discourse markers and transitional phrases
- Disagreement and consensus-building language
`;
      break;
      
    case 'interview':
      prompt += `
INTERVIEW SPECIFIC REQUIREMENTS:
- Clear interviewer-interviewee dynamic
- Follow-up questions and natural conversation flow
- Mix of prepared and spontaneous responses
- Professional but personable tone
- Include personal anecdotes or experiences
`;
      break;
      
    case 'podcast':
      prompt += `
PODCAST SPECIFIC REQUIREMENTS:
- Conversational and engaging tone
- Natural speaking pace with casual interjections
- Use of modern colloquialisms and contemporary references
- Smooth transitions between topics
- Include listener engagement elements
`;
      break;
      
    case 'conversation':
      prompt += `
CONVERSATION SPECIFIC REQUIREMENTS:
- Natural, spontaneous dialogue
- Informal register with colloquial expressions
- Overlapping speech and natural interruptions
- Use of filler words and hesitations
- Emotional expressions and reactions
`;
      break;
      
    case 'news_report':
      prompt += `
NEWS REPORT SPECIFIC REQUIREMENTS:
- Professional journalistic tone
- Clear, concise information delivery
- Use of formal news language and structures
- Include quotes from sources or experts
- Objective reporting style with factual information
`;
      break;
  }

  return prompt;
}

function getRandomTopicForType(type: string): string {
  const topics: Record<string, string[]> = {
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
  
  const typeTopics = topics[type] || topics.conversation;
  return typeTopics[Math.floor(Math.random() * typeTopics.length)];
} 