import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('[Multi-Speaker Audio API] Processing multi-speaker audio generation');
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('[Multi-Speaker Audio API] ElevenLabs API key not found');
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log('[Multi-Speaker Audio API] Request body:', { 
      transcript_length: body.transcript?.length, 
      speakers_count: body.speakers?.length,
      voices_count: body.voices?.length 
    });
    
    const { transcript, speakers, voices } = body;
    
    if (!transcript || !speakers || !voices) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript, speakers, voices' },
        { status: 400 }
      );
    }

    // Parse transcript to extract speaker segments
    const segments = parseTranscriptSegments(transcript);
    console.log('[Multi-Speaker Audio API] Parsed segments:', segments.length);
    console.log('[Multi-Speaker Audio API] Segments:', segments.map(s => ({ speaker: s.speaker, textLength: s.text.length })));
    
    // Generate audio for each segment with proper voice assignment
    const audioSegments = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
             // Assign voices based on speaker names to ensure different voices
       let assignedVoice;
       if (segment.speaker.includes('1') || segment.speaker.includes('Interviewer') || segment.speaker.includes('Host')) {
         // Use first available voice
         assignedVoice = voices.find((v: any) => v.voice_id && v.name) || voices[0];
       } else if (segment.speaker.includes('2') || segment.speaker.includes('Experte') || segment.speaker.includes('Gast')) {
         // Use second available voice (different from first)
         assignedVoice = voices.length > 1 ? voices[1] : voices[0];
       } else if (segment.speaker.includes('3') || segment.speaker.includes('Moderator')) {
         // Use third available voice
         assignedVoice = voices.length > 2 ? voices[2] : voices[0];
       } else {
         // Use round-robin assignment for other speakers
         assignedVoice = voices[i % voices.length];
       }
       
       // Ensure we have a valid voice
       if (!assignedVoice || !assignedVoice.voice_id) {
         assignedVoice = voices[0];
       }
      
      console.log(`[Multi-Speaker Audio API] Generating audio for ${segment.speaker} with voice ${assignedVoice.name}`);
      
      // Add pause before text for speaker transitions (except first segment)
      const textWithPause = i > 0 ? `<break time="0.8s" />${segment.text}` : segment.text;
      
      const audioBlob = await generateSpeechSegment(textWithPause, assignedVoice.voice_id, apiKey);
      audioSegments.push(audioBlob);
    }
    
    // Combine audio segments
    console.log('[Multi-Speaker Audio API] Combining audio segments...');
    const combinedAudio = await combineAudioSegments(audioSegments);
    
    return new Response(combinedAudio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="multi-speaker-audio.mp3"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error) {
    console.error('[Multi-Speaker Audio API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate multi-speaker audio' },
      { status: 500 }
    );
  }
}

function parseTranscriptSegments(transcript: string) {
  const segments = [];
  const lines = transcript.split('\n');
  let currentSpeaker = 'Sprecher 1';
  let currentText = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      // Empty line might indicate end of current speaker's segment
      if (currentText.trim()) {
        segments.push({
          speaker: currentSpeaker,
          text: currentText.trim(),
        });
        currentText = '';
      }
      continue;
    }
    
    // Look for speaker patterns like "Sprecher 1:", "Speaker 1:", "Interviewer:", etc.
    const speakerMatch = trimmedLine.match(/^(Sprecher \d+|Speaker \d+|Interviewer|Experte|Host|Gast|Moderator|Herr \w+|Frau \w+|Professor \w+):\s*(.*)$/);
    
    if (speakerMatch) {
      // Save previous speaker's text if any
      if (currentText.trim()) {
        segments.push({
          speaker: currentSpeaker,
          text: currentText.trim(),
        });
      }
      
      // Start new speaker
      currentSpeaker = speakerMatch[1];
      currentText = speakerMatch[2];
    } else {
      // Continuation of current speaker's text
      currentText += (currentText ? ' ' : '') + trimmedLine;
    }
  }
  
  // Add final segment
  if (currentText.trim()) {
    segments.push({
      speaker: currentSpeaker,
      text: currentText.trim(),
    });
  }
  
  return segments;
}

async function generateSpeechSegment(text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.7,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate speech for voice ${voiceId}: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

async function combineAudioSegments(audioSegments: ArrayBuffer[]): Promise<ArrayBuffer> {
  // Simple concatenation of audio segments
  // The pauses are already included in the individual segments via <break> tags
  
  const totalLength = audioSegments.reduce((sum, segment) => sum + segment.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const segment of audioSegments) {
    combined.set(new Uint8Array(segment), offset);
    offset += segment.byteLength;
  }
  
  return combined.buffer;
} 