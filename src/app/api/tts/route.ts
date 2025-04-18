// pages/api/tts.ts
import { NextResponse } from 'next/server';
import { speakingService } from '@/services/speaking';

export async function POST(request: Request) {
  try {
    const { text, languageCode, ssmlGender } = await request.json();
    
    if (!text || !languageCode) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate audio content using the speaking service
    const audioContent = await speakingService.textToSpeech(text, {
      languageCode,
      ssmlGender,
    });

    // Return audio as response
    return new NextResponse(audioContent, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}