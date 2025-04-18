import * as speech from '@google-cloud/speech';
import * as textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import { Readable } from 'stream';

// Type used for mock implementation
type MockSpeechRecognition = {
  start: () => void;
  stop: () => void;
  onresult: null | ((event: any) => void);
  onerror: null | ((event: any) => void);
  onend: null | (() => void);
};

/**
 * Configuration options for speech recognition
 */
export interface SpeechToTextConfig {
  encoding?: speech.protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding | string;
  sampleRateHertz?: number;
  languageCode: string;
  model?: string;
  enableAutomaticPunctuation?: boolean;
}

/**
 * Configuration options for text-to-speech
 */
export interface TextToSpeechConfig {
  languageCode: string;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  name?: string;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
}

type VoiceType = {
  name: string;
  gender: 'MALE' | 'FEMALE';
};

type LanguageVoices = {
  [key: string]: VoiceType[];
};

/**
 * Voice type definitions for different languages
 */
export const VoiceTypes: Record<string, LanguageVoices> = {
  'en-US': {
    'Chirp3-HD': [
      { name: 'en-US-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'en-US-Chirp3-HD-Charon', gender: 'MALE' }
    ],
    NEURAL2: [
      { name: 'en-US-Neural2-A', gender: 'MALE' },
      { name: 'en-US-Neural2-C', gender: 'FEMALE' },
      { name: 'en-US-Neural2-D', gender: 'MALE' },
      { name: 'en-US-Neural2-E', gender: 'FEMALE' },
      { name: 'en-US-Neural2-F', gender: 'FEMALE' },
      { name: 'en-US-Neural2-G', gender: 'FEMALE' },
      { name: 'en-US-Neural2-H', gender: 'FEMALE' },
      { name: 'en-US-Neural2-I', gender: 'MALE' },
      { name: 'en-US-Neural2-J', gender: 'MALE' }
    ],
    STUDIO: [
      { name: 'en-US-Studio-O', gender: 'FEMALE' },
      { name: 'en-US-Studio-Q', gender: 'MALE' }
    ],
    STANDARD: [
      { name: 'en-US-Standard-A', gender: 'MALE' },
      { name: 'en-US-Standard-B', gender: 'MALE' },
      { name: 'en-US-Standard-C', gender: 'FEMALE' },
      { name: 'en-US-Standard-D', gender: 'MALE' },
      { name: 'en-US-Standard-E', gender: 'FEMALE' },
      { name: 'en-US-Standard-F', gender: 'FEMALE' },
      { name: 'en-US-Standard-G', gender: 'FEMALE' },
      { name: 'en-US-Standard-H', gender: 'FEMALE' },
      { name: 'en-US-Standard-I', gender: 'MALE' },
      { name: 'en-US-Standard-J', gender: 'MALE' }
    ]
  },
  'de-DE': {
    'Chirp3-HD': [
      { name: 'de-DE-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'de-DE-Chirp3-HD-Charon', gender: 'MALE' }
    ],
    NEURAL2: [
      { name: 'de-DE-Neural2-A', gender: 'FEMALE' },
      { name: 'de-DE-Neural2-B', gender: 'MALE' },
      { name: 'de-DE-Neural2-C', gender: 'FEMALE' },
      { name: 'de-DE-Neural2-D', gender: 'MALE' },
      { name: 'de-DE-Neural2-F', gender: 'FEMALE' }
    ],
    STANDARD: [
      { name: 'de-DE-Standard-A', gender: 'FEMALE' },
      { name: 'de-DE-Standard-B', gender: 'MALE' },
      { name: 'de-DE-Standard-C', gender: 'FEMALE' },
      { name: 'de-DE-Standard-D', gender: 'MALE' },
      { name: 'de-DE-Standard-E', gender: 'MALE' },
      { name: 'de-DE-Standard-F', gender: 'FEMALE' }
    ]
  },
  'es-ES': {
    'Chirp3-HD': [
      { name: 'es-ES-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'es-ES-Chirp3-HD-Charon', gender: 'MALE' }
    ],
    NEURAL2: [
      { name: 'es-ES-Neural2-A', gender: 'FEMALE' },
      { name: 'es-ES-Neural2-B', gender: 'MALE' },
      { name: 'es-ES-Neural2-C', gender: 'FEMALE' },
      { name: 'es-ES-Neural2-D', gender: 'MALE' },
      { name: 'es-ES-Neural2-E', gender: 'FEMALE' },
      { name: 'es-ES-Neural2-F', gender: 'MALE' }
    ],
    STANDARD: [
      { name: 'es-ES-Standard-A', gender: 'FEMALE' },
      { name: 'es-ES-Standard-B', gender: 'MALE' },
      { name: 'es-ES-Standard-C', gender: 'FEMALE' },
      { name: 'es-ES-Standard-D', gender: 'FEMALE' }
    ]
  },
  'fr-FR': {
    'Chirp3-HD': [
      { name: 'fr-FR-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'fr-FR-Chirp3-HD-Charon', gender: 'MALE' }
    ],
    NEURAL2: [
      { name: 'fr-FR-Neural2-A', gender: 'FEMALE' },
      { name: 'fr-FR-Neural2-B', gender: 'MALE' },
      { name: 'fr-FR-Neural2-C', gender: 'FEMALE' },
      { name: 'fr-FR-Neural2-D', gender: 'MALE' },
      { name: 'fr-FR-Neural2-E', gender: 'FEMALE' }
    ],
    STANDARD: [
      { name: 'fr-FR-Standard-A', gender: 'FEMALE' },
      { name: 'fr-FR-Standard-B', gender: 'MALE' },
      { name: 'fr-FR-Standard-C', gender: 'FEMALE' },
      { name: 'fr-FR-Standard-D', gender: 'MALE' },
      { name: 'fr-FR-Standard-E', gender: 'FEMALE' }
    ]
  },
  'it-IT': {
    'Chirp3-HD': [
      { name: 'it-IT-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'it-IT-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'ja-JP': {
    'Chirp3-HD': [
      { name: 'ja-JP-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'ja-JP-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'ko-KR': {
    'Chirp3-HD': [
      { name: 'ko-KR-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'ko-KR-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'pt-BR': {
    'Chirp3-HD': [
      { name: 'pt-BR-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'pt-BR-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'ru-RU': {
    'Chirp3-HD': [
      { name: 'ru-RU-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'ru-RU-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'tr-TR': {
    'Chirp3-HD': [
      { name: 'tr-TR-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'tr-TR-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'vi-VN': {
    'Chirp3-HD': [
      { name: 'vi-VN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'vi-VN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'ar-XA': {
    'Chirp3-HD': [
      { name: 'ar-XA-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'ar-XA-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'bn-IN': {
    'Chirp3-HD': [
      { name: 'bn-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'bn-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'gu-IN': {
    'Chirp3-HD': [
      { name: 'gu-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'gu-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'hi-IN': {
    'Chirp3-HD': [
      { name: 'hi-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'hi-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'id-ID': {
    'Chirp3-HD': [
      { name: 'id-ID-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'id-ID-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'kn-IN': {
    'Chirp3-HD': [
      { name: 'kn-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'kn-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'ml-IN': {
    'Chirp3-HD': [
      { name: 'ml-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'ml-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'mr-IN': {
    'Chirp3-HD': [
      { name: 'mr-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'mr-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'ta-IN': {
    'Chirp3-HD': [
      { name: 'ta-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'ta-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'te-IN': {
    'Chirp3-HD': [
      { name: 'te-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'te-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'th-TH': {
    'Chirp3-HD': [
      { name: 'th-TH-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'th-TH-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'en-AU': {
    'Chirp3-HD': [
      { name: 'en-AU-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'en-AU-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'en-GB': {
    'Chirp3-HD': [
      { name: 'en-GB-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'en-GB-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'en-IN': {
    'Chirp3-HD': [
      { name: 'en-IN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'en-IN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'es-US': {
    'Chirp3-HD': [
      { name: 'es-US-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'es-US-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'fr-CA': {
    'Chirp3-HD': [
      { name: 'fr-CA-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'fr-CA-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'pl-PL': {
    'Chirp3-HD': [
      { name: 'pl-PL-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'pl-PL-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'fil-PH': {
    'NEURAL2': [
      { name: 'fil-ph-Neural2-A', gender: 'FEMALE' },
      { name: 'fil-ph-Neural2-D', gender: 'MALE' }
    ]
  },
  'da-DK': {
    'NEURAL2': [
      { name: 'da-DK-Neural2-F', gender: 'FEMALE' }
    ]
  },
  'nl-NL': {
    'Chirp3-HD': [
      { name: 'nl-NL-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'nl-NL-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'nl-BE': {
    'WAVENET': [
      { name: 'nl-BE-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'cs-CZ': {
    'WAVENET': [
      { name: 'cs-CZ-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'fi-FI': {
    'WAVENET': [
      { name: 'fi-FI-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'el-GR': {
    'WAVENET': [
      { name: 'el-GR-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'he-IL': {
    'WAVENET': [
      { name: 'he-IL-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'hu-HU': {
    'WAVENET': [
      { name: 'hu-HU-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'ms-MY': {
    'WAVENET': [
      { name: 'ms-MY-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'nb-NO': {
    'WAVENET': [
      { name: 'nb-NO-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'pt-PT': {
    'WAVENET': [
      { name: 'pt-PT-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'pa-IN': {
    'WAVENET': [
      { name: 'pa-IN-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'ro-RO': {
    'WAVENET': [
      { name: 'ro-RO-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'sk-SK': {
    'WAVENET': [
      { name: 'sk-SK-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'sv-SE': {
    'WAVENET': [
      { name: 'sv-SE-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'uk-UA': {
    'WAVENET': [
      { name: 'uk-UA-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'cmn-CN': {
    'Chirp3-HD': [
      { name: 'cmn-CN-Chirp3-HD-Aoede', gender: 'FEMALE' },
      { name: 'cmn-CN-Chirp3-HD-Charon', gender: 'MALE' }
    ]
  },
  'cmn-TW': {
    'WAVENET': [
      { name: 'cmn-TW-Wavenet-A', gender: 'FEMALE' }
    ]
  },
  'af-ZA': {
    'STANDARD': [
      { name: 'af-ZA-Standard-A', gender: 'FEMALE' }
    ]
  },
  'eu-ES': {
    'STANDARD': [
      { name: 'eu-ES-Standard-A', gender: 'FEMALE' }
    ]
  },
  'bg-BG': {
    'STANDARD': [
      { name: 'bg-BG-Standard-A', gender: 'FEMALE' }
    ]
  },
  'ca-ES': {
    'STANDARD': [
      { name: 'ca-ES-Standard-A', gender: 'FEMALE' }
    ]
  },
  'yue-HK': {
    'STANDARD': [
      { name: 'yue-HK-Standard-A', gender: 'FEMALE' }
    ]
  },
  'gl-ES': {
    'STANDARD': [
      { name: 'gl-ES-Standard-A', gender: 'FEMALE' }
    ]
  },
  'is-IS': {
    'STANDARD': [
      { name: 'is-IS-Standard-A', gender: 'FEMALE' }
    ]
  },
  'lv-LV': {
    'STANDARD': [
      { name: 'lv-LV-Standard-A', gender: 'MALE' }
    ]
  },
  'lt-LT': {
    'STANDARD': [
      { name: 'lt-LT-Standard-A', gender: 'MALE' }
    ]
  },
  'sr-RS': {
    'STANDARD': [
      { name: 'sr-RS-Standard-A', gender: 'FEMALE' }
    ]
  }
};

/**
 * A service for handling speech-to-text and text-to-speech operations using Google Cloud APIs
 */
export class SpeakingService {
  private speechClient: speech.SpeechClient;
  private ttsClient: textToSpeech.TextToSpeechClient;
  
  constructor() {
    // Initialize the clients with API key
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_CLOUD_API_KEY is not set in environment variables');
    }

    this.speechClient = new speech.SpeechClient({
      apiKey: apiKey
    });
    this.ttsClient = new textToSpeech.TextToSpeechClient({
      apiKey: apiKey
    });
  }

  /**
   * Converts text to speech and returns the audio content
   * @param text - The text to convert to speech
   * @param config - Configuration for the text-to-speech conversion
   * @returns Audio content as a Buffer
   */
  async textToSpeech(text: string, config: TextToSpeechConfig): Promise<Buffer> {
    try {
      // Default values
      const ssmlGender = config.ssmlGender || 'FEMALE';
      const audioEncoding = config.audioEncoding || 'MP3';
      
      // Prepare request with proper types
      const request: textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { text },
        voice: {
          languageCode: config.languageCode,
          name: config.name,
          // Handle proper type assignment
          ssmlGender: ssmlGender as unknown as textToSpeech.protos.google.cloud.texttospeech.v1.SsmlVoiceGender,
        },
        audioConfig: {
          // Handle proper type assignment
          audioEncoding: audioEncoding as unknown as textToSpeech.protos.google.cloud.texttospeech.v1.AudioEncoding,
        },
      };

      // Make request
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      return response.audioContent as Buffer;
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  }

  /**
   * Converts audio data to text
   * @param base64AudioData - Base64 encoded audio data
   * @param config - Configuration for the speech-to-text conversion
   * @returns Transcription result
   */
  async speechToText(base64AudioData: string, config: SpeechToTextConfig): Promise<string> {
    try {
      // Log the language to debug language-specific issues
      console.log(`Processing speech recognition for language: ${config.languageCode}`);
      
      // Default values 
      const encoding = config.encoding || 'WEBM_OPUS';
      
      // Prepare request with proper types
      const request: speech.protos.google.cloud.speech.v1.IRecognizeRequest = {
        audio: {
          content: base64AudioData
        },
        config: {
          // Handle proper type assignment
          encoding: encoding as unknown as speech.protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding,
          sampleRateHertz: config.sampleRateHertz || 48000,
          languageCode: config.languageCode,
          // Additional parameters to improve accuracy:
          enableWordTimeOffsets: false,
          enableAutomaticPunctuation: true,
          // Use command and search optimization for short phrases
          useEnhanced: true,
          model: 'command_and_search',
          // Increase sensitivity to detect shorter phrases
          speechContexts: [{
            phrases: ["hello", "hi", "yes", "no"],
            boost: 10
          }],
        }
      };
      
      // Log the request config for debugging
      console.log('Speech recognition request config:', JSON.stringify({
        encoding: request.config?.encoding,
        sampleRate: request.config?.sampleRateHertz,
        languageCode: request.config?.languageCode,
        model: request.config?.model,
      }));
      
      // Make request
      const [response] = await this.speechClient.recognize(request);
      
      // Log response for debugging
      console.log('Raw speech recognition response:', JSON.stringify({
        resultCount: response.results?.length || 0,
        results: response.results?.map(r => ({
          alternatives: r.alternatives?.length || 0,
        })),
      }));
      
      // Extract transcription
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join(' ') || '';
      
      console.log(`Final transcription: "${transcription}"`);
      
      return transcription;
    } catch (error) {
      console.error('Error in speech-to-text:', error);
      throw error;
    }
  }
}

// Create singleton instance for use throughout the app
export const speakingService = new SpeakingService();
