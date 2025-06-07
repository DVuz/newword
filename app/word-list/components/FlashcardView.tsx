import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface WordData {
  _id: string;
  word: string;
  pronunciation: { uk: string; us: string };
  audio: { uk: string; us: string };
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

interface FlashcardViewProps {
  words: WordData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  selectedDate: string;
  onPageChange: (page: number) => void;
  getAudioUrl: (word: WordData) => string;
  getPronunciation: (word: WordData) => string;
}

export default function FlashcardView({
  words,
  pagination,
  selectedDate,
  onPageChange,
  getAudioUrl,
  getPronunciation,
}: FlashcardViewProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Hàm phát audio cho từng loại (UK/US)
  const playAudio = (word: WordData, type: 'uk' | 'us') => {
    const audioUrl = word.audio[type];
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  const nextCard = () => {
    setShowAnswer(false);
    if (currentCardIndex < words.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      if (pagination.page < pagination.pages) {
        onPageChange(pagination.page + 1);
      } else {
        setCurrentCardIndex(0);
      }
    }
  };

  const prevCard = () => {
    setShowAnswer(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    } else {
      if (pagination.page > 1) {
        onPageChange(pagination.page - 1);
        setCurrentCardIndex(19);
      } else {
        setCurrentCardIndex(words.length - 1);
      }
    }
  };

  const flipCard = () => {
    setShowAnswer(!showAnswer);
  };

  const resetFlashcards = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const goToFlashcardPage = (page: number) => {
    onPageChange(page);
  };

  const getGlobalCardPosition = () => {
    return (pagination.page - 1) * 20 + currentCardIndex + 1;
  };

  const getTotalCards = () => {
    return pagination.total;
  };

  // Adjust indices when words change
  useEffect(() => {
    if (words.length > 0) {
      if (currentCardIndex >= words.length) {
        setCurrentCardIndex(words.length - 1);
      }
    }
  }, [words, currentCardIndex]);

  if (words.length === 0) return null;

  const currentWord = words[currentCardIndex];

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Enhanced Controls with Global Position */}
      <Card>
        <CardContent className="p-3 space-y-2">
          {/* Global Position & Page Info */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-blue-600">
                Từ {getGlobalCardPosition()}/{getTotalCards()}
              </span>
              <span className="text-gray-500 ml-2">
                (Trang {pagination.page}/{pagination.pages})
              </span>
              {selectedDate !== 'all' && (
                <span className="text-blue-600 ml-1 text-xs">(đã lọc)</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={resetFlashcards} className="h-7 px-2">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={flipCard} className="h-7 px-2">
                {showAnswer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Page Jump Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t">
              <span className="text-xs text-gray-600">Nhảy tới trang:</span>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToFlashcardPage(pageNum)}
                      className="h-6 w-6 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {pagination.pages > 5 && (
                  <>
                    <span className="text-xs text-gray-400">...</span>
                    <Button
                      variant={pagination.page === pagination.pages ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToFlashcardPage(pagination.pages)}
                      className="h-6 w-8 p-0 text-xs"
                    >
                      {pagination.pages}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flashcard */}
      <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={flipCard}>
        <CardContent className="p-6 text-center min-h-[300px] flex flex-col justify-center">
          {!showAnswer ? (
            // Front - Word
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-blue-600">{currentWord.word}</h2>

              {/* Pronunciation với cả UK và US */}
              <div className="space-y-2">
                {currentWord.pronunciation.uk && (
                  <div className="text-lg text-gray-600">🇬🇧 /{currentWord.pronunciation.uk}/</div>
                )}
                {currentWord.pronunciation.us && (
                  <div className="text-lg text-gray-600">🇺🇸 /{currentWord.pronunciation.us}/</div>
                )}
              </div>

              <div className="flex justify-center gap-2 flex-wrap">
                {currentWord.level && (
                  <Badge variant="secondary" className="text-sm">
                    {currentWord.level}
                  </Badge>
                )}
                {currentWord.frequency && (
                  <Badge variant="outline" className="text-sm">
                    {currentWord.frequency.split(' ')[0]}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Trang {pagination.page}
                </Badge>
              </div>

              {/* Audio buttons cho cả UK và US */}
              <div className="flex justify-center gap-3">
                {/* UK Audio */}
                {currentWord.audio.uk ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      playAudio(currentWord, 'uk');
                    }}
                    className="h-8 px-3 text-sm"
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    🇬🇧 UK
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 px-3 text-sm opacity-50"
                  >
                    <VolumeX className="mr-2 h-4 w-4" />
                    🇬🇧 UK
                  </Button>
                )}

                {/* US Audio */}
                {currentWord.audio.us ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      playAudio(currentWord, 'us');
                    }}
                    className="h-8 px-3 text-sm"
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    🇺🇸 US
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 px-3 text-sm opacity-50"
                  >
                    <VolumeX className="mr-2 h-4 w-4" />
                    🇺🇸 US
                  </Button>
                )}
              </div>

              <p className="text-gray-500 text-sm">Nhấn để xem nghĩa</p>
            </div>
          ) : (
            // Back - Meaning
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-600">{currentWord.vietnamese}</h2>

              <div className="space-y-3 text-left max-w-lg mx-auto">
                {currentWord.meanings.slice(0, 2).map((meaning, idx) => (
                  <div key={idx} className="border-l-4 border-green-200 pl-3">
                    <Badge variant="outline" className="text-sm mb-2">
                      {meaning.partOfSpeech}
                    </Badge>
                    <p className="text-sm text-gray-700 mb-2">{meaning.definition}</p>
                    {meaning.vietnamese && (
                      <p className="text-sm text-green-600 italic mb-2">→ {meaning.vietnamese}</p>
                    )}
                    {meaning.examples[0] && (
                      <p className="text-sm text-gray-600 italic">"{meaning.examples[0]}"</p>
                    )}
                  </div>
                ))}
                {currentWord.meanings.length > 2 && (
                  <p className="text-sm text-gray-400 italic text-center">
                    +{currentWord.meanings.length - 2} nghĩa khác...
                  </p>
                )}
              </div>

              {/* Audio buttons trong phần nghĩa */}
              <div className="flex justify-center gap-3 pt-3 border-t">
                {currentWord.audio.uk && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      playAudio(currentWord, 'uk');
                    }}
                    className="h-8 px-3 text-sm"
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    🇬🇧 UK
                  </Button>
                )}
                {currentWord.audio.us && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      playAudio(currentWord, 'us');
                    }}
                    className="h-8 px-3 text-sm"
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    🇺🇸 US
                  </Button>
                )}
              </div>

              <p className="text-gray-500 text-sm">Nhấn để xem từ</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Navigation */}
      <Card>
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={prevCard}
              disabled={words.length <= 1 && pagination.pages <= 1}
              className="h-8 px-4"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Trước
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-600">
                {currentCardIndex + 1}/{words.length} (trang này)
              </div>
              <div className="text-xs text-gray-400">
                Còn {words.length - currentCardIndex - 1} từ
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextCard}
              disabled={words.length <= 1 && pagination.pages <= 1}
              className="h-8 px-4"
            >
              Sau
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(getGlobalCardPosition() / getTotalCards()) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-center text-xs text-gray-500 mt-1">
              Tiến độ: {Math.round((getGlobalCardPosition() / getTotalCards()) * 100)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
