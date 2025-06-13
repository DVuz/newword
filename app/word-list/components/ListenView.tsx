'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Calendar,
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
  addedBy: {
    userId: string;
    userEmail: string;
    userName: string;
    addedAt: string;
  } | null;
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
  getUserBadge: (addedBy: WordData['addedBy']) => {
    icon: React.ComponentType<any>;
    color: string;
    label: string;
  };
  isAuthenticated: boolean;
  currentUserId?: string;
}

export default function ListenView({
  words,
  getAudioUrl,
  getPronunciation,
  getUserBadge,
}: ListenViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState([80]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [playlistWords, setPlaylistWords] = useState<WordData[]>([]);
  const [autoPlay, setAutoPlay] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPlaylistWords([...words]);
    setCurrentIndex(0);
  }, [words]);

  const currentWord = playlistWords[currentIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const loadAudio = async (word: WordData) => {
    const audioUrl = getAudioUrl(word);
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(audioUrl);
    audioRef.current.volume = volume[0] / 100;

    audioRef.current.addEventListener('loadedmetadata', () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    });

    audioRef.current.addEventListener('timeupdate', () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    });

    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);

      if (autoPlay) {
        if (isRepeating) {
          // Repeat current word
          setTimeout(() => {
            playCurrentWord();
          }, 1000);
        } else if (currentIndex < playlistWords.length - 1) {
          // Auto play next word
          setTimeout(() => {
            nextWord();
          }, 1000);
        }
      }
    });

    audioRef.current.addEventListener('error', () => {
      console.error('Error loading audio for:', word.word);
      setIsPlaying(false);
    });
  };

  const playCurrentWord = async () => {
    if (!currentWord) return;

    try {
      if (!audioRef.current) {
        await loadAudio(currentWord);
      }

      if (audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const nextWord = async () => {
    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlistWords.length);
    } else {
      nextIndex = currentIndex < playlistWords.length - 1 ? currentIndex + 1 : 0;
    }

    setCurrentIndex(nextIndex);
    setCurrentTime(0);

    if (playlistWords[nextIndex]) {
      await loadAudio(playlistWords[nextIndex]);
      if (autoPlay) {
        playCurrentWord();
      }
    }
  };

  const prevWord = async () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlistWords.length - 1;
    setCurrentIndex(prevIndex);
    setCurrentTime(0);

    if (playlistWords[prevIndex]) {
      await loadAudio(playlistWords[prevIndex]);
      if (autoPlay) {
        playCurrentWord();
      }
    }
  };

  const shufflePlaylist = () => {
    if (!isShuffled) {
      const shuffled = [...playlistWords].sort(() => Math.random() - 0.5);
      setPlaylistWords(shuffled);
    } else {
      setPlaylistWords([...words]);
    }
    setIsShuffled(!isShuffled);
    setCurrentIndex(0);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentWord) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Không có từ nào để nghe</p>
        </CardContent>
      </Card>
    );
  }

  const userBadge = getUserBadge(currentWord.addedBy);
  const IconComponent = userBadge.icon;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Current Word Display */}
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <IconComponent className="h-4 w-4" />
            <span className={`text-sm px-2 py-1 rounded-full ${userBadge.color}`}>
              {userBadge.label}
            </span>
          </div>
          <CardTitle className="text-3xl font-bold">{currentWord.word}</CardTitle>
          <p className="text-lg text-gray-600">{getPronunciation(currentWord)}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Level and Frequency */}
          <div className="flex justify-center gap-2">
            {currentWord.level && <Badge variant="secondary">{currentWord.level}</Badge>}
            {currentWord.frequency && <Badge variant="outline">{currentWord.frequency}</Badge>}
          </div>

          {/* Vietnamese Translation */}
          {currentWord.vietnamese && (
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <p className="text-orange-700 font-medium">🇻🇳 {currentWord.vietnamese}</p>
            </div>
          )}

          {/* Main Meaning */}
          {currentWord.meanings.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {currentWord.meanings[0].partOfSpeech}
                </Badge>
              </div>
              <p className="text-gray-700">{currentWord.meanings[0].definition}</p>
              {currentWord.meanings[0].vietnamese && (
                <p className="text-orange-600 text-sm mt-1">
                  → {currentWord.meanings[0].vietnamese}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Progress Bar */}
          {/* <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Progress
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              className="w-full h-2 cursor-pointer"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                seekTo(percentage * duration);
              }}
            />
          </div> */}

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" onClick={prevWord} className="h-10 w-10 p-0">
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={isPlaying ? pauseAudio : playCurrentWord}
              size="lg"
              className="h-12 w-12 p-0 rounded-full"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            <Button variant="outline" size="sm" onClick={nextWord} className="h-10 w-10 p-0">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isShuffled ? 'default' : 'outline'}
                size="sm"
                onClick={shufflePlaylist}
                className="h-8 w-8 p-0"
              >
                <Shuffle className="h-3 w-3" />
              </Button>

              <Button
                variant={isRepeating ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsRepeating(!isRepeating)}
                className="h-8 w-8 p-0"
              >
                <Repeat className="h-3 w-3" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 w-32">
              <Volume2 className="h-4 w-4" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>

          {/* Auto Play Toggle */}
          <div className="flex items-center justify-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={e => setAutoPlay(e.target.checked)}
                className="rounded"
              />
              Tự động phát tiếp theo
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Playlist Info */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Từ {currentIndex + 1} / {playlistWords.length}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              Thêm bởi {currentWord.addedBy?.userName || 'Ẩn danh'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-sm text-gray-600">
            💡 <strong>Hướng dẫn:</strong> Sử dụng nút điều khiển để nghe từng từ, bật auto-play để
            nghe liên tục
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
