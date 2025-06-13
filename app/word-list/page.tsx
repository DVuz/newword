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
  Calendar,
  Target,
  Filter,
  CalendarDays,
  Shield,
  User,
  Info,
  Crown,
  UserCircle,
} from 'lucide-react';

// Import các component con
import GridView from './components/GridView';
import StudyView from './components/StudyView';
import FlashcardView from './components/FlashcardView';
import ListenView from './components/ListenView';

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

interface UserInfo {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

export default function WordList() {
  const [viewMode, setViewMode] = useState<'grid' | 'flashcard' | 'study' | 'listen'>('grid');
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [dateStats, setDateStats] = useState<DateStats | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const router = useRouter();

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  };

  // ✅ getUserBadge function
  const getUserBadge = (addedBy?: WordData['addedBy']) => {
    if (!addedBy) {
      // Legacy word (no addedBy info)
      return {
        icon: Crown,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        label: 'Legacy',
      };
    }

    // Check if current user is admin
    const isCurrentUserAdmin = userInfo?.userRole === 'admin';
    const isCurrentUser = userInfo?.userId === addedBy.userId;

    if (isCurrentUser) {
      return {
        icon: User,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        label: 'Của tôi',
      };
    }

    if (addedBy.userName === 'Admin' || addedBy.userId === '1') {
      return {
        icon: Shield,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        label: 'Admin',
      };
    }

    // Other user's word
    return {
      icon: UserCircle,
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      label:
        addedBy.userName.length > 8 ? addedBy.userName.substring(0, 8) + '...' : addedBy.userName,
    };
  };

  // Fetch words function
  const fetchWords = async (page = 1, search = '') => {
    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) {
        params.append('search', search);
      }

      if (selectedDate !== 'all') {
        params.append('date', selectedDate);

        if (selectedDate === 'specific' && specificDate) {
          params.append('specificDate', specificDate);
        }
      }

      const response = await fetch(`/api/words/list?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setWords(data.data.words);
      setPagination(data.data.pagination);
      setDateStats(data.data.dateStats);
      setUserInfo(data.data.userInfo);

      console.log('📊 Fetched words:', {
        count: data.data.words.length,
        userRole: data.data.userInfo.userRole,
        hasLegacyWords: data.data.meta.hasLegacyWords,
      });
    } catch (error: any) {
      console.error('Error fetching words:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải từ vựng');
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Audio helper functions
  const getAudioUrl = (word: WordData): string => {
    return word.audio.us || word.audio.uk || '';
  };

  const getPronunciation = (word: WordData): string => {
    return word.pronunciation.us || word.pronunciation.uk || '';
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
              src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1749281277/photo-1462258409682-731445253757_d9mxww.jpg"
              alt="Avatar"
              width={48}
              height={48}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        <div className="container mx-auto p-3 max-w-7xl">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" onClick={() => router.back()} size="sm">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Quay lại
              </Button>

              {/* User Info */}
              {userInfo && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={userInfo.userRole === 'admin' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {userInfo.userRole === 'admin' ? (
                      <>
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 mr-1" />
                        {userInfo.userName}
                      </>
                    )}
                  </Badge>
                </div>
              )}
            </div>

            {/* Admin Info Alert */}
            {userInfo?.userRole === 'admin' && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Quyền Admin:</strong> Bạn có thể xem tất cả từ vựng (bao gồm từ legacy và
                  từ của tất cả users). Bạn cũng có thể xóa bất kỳ từ nào.
                </AlertDescription>
              </Alert>
            )}

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
                    <div className="text-xs text-indigo-700">
                      {userInfo?.userRole === 'admin' ? 'Tổng (Hệ thống)' : 'Tổng (Của tôi)'}
                    </div>
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
                    placeholder={
                      userInfo?.userRole === 'admin' ? 'Tìm tất cả từ...' : 'Tìm từ của tôi...'
                    }
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
                  <div className="flex gap-1 flex-wrap">
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
                      onClick={() => setViewMode('flashcard')}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={words.length === 0}
                    >
                      <CreditCard className="mr-1 h-3 w-3" />
                      Card
                    </Button>
                    <Button
                      variant={viewMode === 'listen' ? 'default' : 'outline'}
                      onClick={() => setViewMode('listen')}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={words.length === 0}
                    >
                      <Volume2 className="mr-1 h-3 w-3" />
                      Nghe
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs h-6">
                      {pagination.total} từ • 🇺🇸 US Audio
                    </Badge>
                    {userInfo?.userRole === 'admin' && (
                      <Badge variant="outline" className="text-xs h-6">
                        <Shield className="h-2 w-2 mr-1" />
                        Admin View
                      </Badge>
                    )}
                  </div>
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
                  {userInfo?.userRole === 'admin'
                    ? 'Không có từ vựng nào trong hệ thống'
                    : 'Bạn chưa có từ vựng nào'}
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
              {/* Render các component con dựa trên viewMode */}
              {viewMode === 'grid' && (
                <GridView
                  words={words}
                  pagination={pagination}
                  selectedDate={selectedDate}
                  onPageChange={handlePageChange}
                  getAudioUrl={getAudioUrl}
                  getPronunciation={getPronunciation}
                  formatDate={formatDate}
                  getUserBadge={getUserBadge}
                  isAuthenticated={!!userInfo}
                  currentUserId={userInfo?.userId}
                />
              )}

              {viewMode === 'study' && (
                <StudyView
                  words={words}
                  pagination={pagination}
                  selectedDate={selectedDate}
                  onPageChange={handlePageChange}
                  getAudioUrl={getAudioUrl}
                  getPronunciation={getPronunciation}
                  getUserBadge={getUserBadge}
                  isAuthenticated={!!userInfo}
                  currentUserId={userInfo?.userId}
                />
              )}

              {viewMode === 'flashcard' && (
                <FlashcardView
                  words={words}
                  pagination={pagination}
                  selectedDate={selectedDate}
                  onPageChange={handlePageChange}
                  getAudioUrl={getAudioUrl}
                  getPronunciation={getPronunciation}
                  getUserBadge={getUserBadge}
                  isAuthenticated={!!userInfo}
                  currentUserId={userInfo?.userId}
                />
              )}

              {viewMode === 'listen' && (
                <ListenView
                  words={words}
                  pagination={pagination}
                  selectedDate={selectedDate}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  getAudioUrl={getAudioUrl}
                  getPronunciation={getPronunciation}
                  getUserBadge={getUserBadge}
                  isAuthenticated={!!userInfo}
                  currentUserId={userInfo?.userId}
                />
              )}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
