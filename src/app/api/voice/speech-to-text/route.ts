import { NextRequest, NextResponse } from 'next/server';
import { voiceServiceFactory } from '@/lib/learning/voice/voice-service.factory';
import { VoiceServiceProvider } from '@/lib/learning/voice/voice-service.factory';

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser to handle audio data
  },
};

export async function POST(req: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }

    // Parse the form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const provider = formData.get('provider') as string;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert the file to ArrayBuffer
    const audioBuffer = await audioFile.arrayBuffer();

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

    console.log(`Processing speech with ${service.serviceName} service`);
    
    // Convert speech to text
    const transcript = await service.speechToText(audioBuffer);
    
    return NextResponse.json({ 
      transcript,
      provider: service.serviceName
    });

  } catch (error: any) {
    console.error('Error processing speech to text:', error);
    const errorMessage = error.message || 'Failed to process speech';
    const status = error.status || 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}