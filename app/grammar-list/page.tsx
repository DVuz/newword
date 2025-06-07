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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ArrowLeft,
  Search,
  GraduationCap,
  Loader2,
  List,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Filter,
  Volume2,
  Eye,
  EyeOff,
  Hash,
  Link,
  Calendar,
  Clock,
  Target,
  FileText,
  MessageSquare,
  Lightbulb,
  Users,
} from 'lucide-react';

interface GrammarStructure {
  _id: string;
  id: string;
  name: string;
  type: string;
  description: string;
  structure: string;
  usage: string[];
  examples: Array<{
    sentence: string;
    meaning: string;
    highlight?: string;
  }>;
  relatedStructures?: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  comparisonTable?: Array<{
    aspect: string;
    structure1: string;
    structure2: string;
  }>;
  isComparison?: boolean;
}

interface GrammarStatistics {
  totalStructures: number;
  todayStructures: number;
  weekStructures: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function GrammarList() {
  const [grammars, setGrammars] = useState<GrammarStructure[]>([]);
  const [statistics, setStatistics] = useState<GrammarStatistics | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'flashcard'>('list');

  // List view states
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showAllUsage, setShowAllUsage] = useState<Set<string>>(new Set());
  const [showAllExamples, setShowAllExamples] = useState<Set<string>>(new Set());
  const [showAllTags, setShowAllTags] = useState<Set<string>>(new Set());
  const [studyMode, setStudyMode] = useState(false);

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchGrammars();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchGrammars(currentPage);
  }, [currentPage, selectedType, selectedLevel]);

  // Fetch grammar structures
  const fetchGrammars = async (page = 1, search = '') => {
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
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      if (selectedLevel !== 'all') {
        params.append('level', selectedLevel);
      }

      const response = await fetch(`/api/grammar-structures?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      let filteredGrammars = data.data.structures;

      // Client-side filtering if needed
      if (selectedType !== 'all') {
        filteredGrammars = filteredGrammars.filter(
          (grammar: GrammarStructure) => grammar.type === selectedType
        );
      }

      if (selectedLevel !== 'all') {
        filteredGrammars = filteredGrammars.filter(
          (grammar: GrammarStructure) => grammar.level === selectedLevel
        );
      }

      setGrammars(filteredGrammars);
      setPagination(data.data.pagination);
    } catch (error: any) {
      console.error('Error fetching grammars:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải grammar structures');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/grammar-structures/statistics');
      const data = await response.json();

      if (response.ok) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchGrammars(1, searchQuery);
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await fetchGrammars(newPage, searchQuery);
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedLevel('all');
    setSearchQuery('');
    setCurrentPage(1);
    fetchGrammars(1, '');
  };

  // Toggle functions for list view
  const toggleCardExpanded = (cardId: string) => {
    const newSet = new Set(expandedCards);
    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }
    setExpandedCards(newSet);
  };

  const toggleShowAllUsage = (cardId: string) => {
    const newSet = new Set(showAllUsage);
    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }
    setShowAllUsage(newSet);
  };

  const toggleShowAllExamples = (cardId: string) => {
    const newSet = new Set(showAllExamples);
    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }
    setShowAllExamples(newSet);
  };

  const toggleShowAllTags = (cardId: string) => {
    const newSet = new Set(showAllTags);
    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }
    setShowAllTags(newSet);
  };

  // Study mode functions
  const toggleStudyMode = () => {
    setStudyMode(!studyMode);
    if (!studyMode) {
      // Collapse all when entering study mode
      setExpandedCards(new Set());
      setShowAllUsage(new Set());
      setShowAllExamples(new Set());
      setShowAllTags(new Set());
    }
  };

  const expandAll = () => {
    const allIds = new Set(grammars.map(g => g._id));
    setExpandedCards(allIds);
    setShowAllUsage(allIds);
    setShowAllExamples(allIds);
    setShowAllTags(allIds);
  };

  const collapseAll = () => {
    setExpandedCards(new Set());
    setShowAllUsage(new Set());
    setShowAllExamples(new Set());
    setShowAllTags(new Set());
  };

  // Flashcard functions
  const resetFlashcards = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    setCurrentCardIndex(prev => (prev + 1) % grammars.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentCardIndex(prev => (prev - 1 + grammars.length) % grammars.length);
    setIsFlipped(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      causative: 'bg-blue-100 text-blue-800 border-blue-300',
      conditional: 'bg-purple-100 text-purple-800 border-purple-300',
      modal: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      tense: 'bg-green-100 text-green-800 border-green-300',
      comparison: 'bg-orange-100 text-orange-800 border-orange-300',
      general: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Thêm function mới để clean markdown
  const cleanMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bỏ **bold**
      .replace(/\*(.*?)\*/g, '$1') // Bỏ *italic*
      .replace(/`(.*?)`/g, '$1') // Bỏ `code`
      .replace(/_{2}(.*?)_{2}/g, '$1') // Bỏ __underline__
      .trim();
  };

  // Cập nhật function highlightText
  const highlightText = (text: string, highlight?: string) => {
    if (!text) return '';

    // Clean markdown trước
    const cleanedText = cleanMarkdown(text);

    // Highlight nếu có
    if (!highlight) {
      return cleanedText;
    }

    // Escape special regex characters và tạo highlight
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = cleanedText.split(new RegExp(`(${escapedHighlight})`, 'gi'));

    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="font-bold text-indigo-600 bg-indigo-100 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-200 rounded-full blur-2xl"></div>
        <div className="absolute top-32 right-16 w-24 h-24 bg-purple-200 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-pink-200 rounded-full blur-2xl"></div>
      </div>

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

      <div className="container mx-auto p-4 max-w-7xl min-h-screen relative z-10">
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
              <span className="hidden sm:inline">Quay lại</span>
            </Button>

            <div className="text-center flex-1 px-4">
              <div className="flex items-center justify-center gap-2">
                <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Grammar Library
                </h1>
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-pink-500 animate-pulse" />
              </div>
            </div>

            <div className="w-16 sm:w-24"></div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {statistics.totalStructures}
                  </div>
                  <div className="text-sm text-indigo-700">Tổng Grammar</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.todayStructures}
                  </div>
                  <div className="text-sm text-green-700">Hôm nay</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics.weekStructures}
                  </div>
                  <div className="text-sm text-purple-700">Tuần này</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {Object.values(statistics.byLevel).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-sm text-pink-700">Tất cả Level</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search & Filters */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
            <CardContent className="p-4 space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm grammar structures..."
                  className="h-10 border-2 border-indigo-200 focus:border-indigo-400"
                />
                <Button type="submit" disabled={loading} className="h-10 px-4">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Filters Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Type Filter */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-10 border-2 border-indigo-200">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    {statistics &&
                      Object.keys(statistics.byType).map(type => (
                        <SelectItem key={type} value={type}>
                          {type} ({statistics.byType[type]})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Level Filter */}
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="h-10 border-2 border-indigo-200">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả level</SelectItem>
                    {statistics &&
                      Object.keys(statistics.byLevel).map(level => (
                        <SelectItem key={level} value={level}>
                          {level} ({statistics.byLevel[level]})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-10 border-2 border-gray-200 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Xóa lọc</span>
                </Button>

                {/* View Mode */}
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => setViewMode('list')}
                    size="sm"
                    className="h-10 flex-1"
                  >
                    <List className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                  <Button
                    variant={viewMode === 'flashcard' ? 'default' : 'outline'}
                    onClick={() => {
                      setViewMode('flashcard');
                      resetFlashcards();
                    }}
                    size="sm"
                    className="h-10 flex-1"
                    disabled={grammars.length === 0}
                  >
                    <CreditCard className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Card</span>
                  </Button>
                </div>

                {/* Study Controls */}
                {viewMode === 'list' && (
                  <div className="flex gap-1">
                    <Button
                      variant={studyMode ? 'default' : 'outline'}
                      onClick={toggleStudyMode}
                      size="sm"
                      className="h-10 flex-1"
                    >
                      <Target className="mr-1 h-4 w-4" />
                      <span className="hidden sm:inline">Study</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Study Mode Controls */}
              {viewMode === 'list' && studyMode && (
                <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Button variant="outline" size="sm" onClick={expandAll} className="h-8">
                    <Eye className="mr-1 h-3 w-3" />
                    Mở tất cả
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll} className="h-8">
                    <EyeOff className="mr-1 h-3 w-3" />
                    Đóng tất cả
                  </Button>
                  <div className="flex items-center text-sm text-blue-700 ml-auto">
                    <Lightbulb className="mr-1 h-4 w-4" />
                    Chế độ học tập: Click để xem chi tiết
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-sm">
                  {pagination.total} grammar structures
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
              <span>Đang tải grammar structures...</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant="destructive" className="shadow-lg">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : grammars.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <GraduationCap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Không có grammar structures nào</p>
              <p className="text-gray-400 text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {grammars.map(grammar => {
                  const isExpanded = expandedCards.has(grammar._id);
                  const showAllUsageItems = showAllUsage.has(grammar._id);
                  const showAllExampleItems = showAllExamples.has(grammar._id);
                  const showAllTagItems = showAllTags.has(grammar._id);

                  return (
                    <Card
                      key={grammar._id}
                      className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        {/* Header with Toggle */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1 mr-4">
                                {grammar.name}
                              </h3>
                              {studyMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCardExpanded(grammar._id)}
                                  className="ml-2"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge
                                className={`${getTypeColor(grammar.type)} border`}
                                variant="secondary"
                              >
                                {grammar.type}
                              </Badge>
                              <Badge
                                className={`${getLevelColor(grammar.level)} border`}
                                variant="secondary"
                              >
                                {grammar.level}
                              </Badge>
                              {grammar.isComparison && (
                                <Badge
                                  className="bg-orange-100 text-orange-800 border border-orange-300"
                                  variant="secondary"
                                >
                                  Comparison
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Structure Formula - Always visible */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-l-4 border-indigo-400">
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 text-indigo-600 mr-2" />
                            <span className="text-sm font-semibold text-indigo-800">Cấu trúc:</span>
                          </div>
                          <p className="text-lg font-mono text-indigo-800 font-semibold leading-relaxed">
                            {grammar.structure}
                          </p>
                        </div>

                        {/* Collapsible Content */}
                        <Collapsible open={!studyMode || isExpanded}>
                          <CollapsibleContent>
                            <div className="space-y-6">
                              {/* Description */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center mb-3">
                                  <MessageSquare className="h-4 w-4 text-gray-600 mr-2" />
                                  <span className="text-sm font-semibold text-gray-800">
                                    Mô tả:
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed">
                                  {grammar.description}
                                </p>
                              </div>

                              {/* Usage Points - Show ALL */}
                              {grammar.usage.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                      <Target className="h-4 w-4 text-green-600 mr-2" />
                                      <span className="text-sm font-semibold text-green-800">
                                        Cách sử dụng ({grammar.usage.length}):
                                      </span>
                                    </div>
                                    {grammar.usage.length > 3 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleShowAllUsage(grammar._id)}
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        {showAllUsageItems
                                          ? 'Thu gọn'
                                          : `Xem thêm ${grammar.usage.length - 3}`}
                                        {showAllUsageItems ? (
                                          <ChevronUp className="ml-1 h-3 w-3" />
                                        ) : (
                                          <ChevronDown className="ml-1 h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  <ul className="space-y-2">
                                    {(showAllUsageItems
                                      ? grammar.usage
                                      : grammar.usage.slice(0, 3)
                                    ).map((usage, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-green-700 flex items-start"
                                      >
                                        <span className="text-green-500 mr-2 mt-1">●</span>
                                        <span className="leading-relaxed">{usage}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Examples - Show ALL */}
                              {grammar.examples.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                      <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                                      <span className="text-sm font-semibold text-blue-800">
                                        Ví dụ ({grammar.examples.length}):
                                      </span>
                                    </div>
                                    {grammar.examples.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleShowAllExamples(grammar._id)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        {showAllExampleItems
                                          ? 'Thu gọn'
                                          : `Xem thêm ${grammar.examples.length - 2}`}
                                        {showAllExampleItems ? (
                                          <ChevronUp className="ml-1 h-3 w-3" />
                                        ) : (
                                          <ChevronDown className="ml-1 h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    {(showAllExampleItems
                                      ? grammar.examples
                                      : grammar.examples.slice(0, 2)
                                    ).map((example, idx) => (
                                      <div
                                        key={idx}
                                        className="border-l-4 border-blue-300 pl-4 bg-white/70 p-3 rounded-r-lg"
                                      >
                                        <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                                          <span className="font-medium text-blue-700">
                                            #{idx + 1}:
                                          </span>{' '}
                                          {highlightText(example.sentence, example.highlight)}
                                        </p>
                                        <p className="text-sm text-blue-600 italic">
                                          → {example.meaning}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Comparison Table - If exists */}
                              {grammar.comparisonTable && grammar.comparisonTable.length > 0 && (
                                <div className="bg-orange-50 p-4 rounded-lg">
                                  <div className="flex items-center mb-3">
                                    <Users className="h-4 w-4 text-orange-600 mr-2" />
                                    <span className="text-sm font-semibold text-orange-800">
                                      Bảng so sánh:
                                    </span>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                      <thead>
                                        <tr className="bg-orange-100">
                                          <th className="border border-orange-300 p-2 text-left text-orange-800 font-semibold">
                                            Khía cạnh
                                          </th>
                                          <th className="border border-orange-300 p-2 text-left text-orange-800 font-semibold">
                                            Cấu trúc 1
                                          </th>
                                          <th className="border border-orange-300 p-2 text-left text-orange-800 font-semibold">
                                            Cấu trúc 2
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {grammar.comparisonTable.map((row, idx) => (
                                          <tr key={idx} className="bg-white/70">
                                            <td className="border border-orange-300 p-2 font-medium text-orange-700">
                                              {row.aspect}
                                            </td>
                                            <td className="border border-orange-300 p-2 text-gray-700">
                                              {row.structure1}
                                            </td>
                                            <td className="border border-orange-300 p-2 text-gray-700">
                                              {row.structure2}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Related Structures */}
                              {grammar.relatedStructures &&
                                grammar.relatedStructures.length > 0 && (
                                  <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-3">
                                      <Link className="h-4 w-4 text-purple-600 mr-2" />
                                      <span className="text-sm font-semibold text-purple-800">
                                        Cấu trúc liên quan:
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {grammar.relatedStructures.map((related, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="text-purple-700 border-purple-300 bg-white/70"
                                        >
                                          {related}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Tags - Show ALL */}
                              {grammar.tags.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                      <Hash className="h-4 w-4 text-gray-600 mr-2" />
                                      <span className="text-sm font-semibold text-gray-800">
                                        Tags ({grammar.tags.length}):
                                      </span>
                                    </div>
                                    {grammar.tags.length > 5 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleShowAllTags(grammar._id)}
                                        className="text-gray-600 hover:text-gray-800"
                                      >
                                        {showAllTagItems
                                          ? 'Thu gọn'
                                          : `Xem thêm ${grammar.tags.length - 5}`}
                                        {showAllTagItems ? (
                                          <ChevronUp className="ml-1 h-3 w-3" />
                                        ) : (
                                          <ChevronDown className="ml-1 h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(showAllTagItems
                                      ? grammar.tags
                                      : grammar.tags.slice(0, 5)
                                    ).map((tag, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-gray-700 border-gray-300 bg-white/70"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Timestamps */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Tạo: {formatDate(grammar.createdAt)}
                                </div>
                                {grammar.updatedAt && (
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Cập nhật: {formatDate(grammar.updatedAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Study Mode Trigger */}
                        {studyMode && !isExpanded && (
                          <div className="mt-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCardExpanded(grammar._id)}
                              className="text-indigo-600 hover:text-indigo-800 border-indigo-300 hover:border-indigo-400"
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              Xem chi tiết
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Trang {pagination.page}/{pagination.pages} - {pagination.total} structures
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
            {viewMode === 'flashcard' && grammars.length > 0 && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Card Counter */}
                <div className="text-center">
                  <Badge variant="secondary" className="text-sm">
                    {currentCardIndex + 1} / {grammars.length}
                  </Badge>
                </div>

                {/* Flashcard */}
                <Card
                  className="shadow-2xl border-0 bg-white/90 backdrop-blur-md cursor-pointer transform transition-all duration-300 hover:scale-[1.02] min-h-[500px]"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <CardContent className="p-8 flex flex-col justify-center min-h-[500px]">
                    {!isFlipped ? (
                      // Front - Grammar Name & Structure
                      <div className="space-y-6 text-center">
                        <div className="flex justify-center gap-3 mb-6">
                          <Badge
                            className={`${getTypeColor(grammars[currentCardIndex].type)} border`}
                            variant="secondary"
                          >
                            {grammars[currentCardIndex].type}
                          </Badge>
                          <Badge
                            className={`${getLevelColor(grammars[currentCardIndex].level)} border`}
                            variant="secondary"
                          >
                            {grammars[currentCardIndex].level}
                          </Badge>
                          {grammars[currentCardIndex].isComparison && (
                            <Badge
                              className="bg-orange-100 text-orange-800 border border-orange-300"
                              variant="secondary"
                            >
                              Comparison
                            </Badge>
                          )}
                        </div>

                        <h2 className="text-4xl font-bold text-indigo-600 mb-6 leading-tight">
                          {grammars[currentCardIndex].name}
                        </h2>

                        <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-l-4 border-indigo-400 max-w-2xl mx-auto">
                          <p className="text-xl font-mono text-indigo-800 font-semibold leading-relaxed">
                            {grammars[currentCardIndex].structure}
                          </p>
                        </div>

                        <p className="text-gray-500 text-lg">Nhấn để xem chi tiết</p>
                      </div>
                    ) : (
                      // Back - Full Details
                      <div className="space-y-6 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-green-600 mb-4 text-center">
                          {grammars[currentCardIndex].name}
                        </h2>

                        {/* Description */}
                        <div className="text-gray-700 text-lg leading-relaxed bg-gray-50 p-4 rounded-lg">
                          {grammars[currentCardIndex].description}
                        </div>

                        {/* Usage */}
                        {grammars[currentCardIndex].usage.length > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                              <Target className="h-4 w-4 mr-2" />
                              Cách sử dụng:
                            </h4>
                            <ul className="space-y-2">
                              {grammars[currentCardIndex].usage.slice(0, 4).map((usage, idx) => (
                                <li key={idx} className="text-sm text-green-700 flex items-start">
                                  <span className="text-green-500 mr-2 mt-1">●</span>
                                  <span>{usage}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Examples */}
                        {grammars[currentCardIndex].examples.length > 0 && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Ví dụ:
                            </h4>
                            <div className="space-y-3">
                              {grammars[currentCardIndex].examples
                                .slice(0, 3)
                                .map((example, idx) => (
                                  <div
                                    key={idx}
                                    className="border-l-4 border-blue-300 pl-4 bg-white/70 p-3 rounded-r-lg"
                                  >
                                    <p className="text-sm text-gray-700 mb-2">
                                      <span className="font-medium text-blue-700">#{idx + 1}:</span>{' '}
                                      {highlightText(example.sentence, example.highlight)}
                                    </p>
                                    <p className="text-sm text-blue-600 italic">
                                      → {example.meaning}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Related Structures */}
                        {grammars[currentCardIndex].relatedStructures &&
                          grammars[currentCardIndex].relatedStructures!.length > 0 && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                                <Link className="h-4 w-4 mr-2" />
                                Cấu trúc liên quan:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {grammars[currentCardIndex].relatedStructures!.map(
                                  (related, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-purple-700 border-purple-300"
                                    >
                                      {related}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <p className="text-gray-500 text-center">Nhấn để xem cấu trúc</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevCard}
                        disabled={grammars.length <= 1}
                        className="h-10 px-4"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Trước
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="h-10 px-4"
                      >
                        {isFlipped ? (
                          <EyeOff className="mr-2 h-4 w-4" />
                        ) : (
                          <Eye className="mr-2 h-4 w-4" />
                        )}
                        {isFlipped ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextCard}
                        disabled={grammars.length <= 1}
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
