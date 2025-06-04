'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Search,
  Grid3X3,
  CreditCard,
  Volume2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
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

export default function WordList() {
  const [viewMode, setViewMode] = useState<'grid' | 'flashcard'>('grid');
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const router = useRouter();

  // Fetch words
  const fetchWords = async (page = 1, search = '') => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/words/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setWords(data.data.words);
      setPagination(data.data.pagination);
    } catch (error: any) {
      console.error('Error fetching words:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải từ vựng');
    } finally {
      setLoading(false);
    }
  };

  // Search words
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchWords(1, searchQuery);
  };

  // Change page
  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await fetchWords(newPage, searchQuery);
  };

  // Play audio
  const playAudio = (audioUrl: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  // Flashcard functions
  const nextCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex(prev => (prev + 1) % words.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex(prev => (prev - 1 + words.length) % words.length);
  };

  const flipCard = () => {
    setShowAnswer(!showAnswer);
  };

  const resetFlashcards = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  useEffect(() => {
    fetchWords();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Floating Image */}
      <div className="fixed bottom-6 right-6 z-10">
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-white animate-bounce hover:scale-110 transition-transform cursor-pointer">
          <Image
            src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1748938841/%C3%81nh_D%C6%B0%C6%A1ng_s_facebook_2023-4-17_story_1_nm0n4s.jpg"
            alt="Avatar"
            width={64}
            height={64}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-5xl">
        {/* Compact Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          {/* Search & Controls */}
          <Card className="shadow-md">
            <CardContent className="p-4 space-y-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm từ..."
                  className="h-9"
                />
                <Button type="submit" disabled={loading} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => setViewMode('grid')}
                    size="sm"
                  >
                    <Grid3X3 className="mr-1 h-3 w-3" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'flashcard' ? 'default' : 'outline'}
                    onClick={() => {
                      setViewMode('flashcard');
                      resetFlashcards();
                    }}
                    size="sm"
                    disabled={words.length === 0}
                  >
                    <CreditCard className="mr-1 h-3 w-3" />
                    Card
                  </Button>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pagination.total} từ
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm">Đang tải...</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        ) : words.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 text-sm">Không có từ nào</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {words.map(word => (
                    <Card key={word._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Word Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-blue-600 text-lg">{word.word}</h3>
                          {word.level && (
                            <Badge variant="secondary" className="text-xs">
                              {word.level}
                            </Badge>
                          )}
                        </div>

                        {/* Pronunciation */}
                        {word.pronunciation.uk && (
                          <div className="text-xs text-gray-600 mb-2">
                            /{word.pronunciation.uk}/
                          </div>
                        )}

                        {/* Vietnamese */}
                        <div className="text-green-600 font-medium mb-3 text-sm">
                          {word.vietnamese}
                        </div>

                        {/* Main Meaning */}
                        {word.meanings[0] && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {word.meanings[0].partOfSpeech}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {word.meanings[0].definition}
                            </p>
                            {word.meanings[0].examples[0] && (
                              <p className="text-xs text-gray-500 italic mt-1 line-clamp-1">
                                "{word.meanings[0].examples[0]}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Audio Buttons */}
                        <div className="flex gap-2">
                          {word.audio.uk && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playAudio(word.audio.uk)}
                              className="h-7 px-2 text-xs"
                            >
                              <Volume2 className="h-3 w-3 mr-1" />
                              UK
                            </Button>
                          )}
                          {word.audio.us && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playAudio(word.audio.us)}
                              className="h-7 px-2 text-xs"
                            >
                              <Volume2 className="h-3 w-3 mr-1" />
                              US
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Compact Pagination */}
                {pagination.pages > 1 && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {pagination.page}/{pagination.pages}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 px-3"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.pages}
                            className="h-8 px-3"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Flashcard View */}
            {viewMode === 'flashcard' && words.length > 0 && (
              <div className="space-y-4">
                {/* Flashcard Controls */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {currentCardIndex + 1}/{words.length}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetFlashcards}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={flipCard}>
                          {showAnswer ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Flashcard */}
                <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={flipCard}>
                  <CardContent className="p-6 text-center min-h-[300px] flex flex-col justify-center">
                    {!showAnswer ? (
                      // Front - Word
                      <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-blue-600">
                          {words[currentCardIndex].word}
                        </h2>

                        {words[currentCardIndex].pronunciation.uk && (
                          <div className="text-lg text-gray-600">
                            /{words[currentCardIndex].pronunciation.uk}/
                          </div>
                        )}

                        {words[currentCardIndex].level && (
                          <Badge variant="secondary">{words[currentCardIndex].level}</Badge>
                        )}

                        {/* Audio */}
                        <div className="flex justify-center gap-2">
                          {words[currentCardIndex].audio.uk && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                playAudio(words[currentCardIndex].audio.uk);
                              }}
                            >
                              <Volume2 className="mr-1 h-3 w-3" />
                              UK
                            </Button>
                          )}
                          {words[currentCardIndex].audio.us && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                playAudio(words[currentCardIndex].audio.us);
                              }}
                            >
                              <Volume2 className="mr-1 h-3 w-3" />
                              US
                            </Button>
                          )}
                        </div>

                        <p className="text-gray-500 text-sm">Nhấn để xem nghĩa</p>
                      </div>
                    ) : (
                      // Back - Meaning
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-green-600">
                          {words[currentCardIndex].vietnamese}
                        </h2>

                        <div className="space-y-3 text-left max-w-md mx-auto">
                          {words[currentCardIndex].meanings.slice(0, 2).map((meaning, idx) => (
                            <div key={idx}>
                              <Badge variant="outline" className="mb-2">
                                {meaning.partOfSpeech}
                              </Badge>
                              <p className="text-gray-700 text-sm mb-1">{meaning.definition}</p>
                              {meaning.vietnamese && (
                                <p className="text-green-600 text-sm italic mb-1">
                                  → {meaning.vietnamese}
                                </p>
                              )}
                              {meaning.examples[0] && (
                                <p className="text-gray-600 text-xs italic">
                                  "{meaning.examples[0]}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <p className="text-gray-500 text-sm">Nhấn để xem từ</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevCard}
                        disabled={words.length <= 1}
                      >
                        <ChevronLeft className="mr-1 h-3 w-3" />
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextCard}
                        disabled={words.length <= 1}
                      >
                        Sau
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
