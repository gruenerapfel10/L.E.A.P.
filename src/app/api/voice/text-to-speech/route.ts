import { NextRequest, NextResponse } from 'next/server';
import { voiceServiceFactory } from '@/lib/learning/voice/voice-service.factory';
import { VoiceServiceProvider } from '@/lib/learning/voice/voice-service.factory';

export const runtime = 'edge'; // Use edge runtime for streaming

export async function POST(req: NextRequest) {
  try {
    const { text, provider, config } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Get the requested voice service or use the default
    let service;
    if (provider) {
      try {
        service = voiceServiceFactory.getServiceByProvider(provider as VoiceServiceProvider);
      } catch (error) {
        console.error(`Invalid provider '${provider}', using default service`);
        service = voiceServiceFactory.getService();
      }
    } else {
      service = voiceServiceFactory.getService();
    }

    console.log(`Processing text: "${text}" with ${service.serviceName} service`);
    
    // Convert text to speech
    const audioBuffer = await service.textToSpeech(text);
    
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
        'X-Voice-Service-Provider': service.serviceName
      },
    });

  } catch (error: any) {
    console.error('Error generating or streaming audio:', error);
    const errorMessage = error.message || 'Failed to generate audio';
    const status = error.status || 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}