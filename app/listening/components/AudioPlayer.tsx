'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { AudioContent, Voice } from '../lib/listeningSchemas';
import { ListeningService } from '../lib/listeningService';

interface AudioPlayerProps {
  audioContent: AudioContent;
  voices: Voice[];
  onAudioReady?: () => void;
  onPlaybackComplete?: () => void;
  showTranscript?: boolean;
  autoGenerate?: boolean;
}

export default function AudioPlayer({ 
  audioContent, 
  voices, 
  onAudioReady,
  onPlaybackComplete,
  showTranscript = true,
  autoGenerate = true
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTranscriptState, setShowTranscriptState] = useState(showTranscript);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Generate audio when component mounts
  useEffect(() => {
    if (autoGenerate && !audioUrl && !isGenerating) {
      generateAudio();
    }
  }, [audioContent, autoGenerate]);

  const generateAudio = async () => {
    if (!audioContent.speakers.length || !voices.length) {
      setError('No speakers or voices available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('Generating multi-speaker audio...');
      console.log('Text length:', audioContent.transcript_de.length);
      console.log('Text preview:', audioContent.transcript_de.substring(0, 100) + '...');
      console.log('Available voices:', voices.map(v => ({ name: v.name, voice_id: v.voice_id })));
      console.log('Speakers:', audioContent.speakers);
      
      // Generate multi-speaker audio
      const response = await fetch('/api/listening/generate-multi-speaker-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: audioContent.transcript_de,
          speakers: audioContent.speakers,
          voices: voices,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate multi-speaker audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Preload the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      
      onAudioReady?.();
      
    } catch (err) {
      console.error('Error generating audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPlaybackComplete?.();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {ListeningService.getTaskTypeIcon(audioContent.type)} {audioContent.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-sm">
                {ListeningService.getTaskTypeDisplay(audioContent.type)}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {audioContent.duration_minutes} min
              </Badge>
              <Badge variant="outline" className="text-sm">
                {audioContent.speakers.length} speaker{audioContent.speakers.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          
          {/* Playback Speed Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
                          {[0.5, 0.75, 1, 1.25, 1.5].map(speed => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSpeedChange(speed)}
                  className="text-xs"
                >
                  {speed}x
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranscriptState(!showTranscriptState)}
                className="text-xs"
              >
                {showTranscriptState ? 'Hide' : 'Show'} Transcript
              </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Audio Generation Status */}
        {isGenerating && (
          <div className="flex items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            <span className="text-blue-600 dark:text-blue-400">Generating multi-speaker audio with ElevenLabs...</span>
          </div>
        )}

        {/* Transcript Display */}
        {showTranscriptState && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transcript</h3>
            <Tabs defaultValue="german" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="german">German</TabsTrigger>
                <TabsTrigger value="english">English</TabsTrigger>
              </TabsList>
              <TabsContent value="german" className="mt-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {audioContent.transcript_de ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {audioContent.transcript_de}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">
                      No German transcript available
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="english" className="mt-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {audioContent.transcript_en ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {audioContent.transcript_en}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">
                      No English transcript available
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button 
              onClick={generateAudio} 
              variant="outline" 
              size="sm" 
              className="mt-2"
              disabled={isGenerating}
            >
              Try Again
            </Button>
          </div>
        )}
        
        {/* Audio Player */}
        {audioUrl && (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              preload="metadata"
            />
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div 
                ref={progressRef}
                className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={restart}
                  variant="outline"
                  size="sm"
                  disabled={!audioUrl}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={togglePlayPause}
                  variant="default"
                  size="lg"
                  disabled={!audioUrl}
                  className="px-8"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  <span className="ml-2">
                    {isPlaying ? 'Pause' : 'Play'}
                  </span>
                </Button>
              </div>
              
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="sm"
                >
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Transcript and Additional Info */}
        {showTranscript && (
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="translation">Translation</TabsTrigger>
              <TabsTrigger value="speakers">Speakers</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcript" className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">German Transcript</h4>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {audioContent.transcript_de}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="translation" className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">English Translation</h4>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {audioContent.transcript_en}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="speakers" className="space-y-4">
              <div className="grid gap-4">
                {audioContent.speakers.map((speaker, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold">{speaker.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {speaker.role}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      Voice ID: {speaker.voice_id}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Content Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Topic:</strong> {audioContent.topic}</div>
                    <div><strong>Type:</strong> {ListeningService.getTaskTypeDisplay(audioContent.type)}</div>
                    <div><strong>Duration:</strong> {audioContent.duration_minutes} minutes</div>
                    <div><strong>Difficulty:</strong> {audioContent.difficulty_level}</div>
                    <div><strong>Questions:</strong> {audioContent.questions.length}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm">{audioContent.description}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 