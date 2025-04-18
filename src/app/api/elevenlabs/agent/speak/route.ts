import { NextRequest, NextResponse } from 'next/server';
import { elevenLabsService } from '@/lib/learning/voice/elevenlabs.service';

export const runtime = 'edge'; // Use edge runtime for streaming

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    console.log(`Processing text: "${text}"`);
    
    // Use the textToSpeech method from the VoiceService interface
    const audioBuffer = await elevenLabsService.textToSpeech(text);
    
    // Create a readable stream from the array buffer
    const uint8Array = new Uint8Array(audioBuffer);
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(uint8Array);
        controller.close();
      }
    });
    
    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: any) {
    console.error('Error generating or streaming audio:', error);
    const errorMessage = error.message || 'Failed to generate audio';
    const status = error.status || 500;
    return NextResponse.json({ error: `ElevenLabs API error: ${errorMessage}` }, { status });
  }
}