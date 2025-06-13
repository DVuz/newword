'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  EyeOff,
  Zap,
  Clock,
  Turtle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface WordData {
  _id: string;
  word: string;
  pronunciation: {
    uk: string;
    us: string;
  };
  audio: {
    uk: string;
    us: string;
  };
  level: string;
  frequency: string;
  meanings: Array<{
    partOfSpeech: string;
    definition: string;
    examples: string[];
    vietnamese?: string;
  }>;
  vietnamese: string;
  createdAt: string;
}

interface ListenViewProps {
  words: WordData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  selectedDate: string;
  currentPage: number;
  onPageChange: (page: number) => Promise<void>;
  getAudioUrl: (word: WordData) => string;
  getPronunciation: (word: WordData) => string;
}

export default function ListenView({
  words,
  pagination,
  selectedDate,
  currentPage,
  onPageChange,
  getAudioUrl,
  getPronunciation,
}: ListenViewProps) {
  // States
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentAudioType, setCurrentAudioType] = useState<'uk' | 'us'>('uk');
  const [playbackPhase, setPlaybackPhase] = useState<'idle' | 'playing' | 'waiting'>('idle');
  const [showSettings, setShowSettings] = useState(false); // Mobile settings toggle

  // Settings - CÀI ĐẶT PHÙ HỢP HỢN
  const [settings, setSettings] = useState({
    pauseBetweenAudios: 500, // Giảm từ 800ms → 500ms (nhanh hơn)
    pauseBetweenWords: 1000, // Giảm từ 1500ms → 1000ms (nhanh hơn)
    showWord: true,
    showMeaning: false,
    autoNextPage: true,
    playbackSpeed: 1.25, // Tăng từ 1.0x → 1.25x (nhanh hơn)
    playBothAccents: true, // UK + US
  });

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);
  const processingRef = useRef(false);
  const wordProcessedRef = useRef<Set<number>>(new Set());

  // Cleanup function
  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (error) {
        console.warn('Error cleaning up audio:', error);
      }
      audioRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Hàm phát audio theo type
  const playAudio = useCallback(
    async (word: WordData, type: 'uk' | 'us'): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isPlayingRef.current) {
          reject(new Error('Playback stopped'));
          return;
        }

        const audioUrl = word.audio[type];
        if (!audioUrl) {
          reject(new Error(`No ${type.toUpperCase()} audio`));
          return;
        }

        cleanupAudio();

        try {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.playbackRate = settings.playbackSpeed;

          const handleEnded = () => {
            console.log(`${type.toUpperCase()} audio ended for: ${word.word}`);
            cleanup();
            resolve();
          };

          const handleError = (e: any) => {
            console.error(`${type.toUpperCase()} audio error for ${word.word}:`, e);
            cleanup();
            reject(new Error(`${type.toUpperCase()} audio failed`));
          };

          const cleanup = () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
          };

          audio.addEventListener('ended', handleEnded);
          audio.addEventListener('error', handleError);

          setPlaybackPhase('playing');
          setCurrentAudioType(type);

          audio.play().catch(error => {
            cleanup();
            reject(error);
          });
        } catch (error) {
          reject(error);
        }
      });
    },
    [settings.playbackSpeed, cleanupAudio]
  );

  // Hàm delay với promise - SỬ DỤNG CURRENT SETTINGS
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isPlayingRef.current) {
        reject(new Error('Playback stopped'));
        return;
      }

      timeoutRef.current = setTimeout(() => {
        if (isPlayingRef.current) {
          resolve();
        } else {
          reject(new Error('Playback stopped'));
        }
      }, ms);
    });
  }, []);

  // Hàm xử lý từng từ - LOGIC CHÍNH
  const processCurrentWord = useCallback(async () => {
    if (
      processingRef.current ||
      !isPlayingRef.current ||
      words.length === 0 ||
      currentWordIndex >= words.length
    ) {
      return;
    }

    processingRef.current = true;
    const currentWord = words[currentWordIndex];
    const wordKey = currentWordIndex;

    if (wordProcessedRef.current.has(wordKey)) {
      console.log(`🔄 Word ${wordKey} already processed, skipping...`);
      processingRef.current = false;
      return;
    }

    console.log(
      `🔊 Processing word ${currentWordIndex + 1}/${words.length}: "${currentWord.word}"`
    );
    wordProcessedRef.current.add(wordKey);

    try {
      setPlaybackPhase('playing');

      // Phát audio theo cài đặt
      if (settings.playBothAccents) {
        // Phát UK trước
        if (currentWord.audio.uk) {
          console.log(`🇬🇧 Playing UK audio for: ${currentWord.word} at ${settings.playbackSpeed}x`);
          await playAudio(currentWord, 'uk');

          if (!isPlayingRef.current) return;

          console.log(`⏸️ Pause ${settings.pauseBetweenAudios}ms between UK-US`);
          setPlaybackPhase('waiting');
          await delay(settings.pauseBetweenAudios);

          if (!isPlayingRef.current) return;
        }

        // Phát US sau
        if (currentWord.audio.us) {
          console.log(`🇺🇸 Playing US audio for: ${currentWord.word} at ${settings.playbackSpeed}x`);
          await playAudio(currentWord, 'us');
        }
      } else {
        // Chỉ phát US
        if (currentWord.audio.us) {
          console.log(`🇺🇸 Playing US audio for: ${currentWord.word} at ${settings.playbackSpeed}x`);
          await playAudio(currentWord, 'us');
        }
      }

      if (!isPlayingRef.current) return;

      console.log(`✅ Finished playing: ${currentWord.word}`);

      // Xác định bước tiếp theo
      if (currentWordIndex < words.length - 1) {
        console.log(`⏸️ Pause ${settings.pauseBetweenWords}ms before next word`);
        setPlaybackPhase('waiting');
        await delay(settings.pauseBetweenWords);

        if (!isPlayingRef.current) return;

        console.log(`➡️ Moving to word ${currentWordIndex + 2}/${words.length}`);
        setCurrentWordIndex(currentWordIndex + 1);
      } else if (settings.autoNextPage && currentPage < pagination.pages) {
        console.log(`⏸️ Pause ${settings.pauseBetweenWords}ms before next page`);
        setPlaybackPhase('waiting');
        await delay(settings.pauseBetweenWords);

        if (!isPlayingRef.current) return;

        try {
          console.log(`📄 Moving to page ${currentPage + 1}/${pagination.pages}`);
          await onPageChange(currentPage + 1);
          setCurrentWordIndex(0);
          wordProcessedRef.current.clear();
        } catch (error) {
          console.error('Error changing page:', error);
          stopAutoPlay();
        }
      } else {
        console.log('🏁 Finished all words and pages');
        stopAutoPlay();
      }
    } catch (error: any) {
      if (!error.message?.includes('stopped')) {
        console.error('Error processing word:', error);

        if (isPlayingRef.current) {
          setTimeout(() => {
            if (isPlayingRef.current) {
              if (currentWordIndex < words.length - 1) {
                setCurrentWordIndex(currentWordIndex + 1);
              } else {
                skipToNext();
              }
            }
          }, 500);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [
    words,
    currentWordIndex,
    settings,
    currentPage,
    pagination.pages,
    playAudio,
    delay,
    onPageChange,
  ]);

  // Effect để trigger processCurrentWord khi cần
  useEffect(() => {
    if (isAutoPlaying && isPlayingRef.current && !processingRef.current) {
      const timer = setTimeout(() => {
        if (isPlayingRef.current && !processingRef.current) {
          processCurrentWord();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentWordIndex, isAutoPlaying, processCurrentWord]);

  // Control functions
  const startAutoPlay = useCallback(() => {
    if (words.length === 0) return;

    console.log('▶️ Starting auto play...');
    setIsAutoPlaying(true);
    isPlayingRef.current = true;
    processingRef.current = false;
    wordProcessedRef.current.clear();
    setPlaybackPhase('waiting');
  }, [words.length]);

  const stopAutoPlay = useCallback(() => {
    console.log('⏸️ Stopping auto play...');
    setIsAutoPlaying(false);
    isPlayingRef.current = false;
    processingRef.current = false;
    wordProcessedRef.current.clear();
    setPlaybackPhase('idle');
    cleanupAudio();
  }, [cleanupAudio]);

  const skipToNext = useCallback(() => {
    console.log('⏭️ Manual skip to next');
    cleanupAudio();
    processingRef.current = false;
    wordProcessedRef.current.clear();

    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else if (settings.autoNextPage && currentPage < pagination.pages) {
      onPageChange(currentPage + 1);
      setCurrentWordIndex(0);
    } else {
      stopAutoPlay();
    }
  }, [
    currentWordIndex,
    words.length,
    settings.autoNextPage,
    currentPage,
    pagination.pages,
    onPageChange,
    stopAutoPlay,
    cleanupAudio,
  ]);

  const skipToPrev = useCallback(() => {
    console.log('⏮️ Manual skip to previous');
    cleanupAudio();
    processingRef.current = false;
    wordProcessedRef.current.clear();

    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    } else if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setCurrentWordIndex(Math.min(19, words.length - 1));
    }
  }, [currentWordIndex, currentPage, onPageChange, words.length, cleanupAudio]);

  const resetToBeginning = useCallback(() => {
    console.log('🔄 Reset to beginning');
    stopAutoPlay();
    setCurrentWordIndex(0);
    wordProcessedRef.current.clear();
  }, [stopAutoPlay]);

  // ✅ PRESET FUNCTIONS - CÀI ĐẶT NHANH
  const applyPreset = useCallback((preset: 'fast' | 'normal' | 'slow') => {
    const presets = {
      fast: {
        pauseBetweenAudios: 300,
        pauseBetweenWords: 600,
        playbackSpeed: 1.5,
      },
      normal: {
        pauseBetweenAudios: 500,
        pauseBetweenWords: 1000,
        playbackSpeed: 1.25,
      },
      slow: {
        pauseBetweenAudios: 800,
        pauseBetweenWords: 1800,
        playbackSpeed: 0.9,
      },
    };

    setSettings(prev => ({ ...prev, ...presets[preset] }));

    // Cập nhật tốc độ audio đang phát
    if (audioRef.current) {
      audioRef.current.playbackRate = presets[preset].playbackSpeed;
    }

    console.log(`📊 Applied ${preset} preset:`, presets[preset]);
  }, []);

  // Cleanup effects
  useEffect(() => {
    return () => {
      stopAutoPlay();
      processingRef.current = false;
      wordProcessedRef.current.clear();
    };
  }, [stopAutoPlay]);

  useEffect(() => {
    if (words.length > 0 && currentWordIndex >= words.length) {
      setCurrentWordIndex(Math.min(words.length - 1, 0));
    }
    if (!isAutoPlaying) {
      setPlaybackPhase('idle');
      processingRef.current = false;
      wordProcessedRef.current.clear();
    }
  }, [words, currentWordIndex, isAutoPlaying]);

  useEffect(() => {
    wordProcessedRef.current.clear();
    processingRef.current = false;
  }, [currentPage]);

  const currentWord = words[currentWordIndex];
  const globalWordIndex = (currentPage - 1) * pagination.limit + currentWordIndex + 1;

  return (
    <div className="max-w-6xl mx-auto space-y-3 px-2 sm:px-4">
      {/* Header - Mobile Optimized */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-purple-700 flex items-center gap-2 flex-wrap">
                🎧 Chế độ Nghe Tự Động
                {settings.playBothAccents ? (
                  <Badge variant="secondary" className="text-xs">
                    🇬🇧 UK + 🇺🇸 US
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    🇺🇸 US Only
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {settings.playbackSpeed}x
                </Badge>
              </h2>
              <p className="text-xs text-purple-600 mt-1">
                Tự động phát {settings.playBothAccents ? 'UK → US' : 'US'} → chuyển từ tiếp theo
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToBeginning}
                disabled={isAutoPlaying}
                className="h-8 px-2 sm:px-3"
              >
                <RotateCcw className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Reset</span>
              </Button>

              <Button
                variant={isAutoPlaying ? 'destructive' : 'default'}
                size="sm"
                onClick={isAutoPlaying ? stopAutoPlay : startAutoPlay}
                className="h-8 px-3 sm:px-4"
                disabled={words.length === 0}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Bắt đầu</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Controls Bar - Mobile */}
      <div className="block lg:hidden">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Điều khiển nhanh</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 px-2"
              >
                {showSettings ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick Presets Always Visible */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 flex items-center justify-center gap-1"
                onClick={() => applyPreset('fast')}
              >
                <Zap className="h-3 w-3" />
                Nhanh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 flex items-center justify-center gap-1"
                onClick={() => applyPreset('normal')}
              >
                <Clock className="h-3 w-3" />
                Vừa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 flex items-center justify-center gap-1"
                onClick={() => applyPreset('slow')}
              >
                <Turtle className="h-3 w-3" />
                Chậm
              </Button>
            </div>

            {/* Manual Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={skipToPrev}
                disabled={isAutoPlaying || (currentWordIndex === 0 && currentPage === 1)}
                className="h-8 px-3"
              >
                <SkipBack className="h-4 w-4 mr-1" />
                Trước
              </Button>

              <div className="text-center px-3">
                <div className="text-sm font-medium text-gray-700">
                  {currentWordIndex + 1}/{words.length}
                </div>
                <div className="text-xs text-gray-500">
                  Từ {globalWordIndex}/{pagination.total}
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={skipToNext} className="h-8 px-3">
                Sau
                <SkipForward className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Tiến độ</span>
                <span>{Math.round((globalWordIndex / pagination.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(globalWordIndex / pagination.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Status */}
            {isAutoPlaying && (
              <div className="text-center p-2 bg-purple-50 rounded text-sm mt-3">
                {playbackPhase === 'playing' && (
                  <span className="text-purple-600">
                    🔊 Đang phát {currentAudioType === 'uk' ? '🇬🇧 UK' : '🇺🇸 US'}
                    <span className="ml-1 text-xs">({settings.playbackSpeed}x)</span>
                  </span>
                )}
                {playbackPhase === 'waiting' && (
                  <span className="text-purple-600">⏳ Đang nghỉ...</span>
                )}
              </div>
            )}

            {/* Collapsible Settings */}
            {showSettings && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Basic Switches */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs">UK + US</label>
                    <Switch
                      checked={settings.playBothAccents}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, playBothAccents: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs">Tự chuyển trang</label>
                    <Switch
                      checked={settings.autoNextPage}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, autoNextPage: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Timing Controls */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs">UK-US: {settings.pauseBetweenAudios}ms</label>
                    </div>
                    <Slider
                      value={[settings.pauseBetweenAudios]}
                      onValueChange={([value]) =>
                        setSettings(prev => ({ ...prev, pauseBetweenAudios: value }))
                      }
                      min={200}
                      max={2000}
                      step={50}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs">Từ: {settings.pauseBetweenWords}ms</label>
                    </div>
                    <Slider
                      value={[settings.pauseBetweenWords]}
                      onValueChange={([value]) =>
                        setSettings(prev => ({ ...prev, pauseBetweenWords: value }))
                      }
                      min={300}
                      max={3000}
                      step={50}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs">Tốc độ: {settings.playbackSpeed}x</label>
                    </div>
                    <Slider
                      value={[settings.playbackSpeed]}
                      onValueChange={([value]) => {
                        setSettings(prev => ({ ...prev, playbackSpeed: value }));
                        if (audioRef.current) {
                          audioRef.current.playbackRate = value;
                        }
                      }}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Display Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs">Hiển thị từ</label>
                    <Switch
                      checked={settings.showWord}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, showWord: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs">Hiển thị nghĩa</label>
                    <Switch
                      checked={settings.showMeaning}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, showMeaning: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Layout - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Word Display - Mobile First */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card
            className={`transition-all duration-300 ${
              isAutoPlaying ? 'ring-2 ring-purple-300 shadow-lg' : ''
            } ${playbackPhase === 'playing' ? 'bg-purple-50' : ''}`}
          >
            <CardContent className="p-4 sm:p-8 text-center min-h-[400px] sm:min-h-[500px] flex flex-col justify-center">
              {currentWord ? (
                <div className="space-y-4 sm:space-y-6">
                  {settings.showWord && (
                    <div className="space-y-3 sm:space-y-4">
                      <h1
                        className={`text-3xl sm:text-5xl font-bold transition-all duration-300 ${
                          isAutoPlaying && playbackPhase === 'playing'
                            ? 'text-purple-600 scale-105 animate-pulse'
                            : 'text-gray-700'
                        }`}
                      >
                        {currentWord.word}
                      </h1>

                      {/* Pronunciation - Responsive */}
                      <div className="space-y-1 sm:space-y-2">
                        {currentWord.pronunciation.uk && (
                          <div className="text-base sm:text-xl text-gray-600">
                            🇬🇧 /{currentWord.pronunciation.uk}/
                          </div>
                        )}
                        {currentWord.pronunciation.us && (
                          <div className="text-base sm:text-xl text-gray-600">
                            🇺🇸 /{currentWord.pronunciation.us}/
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center gap-2 flex-wrap">
                        {currentWord.level && (
                          <Badge variant="secondary" className="text-xs">
                            {currentWord.level}
                          </Badge>
                        )}
                        <Badge
                          variant={playbackPhase === 'playing' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            playbackPhase === 'playing' ? 'bg-purple-600' : ''
                          }`}
                        >
                          {playbackPhase === 'playing'
                            ? `🔊 ${currentAudioType === 'uk' ? '🇬🇧 UK' : '🇺🇸 US'} (${
                                settings.playbackSpeed
                              }x)`
                            : `Ready (${settings.playbackSpeed}x)`}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {settings.showMeaning && (
                    <div className="border-t pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                      <h2 className="text-xl sm:text-3xl font-semibold text-green-600">
                        {currentWord.vietnamese}
                      </h2>

                      <div className="space-y-2 sm:space-y-3 text-left max-w-2xl mx-auto">
                        {currentWord.meanings.slice(0, 2).map((meaning, idx) => (
                          <div key={idx} className="border-l-4 border-green-200 pl-3 sm:pl-4">
                            <Badge variant="outline" className="text-xs mb-1 sm:mb-2">
                              {meaning.partOfSpeech}
                            </Badge>
                            <p className="text-sm sm:text-base text-gray-700">
                              {meaning.definition}
                            </p>
                            {meaning.examples && meaning.examples[0] && (
                              <p className="text-xs sm:text-sm text-gray-500 italic mt-1">
                                "{meaning.examples[0]}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!settings.showWord && !settings.showMeaning && (
                    <div className="text-gray-500">
                      <Volume2 className="h-16 w-16 sm:h-24 sm:w-24 mx-auto mb-4 sm:mb-6 opacity-50" />
                      <p className="text-xl sm:text-2xl">Chế độ chỉ nghe</p>
                      <p className="text-base sm:text-lg mt-2">
                        {settings.playBothAccents ? '🇬🇧 UK + 🇺🇸 US' : '🇺🇸 US Only'}
                      </p>
                      <p className="text-base sm:text-lg mt-2">
                        Từ {currentWordIndex + 1}/{words.length} • {settings.playbackSpeed}x
                      </p>
                    </div>
                  )}

                  {/* Visual feedback */}
                  {isAutoPlaying && playbackPhase === 'playing' && (
                    <div className="flex justify-center space-x-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* No audio warning */}
                  {!currentWord.audio.uk && !currentWord.audio.us && (
                    <div className="mt-4 text-amber-600 text-sm flex items-center justify-center gap-2">
                      <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                      Không có audio cho từ này
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">
                  <p className="text-xl sm:text-2xl">Không có từ vựng để hiển thị</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Settings Panel */}
        <div className="hidden lg:block lg:col-span-1 space-y-4 order-2 lg:order-1">
          {/* Quick Presets */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Cài đặt nhanh
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 flex items-center justify-center gap-1"
                  onClick={() => applyPreset('fast')}
                >
                  <Zap className="h-3 w-3" />
                  Nhanh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 flex items-center justify-center gap-1"
                  onClick={() => applyPreset('normal')}
                >
                  <Clock className="h-3 w-3" />
                  Vừa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 flex items-center justify-center gap-1"
                  onClick={() => applyPreset('slow')}
                >
                  <Turtle className="h-3 w-3" />
                  Chậm
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div>• Nhanh: UK-US 300ms, Từ 600ms, 1.5x</div>
                <div>• Vừa: UK-US 500ms, Từ 1s, 1.25x</div>
                <div>• Chậm: UK-US 800ms, Từ 1.8s, 0.9x</div>
              </div>
            </CardContent>
          </Card>

          {/* Fine-tune Settings */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Điều chỉnh chi tiết
              </h3>

              {/* Play Both Accents */}
              <div className="flex items-center justify-between">
                <label className="text-sm">Phát cả UK + US</label>
                <Switch
                  checked={settings.playBothAccents}
                  onCheckedChange={checked =>
                    setSettings(prev => ({ ...prev, playBothAccents: checked }))
                  }
                />
              </div>

              {/* Auto Next Page */}
              <div className="flex items-center justify-between">
                <label className="text-sm">Tự chuyển trang</label>
                <Switch
                  checked={settings.autoNextPage}
                  onCheckedChange={checked =>
                    setSettings(prev => ({ ...prev, autoNextPage: checked }))
                  }
                />
              </div>

              {/* Pause Between Audios */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm">Nghỉ giữa UK-US</label>
                  <Badge variant="outline" className="text-xs">
                    {settings.pauseBetweenAudios}ms
                  </Badge>
                </div>
                <Slider
                  value={[settings.pauseBetweenAudios]}
                  onValueChange={([value]) => {
                    setSettings(prev => ({ ...prev, pauseBetweenAudios: value }));
                  }}
                  min={200}
                  max={2000}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>200ms</span>
                  <span>1s</span>
                  <span>2s</span>
                </div>
              </div>

              {/* Pause Between Words */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm">Nghỉ giữa từ</label>
                  <Badge variant="outline" className="text-xs">
                    {settings.pauseBetweenWords}ms
                  </Badge>
                </div>
                <Slider
                  value={[settings.pauseBetweenWords]}
                  onValueChange={([value]) => {
                    setSettings(prev => ({ ...prev, pauseBetweenWords: value }));
                  }}
                  min={300}
                  max={3000}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.3s</span>
                  <span>1.5s</span>
                  <span>3s</span>
                </div>
              </div>

              {/* Playback Speed */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm">Tốc độ phát</label>
                  <Badge
                    variant={settings.playbackSpeed === 1.0 ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {settings.playbackSpeed}x
                  </Badge>
                </div>
                <Slider
                  value={[settings.playbackSpeed]}
                  onValueChange={([value]) => {
                    setSettings(prev => ({ ...prev, playbackSpeed: value }));
                    if (audioRef.current) {
                      audioRef.current.playbackRate = value;
                    }
                  }}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.5x</span>
                  <span>1x</span>
                  <span>1.5x</span>
                  <span>2x</span>
                </div>
              </div>

              {/* Real-time feedback */}
              {isAutoPlaying && (
                <div className="text-xs bg-purple-50 p-2 rounded border-l-4 border-purple-300">
                  <div className="font-medium text-purple-700 mb-1">⚡ Cài đặt hiện tại:</div>
                  <div className="space-y-1 text-purple-600">
                    <div>• UK→US: {settings.pauseBetweenAudios}ms</div>
                    <div>• Từ→Từ: {settings.pauseBetweenWords}ms</div>
                    <div>• Tốc độ: {settings.playbackSpeed}x</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Navigation - Desktop */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-sm">Điều khiển thủ công</h3>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipToPrev}
                  disabled={isAutoPlaying || (currentWordIndex === 0 && currentPage === 1)}
                  className="h-8 px-3"
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  Trước
                </Button>

                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">
                    {currentWordIndex + 1}/{words.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    Từ {globalWordIndex}/{pagination.total}
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={skipToNext} className="h-8 px-3">
                  Sau
                  <SkipForward className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tiến độ</span>
                  <span>{Math.round((globalWordIndex / pagination.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(globalWordIndex / pagination.total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              {isAutoPlaying && (
                <div className="text-center p-2 bg-purple-50 rounded text-sm">
                  {playbackPhase === 'playing' && (
                    <span className="text-purple-600">
                      🔊 Đang phát {currentAudioType === 'uk' ? '🇬🇧 UK' : '🇺🇸 US'}
                      <span className="ml-1 text-xs">({settings.playbackSpeed}x)</span>
                    </span>
                  )}
                  {playbackPhase === 'waiting' && (
                    <span className="text-purple-600">⏳ Đang nghỉ...</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Hiển thị
              </h3>

              <div className="flex items-center justify-between">
                <label className="text-sm">Hiển thị từ</label>
                <Switch
                  checked={settings.showWord}
                  onCheckedChange={checked => setSettings(prev => ({ ...prev, showWord: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Hiển thị nghĩa</label>
                <Switch
                  checked={settings.showMeaning}
                  onCheckedChange={checked =>
                    setSettings(prev => ({ ...prev, showMeaning: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Page Navigation - Bottom */}
      {pagination.pages > 1 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Trang {currentPage}/{pagination.pages} • {pagination.total} từ
                {selectedDate !== 'all' && <span className="text-blue-600 ml-1">(đã lọc)</span>}
              </span>

              <div className="flex gap-2 justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopAutoPlay();
                    onPageChange(currentPage - 1);
                    setCurrentWordIndex(0);
                  }}
                  disabled={currentPage === 1 || isAutoPlaying}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Trước</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopAutoPlay();
                    onPageChange(currentPage + 1);
                    setCurrentWordIndex(0);
                  }}
                  disabled={currentPage === pagination.pages || isAutoPlaying}
                  className="h-8 px-3"
                >
                  <span className="hidden sm:inline mr-1">Sau</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
