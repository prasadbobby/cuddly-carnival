'use client';
import { useState, useRef, useEffect } from 'react';
import Button from './Button';

export default function TextToSpeech({ text, title = "Learning Content" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  
  const utteranceRef = useRef(null);
  const textChunks = useRef([]);
  const currentChunkIndex = useRef(0);
  const isActivelyPlaying = useRef(false); // Track if we should continue playing
  const playbackQueue = useRef([]); // Queue for continuous playback

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      loadVoices();
      
      // Load voices when they change (some browsers load them asynchronously)
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
      isActivelyPlaying.current = false;
    };
  }, []);

  useEffect(() => {
    // Process text into chunks when it changes
    if (text) {
      const cleanedText = cleanTextForSpeech(text);
      textChunks.current = splitTextIntoChunks(cleanedText, 200);
      setDuration(textChunks.current.length);
      playbackQueue.current = [...Array(textChunks.current.length).keys()]; // Create queue [0,1,2,3...]
      console.log(`📝 Prepared ${textChunks.current.length} text chunks for continuous playback`);
    }
  }, [text]);

  const loadVoices = () => {
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
    
    // Try to find a good English voice
    const englishVoices = availableVoices.filter(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Natural') || voice.name.includes('Enhanced') || voice.quality === 'enhanced')
    );
    
    if (englishVoices.length > 0) {
      setSelectedVoice(englishVoices[0]);
    } else if (availableVoices.length > 0) {
      setSelectedVoice(availableVoices[0]);
    }
  };

  const cleanTextForSpeech = (text) => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
      .replace(/`(.*?)`/g, '$1') // Remove code backticks
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links, keep text
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper spacing after sentences
      .trim();
  };

  const splitTextIntoChunks = (text, maxLength) => {
    // Split by sentences for more natural pauses
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      // If adding this sentence would exceed maxLength, save current chunk
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + ' ';
      } else {
        currentChunk += sentence + ' ';
      }
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  };

  const startContinuousPlayback = () => {
    console.log('🎯 Starting continuous playback from chunk', currentChunkIndex.current);
    isActivelyPlaying.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    
    playNextChunk();
  };

  const playNextChunk = () => {
    // Check if we should continue playing
    if (!isActivelyPlaying.current || currentChunkIndex.current >= textChunks.current.length) {
      if (currentChunkIndex.current >= textChunks.current.length) {
        // Finished all chunks
        console.log('🎉 Completed reading all content!');
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentPosition(textChunks.current.length);
        currentChunkIndex.current = 0; // Reset for next play
        isActivelyPlaying.current = false;
      }
      return;
    }

    const chunkIndex = currentChunkIndex.current;
    const textToSpeak = textChunks.current[chunkIndex];
    
    if (!textToSpeak) {
      playNextChunk(); // Skip empty chunks
      return;
    }

    console.log(`🔊 Speaking chunk ${chunkIndex + 1}/${textChunks.current.length}`);
    
    // Cancel any existing speech
    speechSynthesis.cancel();
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log(`▶️ Started chunk ${chunkIndex + 1}`);
      setCurrentPosition(chunkIndex + 1);
    };

    utterance.onend = () => {
      console.log(`✅ Finished chunk ${chunkIndex + 1}`);
      
      // Move to next chunk
      currentChunkIndex.current += 1;
      
      // Continue playing if we're still supposed to be playing
      if (isActivelyPlaying.current) {
        // Small delay for natural flow
        setTimeout(() => {
          if (isActivelyPlaying.current) {
            playNextChunk();
          }
        }, 50); // Very short delay
      }
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech error:', event);
      // Try to continue despite errors
      currentChunkIndex.current += 1;
      if (isActivelyPlaying.current) {
        setTimeout(() => {
          if (isActivelyPlaying.current) {
            playNextChunk();
          }
        }, 100);
      }
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    console.log('▶️ Play button clicked');
    
    if (isPaused) {
      // Resume from current position
      console.log('▶️ Resuming from chunk', currentChunkIndex.current);
      startContinuousPlayback();
    } else {
      // Start from beginning or current position
      console.log('▶️ Starting playback');
      if (currentPosition >= duration) {
        // If we're at the end, start from beginning
        currentChunkIndex.current = 0;
        setCurrentPosition(0);
      }
      startContinuousPlayback();
    }
  };

  const handlePause = () => {
    console.log('⏸️ Pause button clicked');
    isActivelyPlaying.current = false;
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    console.log('⏹️ Stop button clicked');
    isActivelyPlaying.current = false;
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPosition(0);
    currentChunkIndex.current = 0;
  };

  const handleRestart = () => {
    console.log('🔄 Restart button clicked');
    isActivelyPlaying.current = false;
    speechSynthesis.cancel();
    currentChunkIndex.current = 0;
    setCurrentPosition(0);
    setIsPlaying(false);
    setIsPaused(false);
    
    // Start playing immediately
    setTimeout(() => {
      startContinuousPlayback();
    }, 100);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (isPlaying) {
      // Continue with new speed
      console.log('🔄 Speed changed to', newSpeed);
      speechSynthesis.cancel();
      setTimeout(() => {
        if (isActivelyPlaying.current) {
          playNextChunk();
        }
      }, 100);
    }
  };

  const handleNextChunk = () => {
    if (currentChunkIndex.current < textChunks.current.length - 1) {
      console.log('⏭️ Skipping to next chunk');
      speechSynthesis.cancel();
      currentChunkIndex.current += 1;
      setCurrentPosition(currentChunkIndex.current + 1);
      
      if (isPlaying) {
        setTimeout(() => {
          if (isActivelyPlaying.current) {
            playNextChunk();
          }
        }, 100);
      }
    }
  };

  const handlePreviousChunk = () => {
    if (currentChunkIndex.current > 0) {
      console.log('⏮️ Going to previous chunk');
      speechSynthesis.cancel();
      currentChunkIndex.current -= 1;
      setCurrentPosition(currentChunkIndex.current + 1);
      
      if (isPlaying) {
        setTimeout(() => {
          if (isActivelyPlaying.current) {
            playNextChunk();
          }
        }, 100);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-yellow-800">
          <span className="text-lg">⚠️</span>
          <span className="text-sm">
            Text-to-Speech is not supported in your browser. Please try a modern browser like Chrome, Firefox, or Safari.
          </span>
        </div>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentPosition / duration) * 100 : 0;
  const isAtEnd = currentPosition >= duration;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-xl">🔊</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">Continuous Audio Learning</h3>
          <p className="text-sm text-gray-600">Listen to: {title}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {Math.round(progressPercentage)}% Complete
          </div>
          <div className="text-xs text-gray-400">
            {currentPosition} / {duration} sections
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-sm relative"
            style={{ width: `${progressPercentage}%` }}
          >
            {isPlaying && (
              <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
            )}
            {progressPercentage > 15 && (
              <div className="absolute inset-0 flex items-center justify-end pr-2">
                <span className="text-white text-xs font-bold">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Text */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Start</span>
          <span className="font-medium">
            {isAtEnd ? '✅ Complete!' : isPlaying ? '🔊 Reading continuously...' : isPaused ? '⏸️ Paused' : '⏹️ Ready to play'}
          </span>
          <span>End</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        {/* Restart Button */}
        <Button
          onClick={handleRestart}
          variant="outline"
          size="sm"
          className="border-blue-300 text-blue-600 hover:bg-blue-50"
          title="Restart from beginning"
        >
          🔄
        </Button>

        {/* Previous Button */}
        <Button
          onClick={handlePreviousChunk}
          variant="outline"
          size="sm"
          className="border-gray-300 text-gray-600 hover:bg-gray-50"
          disabled={currentPosition <= 1}
          title="Previous section"
        >
          ⏮️
        </Button>

        {/* Main Play/Pause Button */}
        <Button
          onClick={isPlaying ? handlePause : handlePlay}
          className={`px-8 py-4 text-lg shadow-lg transform hover:scale-105 transition-all duration-200 ${
            isPlaying 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          } text-white`}
          disabled={!text || textChunks.current.length === 0}
        >
          {isPlaying ? (
            <>
              <span className="text-xl mr-2">⏸️</span>
              <span className="font-semibold">Pause</span>
            </>
          ) : (
            <>
              <span className="text-xl mr-2">▶️</span>
              <span className="font-semibold">
                {isPaused ? 'Resume' : isAtEnd ? 'Play Again' : 'Play All'}
              </span>
            </>
          )}
        </Button>

        {/* Next Button */}
        <Button
          onClick={handleNextChunk}
          variant="outline"
          size="sm"
          className="border-gray-300 text-gray-600 hover:bg-gray-50"
          disabled={currentPosition >= duration}
          title="Next section"
        >
          ⏭️
        </Button>

        {/* Stop Button */}
        <Button
          onClick={handleStop}
          variant="outline"
          size="sm"
          className="border-red-300 text-red-600 hover:bg-red-50"
          disabled={!isPlaying && !isPaused}
          title="Stop and reset"
        >
          ⏹️
        </Button>
      </div>

      {/* Speed and Voice Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
        {/* Speed Control */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">Reading Speed</label>
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value={0.5}>0.5x (Very Slow)</option>
            <option value={0.75}>0.75x (Slow)</option>
            <option value={1}>1x (Normal)</option>
            <option value={1.25}>1.25x (Fast)</option>
            <option value={1.5}>1.5x (Very Fast)</option>
            <option value={2}>2x (Speed Reading)</option>
          </select>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">Voice</label>
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value);
              setSelectedVoice(voice);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {voices.length === 0 ? (
              <option>Loading voices...</option>
            ) : (
              voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          isPlaying ? 'bg-green-100 text-green-800' : 
          isPaused ? 'bg-yellow-100 text-yellow-800' : 
          isAtEnd ? 'bg-blue-100 text-blue-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${
            isPlaying ? 'bg-green-500 animate-pulse' : 
            isPaused ? 'bg-yellow-500' : 
            isAtEnd ? 'bg-blue-500' : 
            'bg-gray-400'
          }`}></div>
          {isPlaying ? '🎵 Reading continuously until you pause...' : 
           isPaused ? '⏸️ Paused - Click Resume to continue' : 
           isAtEnd ? '✅ Finished reading all content!' : 
           '⏹️ Ready to read entire content'}
        </span>
      </div>

      {/* Current Text Preview */}
      {textChunks.current.length > 0 && currentChunkIndex.current < textChunks.current.length && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-700 font-medium">
              {isPlaying ? '🔊 Currently reading:' : '📖 Ready to read:'}
            </div>
            <div className="text-xs text-green-600">
              Section {currentPosition} of {textChunks.current.length}
            </div>
          </div>
          <div className="text-sm text-green-800 leading-relaxed">
            {textChunks.current[currentChunkIndex.current]}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          <strong>💡 How it works:</strong> Click "Play All" to start continuous reading. 
          The system will read through all content automatically until you click "Pause". 
          Use ⏮️ ⏭️ to jump between sections or 🔄 to restart from the beginning.
        </div>
      </div>
    </div>
  );
}