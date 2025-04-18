// pages/api/speech.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { speakingService } from '@/services/speaking';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioData, languageCode, encoding, sampleRateHertz } = req.body;

    if (!audioData || !languageCode) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if audio data is valid base64
    if (!audioData.startsWith('data:audio/')) {
      return res.status(400).json({ error: 'Invalid audio data format' });
    }

    // Convert speech to text
    const transcript = await speakingService.fileToText(audioData, {
      languageCode,
      encoding: encoding || 'WEBM_OPUS',
      sampleRateHertz: sampleRateHertz || 48000,
      enableAutomaticPunctuation: true
    });

    return res.status(200).json({ transcript });
  } catch (error) {
    console.error('Speech recognition error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Speech recognition failed' 
    });
  }
}