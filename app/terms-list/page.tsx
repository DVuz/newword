'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Filter,
  Calendar,
  Code2,
  Eye,
  EyeOff,
  RotateCcw,
  TrendingUp,
  Database,
  BookOpen,
} from 'lucide-react';

interface ProgrammingTerm {
  _id: string;
  word: string;
  phonetic: string;
  audio_url: string;
  part_of_speech: string;
  definition_en: string;
  definition_vi: string;
  example: string;
  category: string;
  difficulty: string;
  createdAt: string;
  updatedAt?: string;
}

interface TermsResponse {
  terms: ProgrammingTerm[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface TermsStatistics {
  totalTerms: number;
  todayTerms: number;
  weekTerms: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
}

export default function TermsList() {
  const [viewMode, setViewMode] = useState<'grid' | 'flashcard'>('grid');
  const [terms, setTerms] = useState<ProgrammingTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [statistics, setStatistics] = useState<TermsStatistics | null>(null);

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const router = useRouter();

  // Fetch terms with filters
  const fetchTerms = async (page = 1, filters: any = {}) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.difficulty && filters.difficulty !== 'all') params.append('difficulty', filters.difficulty);

      const response = await fetch(`/api/programming-terms?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      let filteredTerms = data.data.terms;

      // Client-side date filtering
      if (filters.date) {
        const filterDate = new Date(filters.date);
        filterDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        filteredTerms = filteredTerms.filter((term: ProgrammingTerm) => {
          const termDate = new Date(term.createdAt);
          return termDate >= filterDate && termDate < nextDay;
        });
      }

      setTerms(filteredTerms);
      setPagination(data.data.pagination);
    } catch (error: any) {
      console.error('Error fetching terms:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải programming terms');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/programming-terms/statistics');
      const data = await response.json();

      if (response.ok) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchTerms(1, {
      search: searchQuery,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      date: dateFilter,
    });
  };

  // Handle filters
  const handleFilterChange = async () => {
    setCurrentPage(1);
    await fetchTerms(1, {
      search: searchQuery,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      date: dateFilter,
    });
  };

  // Clear all filters
  const clearFilters = async () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setDateFilter('');
    setCurrentPage(1);
    await fetchTerms(1, {});
  };

  // Handle pagination
  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await fetchTerms(newPage, {
      search: searchQuery,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      date: dateFilter,
    });
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
    setCurrentCardIndex(prev => (prev + 1) % terms.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex(prev => (prev - 1 + terms.length) % terms.length);
  };

  const flipCard = () => {
    setShowAnswer(!showAnswer);
  };

  const resetFlashcards = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  // Effects
  useEffect(() => {
    fetchTerms();
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (selectedCategory !== 'all' || selectedDifficulty !== 'all' || dateFilter) {
      handleFilterChange();
    }
  }, [selectedCategory, selectedDifficulty, dateFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50">
      {/* Floating Avatar */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-white backdrop-blur-sm bg-white/10 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <Image
            src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1749281277/photo-1462258409682-731445253757_d9mxww.jpg"
            alt="Avatar"
            width={48}
            height={48}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-white/80 backdrop-blur-sm border border-white/20 shadow-md transition-all duration-300"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Code2 className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Programming Terms Library
                </h1>
                <Database className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="w-24"></div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalTerms}</div>
                  <div className="text-sm text-blue-700">Tổng Terms</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.todayTerms}</div>
                  <div className="text-sm text-green-700">Hôm nay</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{statistics.weekTerms}</div>
                  <div className="text-sm text-purple-700">Tuần này</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.keys(statistics.byCategory).length}
                  </div>
                  <div className="text-sm text-orange-700">Categories</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search & Filters */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
            <CardContent className="p-4 space-y-4">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm programming terms..."
                  className="h-10 border-2 border-purple-200 focus:border-purple-400"
                />
                <Button type="submit" disabled={loading} className="h-10 px-4">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Filters Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 border-2 border-purple-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {statistics &&
                      Object.keys(statistics.byCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category} ({statistics.byCategory[category]})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Difficulty Filter */}
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="h-10 border-2 border-purple-200">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả độ khó</SelectItem>
                    {statistics &&
                      Object.keys(statistics.byDifficulty).map(difficulty => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty} ({statistics.byDifficulty[difficulty]})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="h-10 border-2 border-purple-200 focus:border-purple-400"
                />

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-10 border-2 border-gray-200 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Xóa lọc
                </Button>
              </div>

              {/* View Mode & Stats */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => setViewMode('grid')}
                    size="sm"
                    className="h-8"
                  >
                    <Grid3X3 className="mr-2 h-4 w-4" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'flashcard' ? 'default' : 'outline'}
                    onClick={() => {
                      setViewMode('flashcard');
                      resetFlashcards();
                    }}
                    size="sm"
                    className="h-8"
                    disabled={terms.length === 0}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Flashcard
                  </Button>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {pagination.total} programming terms
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {loading ? (
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải programming terms...</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant="destructive" className="shadow-lg">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : terms.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <Code2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Không có programming terms nào</p>
              <p className="text-gray-400 text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {terms.map(term => (
                    <Card
                      key={term._id}
                      className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
                    >
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-purple-600 text-lg leading-tight">
                            {term.word}
                          </h3>
                          <div className="flex flex-col items-end gap-1">
                            {term.difficulty && (
                              <Badge
                                variant="secondary"
                                className={`text-xs h-5 px-2 ${
                                  term.difficulty.toLowerCase() === 'easy'
                                    ? 'bg-green-100 text-green-700'
                                    : term.difficulty.toLowerCase() === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {term.difficulty}
                              </Badge>
                            )}
                            {term.category && (
                              <Badge
                                variant="outline"
                                className="text-xs h-5 px-2 border-purple-200"
                              >
                                {term.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Pronunciation & Audio */}
                        <div className="mb-3">
                          {term.phonetic && (
                            <div className="text-sm text-gray-600 mb-2">/{term.phonetic}/</div>
                          )}
                          {term.audio_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => playAudio(term.audio_url)}
                              className="h-6 px-2 text-xs border-purple-200 hover:bg-purple-50"
                            >
                              <Volume2 className="h-3 w-3 mr-1" />
                              Play
                            </Button>
                          )}
                        </div>

                        {/* Part of Speech */}
                        {term.part_of_speech && (
                          <Badge
                            variant="outline"
                            className="text-xs mb-3 border-blue-200 text-blue-700"
                          >
                            {term.part_of_speech}
                          </Badge>
                        )}

                        {/* Vietnamese Translation */}
                        <div className="text-green-600 font-medium mb-3 text-sm leading-tight">
                          {term.definition_vi}
                        </div>

                        {/* English Definition */}
                        <div className="text-gray-700 text-sm mb-3 leading-snug">
                          {term.definition_en}
                        </div>

                        {/* Example */}
                        {term.example && (
                          <div className="bg-blue-50/80 p-2 rounded border-l-2 border-blue-200 mb-3">
                            <p className="text-xs text-gray-600 italic leading-snug">
                              "{term.example}"
                            </p>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            {new Date(term.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          <BookOpen className="h-3 w-3 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Trang {pagination.page}/{pagination.pages} - {pagination.total} terms
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.pages}
                            className="h-8"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Flashcard View */}
            {viewMode === 'flashcard' && terms.length > 0 && (
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Controls */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {currentCardIndex + 1}/{terms.length}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFlashcards}
                          className="h-8 px-3"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={flipCard} className="h-8 px-3">
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
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 shadow-lg border-0 bg-white/80 backdrop-blur-sm"
                  onClick={flipCard}
                >
                  <CardContent className="p-8 text-center min-h-[300px] flex flex-col justify-center">
                    {!showAnswer ? (
                      // Front - Programming Term
                      <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-purple-600">
                          {terms[currentCardIndex].word}
                        </h2>

                        {terms[currentCardIndex].phonetic && (
                          <div className="text-lg text-gray-600">
                            /{terms[currentCardIndex].phonetic}/
                          </div>
                        )}

                        <div className="flex justify-center gap-2 flex-wrap">
                          {terms[currentCardIndex].part_of_speech && (
                            <Badge
                              variant="outline"
                              className="text-sm border-blue-200 text-blue-700"
                            >
                              {terms[currentCardIndex].part_of_speech}
                            </Badge>
                          )}
                          {terms[currentCardIndex].difficulty && (
                            <Badge
                              variant="secondary"
                              className={`text-sm ${
                                terms[currentCardIndex].difficulty.toLowerCase() === 'easy'
                                  ? 'bg-green-100 text-green-700'
                                  : terms[currentCardIndex].difficulty.toLowerCase() === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {terms[currentCardIndex].difficulty}
                            </Badge>
                          )}
                          {terms[currentCardIndex].category && (
                            <Badge
                              variant="outline"
                              className="text-sm border-purple-200 text-purple-700"
                            >
                              {terms[currentCardIndex].category}
                            </Badge>
                          )}
                        </div>

                        {/* Audio */}
                        {terms[currentCardIndex].audio_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              playAudio(terms[currentCardIndex].audio_url);
                            }}
                            className="h-10 px-4 border-purple-200 hover:bg-purple-50"
                          >
                            <Volume2 className="mr-2 h-4 w-4" />
                            Nghe phát âm
                          </Button>
                        )}

                        <p className="text-gray-500">Nhấn để xem định nghĩa</p>
                      </div>
                    ) : (
                      // Back - Definition
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-green-600">
                          {terms[currentCardIndex].definition_vi}
                        </h2>

                        <div className="text-gray-700 text-lg leading-relaxed max-w-lg mx-auto">
                          {terms[currentCardIndex].definition_en}
                        </div>

                        {terms[currentCardIndex].example && (
                          <div className="bg-blue-50/80 p-4 rounded-lg border-l-4 border-blue-300 max-w-lg mx-auto">
                            <p className="text-sm text-gray-700 italic leading-relaxed">
                              "{terms[currentCardIndex].example}"
                            </p>
                          </div>
                        )}

                        <p className="text-gray-500">Nhấn để xem từ</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevCard}
                        disabled={terms.length <= 1}
                        className="h-10 px-4"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextCard}
                        disabled={terms.length <= 1}
                        className="h-10 px-4"
                      >
                        Sau
                        <ChevronRight className="ml-2 h-4 w-4" />
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
