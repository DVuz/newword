'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Calendar,
  Target,
  Filter,
  BookOpen,
  CalendarDays,
  BarChart3,
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

interface DateStats {
  today: number;
  week: number;
  month: number;
  total: number;
  recentDays: Array<{
    date: string;
    count: number;
  }>;
}

export default function WordList() {
  const [viewMode, setViewMode] = useState<'grid' | 'flashcard' | 'study'>('grid');
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [dateStats, setDateStats] = useState<DateStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const router = useRouter();

  // Fetch words with enhanced date filtering
  const fetchWords = async (page = 1, search = '') => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) {
        params.append('search', search);
      }

      if (selectedDate !== 'all') {
        params.append('date', selectedDate);

        // If specific date is selected, add the date
        if (selectedDate === 'specific' && specificDate) {
          params.append('specificDate', specificDate);
        }
      }

      const response = await fetch(`/api/words/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setWords(data.data.words);
      setPagination(data.data.pagination);

      // Update date statistics
      if (data.data.dateStats) {
        setDateStats(data.data.dateStats);
      }
    } catch (error: any) {
      console.error('Error fetching words:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải từ vựng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchWords(1, searchQuery);
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await fetchWords(newPage, searchQuery);
  };

  const handleDateFilterChange = (value: string) => {
    setSelectedDate(value);
    setCurrentPage(1);

    // Reset specific date if not needed
    if (value !== 'specific') {
      setSpecificDate('');
    }
  };

  const handleSpecificDateChange = (value: string) => {
    setSpecificDate(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedDate('all');
    setSpecificDate('');
    setSearchQuery('');
    setCurrentPage(1);
    fetchWords(1, '');
  };

  const playAudio = (audioUrl: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Get today's date for input max
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    fetchWords(currentPage, searchQuery);
  }, [currentPage, selectedDate, specificDate]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Floating Image */}
        <div className="fixed bottom-4 right-4 z-10">
          <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-white animate-bounce hover:scale-110 transition-transform cursor-pointer">
            <Image
              src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1748938841/%C3%81nh_D%C6%B0%C6%A1ng_s_facebook_2023-4-17_story_1_nm0n4s.jpg"
              alt="Avatar"
              width={48}
              height={48}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        <div className="container mx-auto p-3 max-w-7xl">
          {/* Header với Date Statistics */}
          <div className="mb-4">
            <Button variant="ghost" onClick={() => router.back()} className="mb-3" size="sm">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Quay lại
            </Button>

            {/* Date Statistics Cards */}
            {dateStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-blue-600">{dateStats.today}</div>
                    <div className="text-xs text-blue-700">Hôm nay</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-green-600">{dateStats.week}</div>
                    <div className="text-xs text-green-700">Tuần này</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-purple-600">{dateStats.month}</div>
                    <div className="text-xs text-purple-700">Tháng này</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-indigo-600">{dateStats.total}</div>
                    <div className="text-xs text-indigo-700">Tổng cộng</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Search & Controls */}
            <Card className="shadow-sm">
              <CardContent className="p-3 space-y-2">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm từ..."
                    className="h-8 text-sm"
                  />
                  <Button type="submit" disabled={loading} size="sm" className="h-8 px-3">
                    <Search className="h-3 w-3" />
                  </Button>
                </form>

                {/* Enhanced Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Date Filter */}
                  <Select value={selectedDate} onValueChange={handleDateFilterChange}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thời gian</SelectItem>
                      <SelectItem value="today">Hôm nay</SelectItem>
                      <SelectItem value="week">Tuần này</SelectItem>
                      <SelectItem value="month">Tháng này</SelectItem>
                      <SelectItem value="specific">Ngày cụ thể</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Specific Date Input */}
                  {selectedDate === 'specific' && (
                    <Input
                      type="date"
                      value={specificDate}
                      onChange={e => handleSpecificDateChange(e.target.value)}
                      max={getTodayString()}
                      className="h-8 w-36 text-xs"
                    />
                  )}

                  {/* Clear Filters */}
                  <Button variant="outline" onClick={clearFilters} size="sm" className="h-8 px-2">
                    <Filter className="h-3 w-3 mr-1" />
                    <span className="text-xs">Xóa</span>
                  </Button>

                  {/* Current Filter Display */}
                  {selectedDate !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedDate === 'today' && 'Hôm nay'}
                      {selectedDate === 'week' && 'Tuần này'}
                      {selectedDate === 'month' && 'Tháng này'}
                      {selectedDate === 'specific' &&
                        specificDate &&
                        `Ngày ${formatDate(specificDate)}`}
                    </Badge>
                  )}
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      onClick={() => setViewMode('grid')}
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      <Grid3X3 className="mr-1 h-3 w-3" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'study' ? 'default' : 'outline'}
                      onClick={() => setViewMode('study')}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={words.length === 0}
                    >
                      <Target className="mr-1 h-3 w-3" />
                      Study
                    </Button>
                    <Button
                      variant={viewMode === 'flashcard' ? 'default' : 'outline'}
                      onClick={() => {
                        setViewMode('flashcard');
                        resetFlashcards();
                      }}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={words.length === 0}
                    >
                      <CreditCard className="mr-1 h-3 w-3" />
                      Card
                    </Button>
                  </div>
                  <Badge variant="secondary" className="text-xs h-6">
                    {pagination.total} từ
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-xs">Đang tải...</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          ) : words.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm mb-2">
                  Không có từ vựng nào
                  {selectedDate !== 'all' && (
                    <span className="block text-xs mt-1">trong khoảng thời gian được chọn</span>
                  )}
                </p>
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {words.map(word => (
                      <Card key={word._id} className="hover:shadow-md transition-shadow border">
                        <CardContent className="p-3">
                          {/* Header Row */}
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-blue-600 text-base leading-tight">
                              {word.word}
                            </h3>
                            <div className="flex flex-col items-end gap-1">
                              {word.level && (
                                <Badge variant="secondary" className="text-xs h-5 px-1">
                                  {word.level}
                                </Badge>
                              )}
                              {word.frequency && (
                                <Badge variant="outline" className="text-xs h-5 px-1">
                                  {word.frequency.split(' ')[0]}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Pronunciation */}
                          <div className="mb-2">
                            {word.pronunciation.uk && (
                              <div className="text-xs text-gray-600">
                                UK: /{word.pronunciation.uk}/
                              </div>
                            )}
                            {word.pronunciation.us &&
                              word.pronunciation.us !== word.pronunciation.uk && (
                                <div className="text-xs text-gray-600">
                                  US: /{word.pronunciation.us}/
                                </div>
                              )}
                          </div>

                          {/* Vietnamese Translation */}
                          <div className="text-green-600 font-medium mb-2 text-sm leading-tight">
                            {word.vietnamese}
                          </div>

                          {/* Meanings */}
                          <div className="space-y-2 mb-3">
                            {word.meanings.slice(0, 2).map((meaning, idx) => (
                              <div key={idx} className="border-l-2 border-gray-200 pl-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <Badge variant="outline" className="text-xs h-4 px-1">
                                    {meaning.partOfSpeech}
                                  </Badge>
                                  <span className="text-xs text-gray-500">#{idx + 1}</span>
                                </div>
                                <p className="text-xs text-gray-700 leading-snug mb-1">
                                  {meaning.definition}
                                </p>
                                {meaning.vietnamese && (
                                  <p className="text-xs text-green-600 italic mb-1">
                                    → {meaning.vietnamese}
                                  </p>
                                )}
                                {meaning.examples[0] && (
                                  <p className="text-xs text-gray-500 italic leading-snug">
                                    "{meaning.examples[0]}"
                                  </p>
                                )}
                              </div>
                            ))}
                            {word.meanings.length > 2 && (
                              <p className="text-xs text-gray-400 italic">
                                +{word.meanings.length - 2} nghĩa khác...
                              </p>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            {/* Audio Buttons */}
                            <div className="flex gap-1">
                              {word.audio.uk && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => playAudio(word.audio.uk)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Volume2 className="h-2 w-2 mr-1" />
                                  UK
                                </Button>
                              )}
                              {word.audio.us && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => playAudio(word.audio.us)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Volume2 className="h-2 w-2 mr-1" />
                                  US
                                </Button>
                              )}
                            </div>

                            {/* Created Date - Enhanced */}
                            <span className="text-xs text-gray-400">
                              {formatDate(word.createdAt)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <Card>
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Trang {pagination.page}/{pagination.pages} - {pagination.total} từ
                            {selectedDate !== 'all' && (
                              <span className="text-blue-600 ml-1">(đã lọc)</span>
                            )}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="h-7 px-2"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === pagination.pages}
                              className="h-7 px-2"
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

              {/* Study Mode - Simple list with tooltip */}
              {viewMode === 'study' && (
                <div className="space-y-3">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-sm text-blue-700">
                        <Target className="h-4 w-4 inline mr-1" />
                        Chế độ học tập: Hover qua từ để xem chi tiết
                        {selectedDate !== 'all' && (
                          <span className="block text-xs mt-1 text-blue-600">
                            Đang hiển thị từ vựng đã lọc theo thời gian
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                    {words.map(word => (
                      <Tooltip key={word._id} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-blue-300">
                            <CardContent className="p-3 text-center">
                              <h3 className="font-bold text-blue-600 text-lg mb-1">{word.word}</h3>
                              <p className="text-green-600 text-sm font-medium">
                                {word.vietnamese}
                              </p>
                              <div className="flex flex-wrap justify-center gap-1 mt-2">
                                {word.level && (
                                  <Badge variant="secondary" className="text-xs">
                                    {word.level}
                                  </Badge>
                                )}
                                {/* Removed date badge */}
                              </div>
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-sm p-4 bg-white border shadow-lg"
                          sideOffset={10}
                        >
                          <div className="space-y-2">
                            <div className="border-b pb-2">
                              <h4 className="font-bold text-blue-600 text-lg">{word.word}</h4>
                              {word.pronunciation.uk && (
                                <p className="text-sm text-gray-600">/{word.pronunciation.uk}/</p>
                              )}
                              <p className="text-green-600 font-medium">{word.vietnamese}</p>
                              {/* Removed date info from tooltip */}
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {word.meanings.slice(0, 2).map((meaning, idx) => (
                                <div key={idx} className="border-l-2 border-blue-200 pl-2">
                                  <Badge variant="outline" className="text-xs mb-1">
                                    {meaning.partOfSpeech}
                                  </Badge>
                                  <p className="text-sm text-gray-700 mb-1">{meaning.definition}</p>
                                  {meaning.vietnamese && (
                                    <p className="text-sm text-green-600 italic mb-1">
                                      → {meaning.vietnamese}
                                    </p>
                                  )}
                                  {meaning.examples[0] && (
                                    <p className="text-xs text-gray-500 italic">
                                      "{meaning.examples[0]}"
                                    </p>
                                  )}
                                </div>
                              ))}
                              {word.meanings.length > 2 && (
                                <p className="text-xs text-gray-400 italic">
                                  +{word.meanings.length - 2} nghĩa khác...
                                </p>
                              )}
                            </div>

                            {/* Audio in tooltip */}
                            <div className="flex gap-1 pt-2 border-t">
                              {word.audio.uk && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation();
                                    playAudio(word.audio.uk);
                                  }}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Volume2 className="h-2 w-2 mr-1" />
                                  UK
                                </Button>
                              )}
                              {word.audio.us && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => {
                                    e.stopPropagation();
                                    playAudio(word.audio.us);
                                  }}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Volume2 className="h-2 w-2 mr-1" />
                                  US
                                </Button>
                              )}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>

                  {/* Study Mode Pagination */}
                  {pagination.pages > 1 && (
                    <Card>
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Trang {pagination.page}/{pagination.pages} - {pagination.total} từ
                            {selectedDate !== 'all' && (
                              <span className="text-blue-600 ml-1">(đã lọc)</span>
                            )}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="h-7 px-2"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === pagination.pages}
                              className="h-7 px-2"
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
                <div className="space-y-3 max-w-2xl mx-auto">
                  {/* Controls */}
                  <Card>
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {currentCardIndex + 1}/{words.length}
                          {selectedDate !== 'all' && (
                            <span className="text-blue-600 ml-1">(đã lọc)</span>
                          )}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFlashcards}
                            className="h-7 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={flipCard}
                            className="h-7 px-2"
                          >
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
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={flipCard}
                  >
                    <CardContent className="p-4 text-center min-h-[250px] flex flex-col justify-center">
                      {!showAnswer ? (
                        // Front - Word
                        <div className="space-y-3">
                          <h2 className="text-2xl font-bold text-blue-600">
                            {words[currentCardIndex].word}
                          </h2>

                          {words[currentCardIndex].pronunciation.uk && (
                            <div className="text-sm text-gray-600">
                              /{words[currentCardIndex].pronunciation.uk}/
                            </div>
                          )}

                          <div className="flex justify-center gap-1 flex-wrap">
                            {words[currentCardIndex].level && (
                              <Badge variant="secondary" className="text-xs">
                                {words[currentCardIndex].level}
                              </Badge>
                            )}
                            {words[currentCardIndex].frequency && (
                              <Badge variant="outline" className="text-xs">
                                {words[currentCardIndex].frequency.split(' ')[0]}
                              </Badge>
                            )}
                            {/* Removed date badge */}
                          </div>

                          {/* Audio */}
                          <div className="flex justify-center gap-1">
                            {words[currentCardIndex].audio.uk && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  playAudio(words[currentCardIndex].audio.uk);
                                }}
                                className="h-7 px-2 text-xs"
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
                                className="h-7 px-2 text-xs"
                              >
                                <Volume2 className="mr-1 h-3 w-3" />
                                US
                              </Button>
                            )}
                          </div>

                          <p className="text-gray-500 text-xs">Nhấn để xem nghĩa</p>
                        </div>
                      ) : (
                        // Back - Meaning
                        <div className="space-y-3">
                          <h2 className="text-xl font-bold text-green-600">
                            {words[currentCardIndex].vietnamese}
                          </h2>

                          <div className="space-y-2 text-left max-w-md mx-auto">
                            {words[currentCardIndex].meanings.slice(0, 2).map((meaning, idx) => (
                              <div key={idx} className="border-l-2 border-green-200 pl-2">
                                <Badge variant="outline" className="text-xs mb-1">
                                  {meaning.partOfSpeech}
                                </Badge>
                                <p className="text-xs text-gray-700 mb-1">{meaning.definition}</p>
                                {meaning.vietnamese && (
                                  <p className="text-xs text-green-600 italic mb-1">
                                    → {meaning.vietnamese}
                                  </p>
                                )}
                                {meaning.examples[0] && (
                                  <p className="text-xs text-gray-600 italic">
                                    "{meaning.examples[0]}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          <p className="text-gray-500 text-xs">Nhấn để xem từ</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Navigation */}
                  <Card>
                    <CardContent className="p-2">
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevCard}
                          disabled={words.length <= 1}
                          className="h-7 px-3"
                        >
                          <ChevronLeft className="mr-1 h-3 w-3" />
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextCard}
                          disabled={words.length <= 1}
                          className="h-7 px-3"
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
    </TooltipProvider>
  );
}
