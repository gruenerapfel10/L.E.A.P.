import { NextResponse } from 'next/server';
import { VoiceSchema } from '@/app/listening/lib/listeningSchemas';
import { z } from 'zod';

export const runtime = 'edge';

// ElevenLabs API response schema - more flexible to handle actual API response
const ElevenLabsVoiceSchema = z.object({
  voice_id: z.string(),
  name: z.string(),
  labels: z.record(z.any()).optional(),
  description: z.string().optional(),
  preview_url: z.string().optional(),
  available_for_tiers: z.array(z.string()).optional(),
  settings: z.object({
    stability: z.number().optional(),
    similarity_boost: z.number().optional(),
  }).optional(),
  // Allow additional fields that ElevenLabs might return
}).passthrough();

const ElevenLabsVoicesResponseSchema = z.object({
  voices: z.array(ElevenLabsVoiceSchema),
}).passthrough();

export async function GET() {
  console.log('[Voices API] Fetching voices from ElevenLabs');
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('[Voices API] ElevenLabs API key not found');
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Voices API] ElevenLabs API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch voices from ElevenLabs' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Voices API] Received', data.voices?.length, 'voices from ElevenLabs');
    
    // Skip validation for now and work directly with the data
    const rawVoices = data.voices || [];
    
    // Transform and filter voices for German language
    const processedVoices = rawVoices
      .map((voice: any) => {
        // Extract metadata from labels
        const labels = voice.labels || {};
        const accent = labels.accent || labels.region || 'Standard';
        const gender = labels.gender || (voice.name.toLowerCase().includes('male') ? 'male' : 'female');
        const age = labels.age || 'middle_aged';
        
        // Check if voice supports German (look for German-related keywords)
        const supportsGerman = 
          voice.name.toLowerCase().includes('german') ||
          voice.name.toLowerCase().includes('deutsch') ||
          voice.description?.toLowerCase().includes('german') ||
          voice.description?.toLowerCase().includes('deutsch') ||
          labels.language?.includes('de') ||
          labels.language?.includes('german') ||
          // Include multilingual voices that likely support German
          voice.name.toLowerCase().includes('multilingual') ||
          voice.description?.toLowerCase().includes('multilingual');
        
        return {
          voice_id: voice.voice_id,
          name: voice.name,
          language: supportsGerman ? 'de' : 'en',
          accent,
          gender: gender as 'male' | 'female',
          age: age as 'young' | 'middle_aged' | 'old',
          description: voice.description || '',
          supports_german: supportsGerman,
          preview_url: voice.preview_url,
        };
      })
      // Filter to include German voices and high-quality multilingual voices
      .filter((voice: any) => 
        voice.supports_german || 
        voice.name.toLowerCase().includes('multilingual') ||
        // Include some popular voices that work well for German
        ['Rachel', 'Adam', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh', 'Arnold', 'Charlotte'].includes(voice.name)
      )
      // Sort by German support first, then by name
      .sort((a: any, b: any) => {
        if (a.supports_german && !b.supports_german) return -1;
        if (!a.supports_german && b.supports_german) return 1;
        return a.name.localeCompare(b.name);
      });

    console.log('[Voices API] Processed', processedVoices.length, 'German-compatible voices');
    
    // Add some default German voices if none found
    if (processedVoices.length === 0) {
      console.log('[Voices API] No German voices found, adding defaults');
      processedVoices.push(
        {
          voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam (multilingual)
          name: 'Adam (Multilingual)',
          language: 'de',
          accent: 'Standard',
          gender: 'male' as const,
          age: 'middle_aged' as const,
          description: 'Deep, authoritative voice suitable for lectures and formal content',
          supports_german: true,
          preview_url: undefined,
        },
        {
          voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel (multilingual)
          name: 'Rachel (Multilingual)',
          language: 'de',
          accent: 'Standard',
          gender: 'female' as const,
          age: 'middle_aged' as const,
          description: 'Clear, professional voice perfect for interviews and conversations',
          supports_german: true,
          preview_url: undefined,
        }
      );
    }

    // Validate processed voices
    const validatedVoices = processedVoices.map((voice: any) => {
      try {
        return VoiceSchema.parse(voice);
      } catch (error) {
        console.warn('[Voices API] Invalid voice data:', voice.name, error);
        return null;
      }
    }).filter(Boolean);

    console.log('[Voices API] Returning', validatedVoices.length, 'validated voices');
    
    return NextResponse.json({
      voices: validatedVoices,
      total: validatedVoices.length,
    });
    
  } catch (error) {
    console.error('[Voices API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process voices' },
      { status: 500 }
    );
  }
} 