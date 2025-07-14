import { NextRequest, NextResponse } from 'next/server';
import { TTSRequestSchema } from '@/app/listening/lib/listeningSchemas';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('[TTS API] Processing text-to-speech request');
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('[TTS API] ElevenLabs API key not found');
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log('[TTS API] Request body:', { 
      text_length: body.text?.length, 
      voice_id: body.voice_id,
      model_id: body.model_id 
    });
    
    // Validate request
    const validatedRequest = TTSRequestSchema.parse(body);
    
    const { text, voice_id, model_id, voice_settings } = validatedRequest;
    
    // Ensure we have meaningful text to convert
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Prepare ElevenLabs API request with improved settings
    const elevenLabsBody = {
      text: text.trim(),
      model_id: model_id || 'eleven_multilingual_v2',
      voice_settings: voice_settings || {
        stability: 0.75,
        similarity_boost: 0.7,
        style: 0.0,
        use_speaker_boost: true,
      },
    };
    
    console.log('[TTS API] Calling ElevenLabs API for voice:', voice_id);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify(elevenLabsBody),
    });

    if (!response.ok) {
      console.error('[TTS API] ElevenLabs API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[TTS API] Error details:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to generate speech', details: errorText },
        { status: response.status }
      );
    }

    console.log('[TTS API] Successfully generated audio, streaming response');
    
    // Stream the audio response directly to the client
    const audioStream = response.body;
    
    if (!audioStream) {
      return NextResponse.json(
        { error: 'No audio stream received' },
        { status: 500 }
      );
    }

    return new Response(audioStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="tts-audio.mp3"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('[TTS API] Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process TTS request' },
      { status: 500 }
    );
  }
} 