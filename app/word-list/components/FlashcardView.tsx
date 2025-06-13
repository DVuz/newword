'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
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
  };
}

interface FlashcardViewProps {
  words: WordData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  selectedDate: string;
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

export default function FlashcardView({
  words,
  getAudioUrl,
  getPronunciation,
  getUserBadge,
}: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<WordData[]>([]);
  const [playingAudio, setPlayingAudio] = useState(false);

  useEffect(() => {
    setShuffledWords([...words]);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [words]);

  const currentWord = shuffledWords[currentIndex];
  const progress = shuffledWords.length > 0 ? ((currentIndex + 1) / shuffledWords.length) * 100 : 0;

  const shuffleCards = () => {
    const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const playAudio = async () => {
    if (!currentWord) return;
    const audioUrl = getAudioUrl(currentWord);
    if (!audioUrl) return;

    try {
      setPlayingAudio(true);
      const audio = new Audio(audioUrl);

      audio.onended = () => setPlayingAudio(false);
      audio.onerror = () => setPlayingAudio(false);

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(false);
    }
  };

  if (!currentWord) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Không có thẻ từ nào</p>
        </CardContent>
      </Card>
    );
  }

  const userBadge = getUserBadge(currentWord.addedBy);
  const IconComponent = userBadge.icon;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Progress and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Thẻ {currentIndex + 1} / {shuffledWords.length}
            </span>
            <div className="flex gap-2">
              <Button onClick={shuffleCards} variant="outline" size="sm">
                <Shuffle className="h-3 w-3 mr-1" />
                Xáo trộn
              </Button>
              <Button onClick={resetCards} variant="outline" size="sm">
                <RotateCcw className="h-3 w-3 mr-1" />
                Bắt đầu lại
              </Button>
            </div>
          </div>
          {/* <Progress value={progress} className="w-full h-2" /> */}
        </CardContent>
      </Card>

      {/* Flashcard */}
      <div className="relative perspective-1000">
        <Card
          className={`
            cursor-pointer transition-all duration-500 transform-style-preserve-3d
            ${isFlipped ? 'rotate-y-180' : ''}
            h-80 relative
          `}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of card (Word) */}
          <div
            className={`
            absolute inset-0 backface-hidden
            ${isFlipped ? 'rotate-y-180' : ''}
          `}
          >
            <CardContent className="h-full flex flex-col justify-center items-center text-center p-6">
              {/* User badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                <span className={`text-xs px-2 py-1 rounded-full ${userBadge.color}`}>
                  {userBadge.label}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <h1 className="text-4xl font-bold text-gray-800">{currentWord.word}</h1>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      playAudio();
                    }}
                    disabled={playingAudio}
                    className="h-10 w-10 p-0"
                  >
                    {playingAudio ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                <p className="text-lg text-gray-600">{getPronunciation(currentWord)}</p>

                <div className="flex justify-center gap-2">
                  {currentWord.level && <Badge variant="secondary">{currentWord.level}</Badge>}
                  {currentWord.frequency && (
                    <Badge variant="outline">{currentWord.frequency}</Badge>
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-4">Nhấn để xem nghĩa</p>
              </div>
            </CardContent>
          </div>

          {/* Back of card (Meaning) */}
          <div
            className={`
            absolute inset-0 backface-hidden rotate-y-180
            ${isFlipped ? 'rotate-y-0' : 'rotate-y-180'}
          `}
          >
            <CardContent className="h-full flex flex-col justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              {/* User badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                <span className={`text-xs px-2 py-1 rounded-full ${userBadge.color}`}>
                  {userBadge.label}
                </span>
              </div>

              <div className="space-y-4">
                {/* Word again */}
                <h2 className="text-2xl font-bold text-center text-gray-800">{currentWord.word}</h2>

                {/* Vietnamese translation */}
                {currentWord.vietnamese && (
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <p className="text-orange-700 font-medium text-center">
                      🇻🇳 {currentWord.vietnamese}
                    </p>
                  </div>
                )}

                {/* Meanings */}
                <div className="space-y-3">
                  {currentWord.meanings.slice(0, 3).map((meaning, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {meaning.partOfSpeech}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-700 mb-1">{meaning.definition}</p>

                      {meaning.vietnamese && (
                        <p className="text-xs text-orange-600">→ {meaning.vietnamese}</p>
                      )}

                      {meaning.examples.length > 0 && (
                        <p className="text-xs text-gray-600 italic mt-1">"{meaning.examples[0]}"</p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 text-center">Nhấn để xem từ</p>

                {/* Date info */}
                <div className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Thêm bởi {currentWord.addedBy.userName}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4">
        <Button onClick={prevCard} disabled={currentIndex === 0} variant="outline" size="lg">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Trước
        </Button>

        <Button
          onClick={nextCard}
          disabled={currentIndex === shuffledWords.length - 1}
          variant="outline"
          size="lg"
        >
          Sau
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-sm text-gray-600">
            💡 <strong>Hướng dẫn:</strong> Nhấn vào thẻ để lật, sử dụng nút điều hướng hoặc phím mũi
            tên
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
