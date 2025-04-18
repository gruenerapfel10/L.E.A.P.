import { NextResponse } from 'next/server';
import { speakingService } from '@/services/speaking';

interface SpeechToTextRequest {
  audio: string;
  languageCode: string;
}

export async function POST(request: Request) {
  try {
    console.log("Speech-to-text API endpoint called");
    
    const body = await request.json();
    const { audio: audioData, languageCode } = body as SpeechToTextRequest;

    if (!audioData || !languageCode) {
      console.error("Missing required parameters:", { 
        hasAudio: !!audioData, 
        audioLength: audioData ? audioData.length : 0,
        languageCode 
      });
      
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`Processing speech with language: ${languageCode}, audio data length: ${audioData.length} chars`);

    // Process speech using the speaking service
    const transcript = await speakingService.speechToText(audioData, {
      languageCode,
      encoding: 'WEBM_OPUS',
      enableAutomaticPunctuation: true,
    });

    console.log(`Speech recognition completed. Transcript: "${transcript}"`);
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    
    // Extract more detailed error information
    const errorMessage = error instanceof Error 
      ? error.message
      : 'Unknown speech processing error';
      
    const statusCode = error instanceof Error && 
      'code' in error && 
      typeof (error as any).code === 'number' 
        ? (error as any).code === 3 ? 400 : 500 
        : 500;
    
    return NextResponse.json(
      { error: `Failed to process speech: ${errorMessage}` },
      { status: statusCode }
    );
  }
} 