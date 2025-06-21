'use client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Edit3,
  Globe,
  Loader2,
  Plus,
  Search,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ErrorDetail {
  word: string;
  error: string;
  type: 'SCRAPE_ERROR' | 'DATABASE_ERROR';
}

interface ProcessResult {
  processed: number;
  scraped: number;
  saved: number;
  scrapeErrors: ErrorDetail[];
  saveErrors: ErrorDetail[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    scrapeFailures: number;
    saveFailures: number;
  };
  details: {
    cleanedWords: string[];
    scrapedWords: string[];
    savedWords: string[];
    failedWords: Array<{
      word: string;
      reason: string;
      detail: string;
    }>;
  };
  // ✅ NEW: User info in response
  user: {
    userId: string;
    userName: string;
    userEmail: string;
  };
}

export default function CreateNewWord() {
  const [inputMode, setInputMode] = useState<'bulk' | 'single'>('single');
  const [bulkText, setBulkText] = useState('');
  const [singleWord, setSingleWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  // ✅ NEW: Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const router = useRouter();

  // ✅ Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
          setAuthToken(token);
          setUserInfo(JSON.parse(userData));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Xử lý bulk input
  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;

    const words = bulkText
      .split(/[\n,]/)
      .map(word => word.trim())
      .filter(word => word && /^[a-zA-Z\s-]+$/.test(word));

    if (words.length === 0) {
      setError('Không tìm thấy từ hợp lệ');
      return;
    }

    await processWords(words);
    setBulkText('');
  };

  // Xử lý single input
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleWord.trim()) return;

    if (!/^[a-zA-Z\s-]+$/.test(singleWord.trim())) {
      setError('Từ chỉ được chứa chữ cái, dấu cách và dấu gạch ngang');
      return;
    }

    await processWords([singleWord.trim()]);
    setSingleWord('');
  };

  // ✅ UPDATED: Gửi request với authentication
  const processWords = async (words: string[]) => {
    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      if (!authToken) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`, // ✅ Include auth token
        },
        body: JSON.stringify({
          words,
          mode: inputMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setResult(data.data);
    } catch (error: any) {
      console.error('Error processing words:', error);
      setError(error.message || 'Có lỗi xảy ra khi xử lý từ');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
      {/* Floating Animated Image */}
      <div className="fixed bottom-8 right-8 z-10">
        <div className="relative animate-bounce">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl border-3 border-white hover:scale-110 transition-transform cursor-pointer">
            <Image
              src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1749281277/photo-1462258409682-731445253757_d9mxww.jpg"
              alt="Avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-3xl">
        {/* Header with User Info */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 hover:bg-slate-100"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          {/* ✅ User Info Card */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Xin chào, {userInfo?.name || userInfo?.email}! 👋
                    </h3>
                    <p className="text-sm text-gray-600">
                      Hãy thêm từ vựng mới vào thư viện cá nhân của bạn
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Đã xác thực
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ✅ Enhanced Success Result with User Info */}
          {result && (
            <div className="space-y-4">
              {/* Summary Card with User Info */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        Kết quả cho {result.user.userName}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {result.summary.successful}
                      </div>
                      <div className="text-xs text-green-700">Thành công</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {result.summary.scrapeFailures}
                      </div>
                      <div className="text-xs text-orange-700">Lỗi Scrape</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {result.summary.saveFailures}
                      </div>
                      <div className="text-xs text-red-700">Lỗi Database</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{result.summary.total}</div>
                      <div className="text-xs text-blue-700">Tổng cộng</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Detailed Results */}
              {(result.scrapeErrors.length > 0 || result.saveErrors.length > 0) && (
                <Card className="border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                        Chi tiết lỗi ({result.summary.failed} từ)
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-orange-600"
                      >
                        {showDetails ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Ẩn
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Xem chi tiết
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {showDetails && (
                    <CardContent className="space-y-4">
                      {/* Scrape Errors */}
                      {result.scrapeErrors.length > 0 && (
                        <div>
                          <div className="flex items-center mb-3">
                            <Globe className="h-4 w-4 text-orange-500 mr-2" />
                            <h4 className="font-semibold text-orange-700">
                              Lỗi Scrape ({result.scrapeErrors.length} từ)
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {result.scrapeErrors.map((err, idx) => (
                              <div
                                key={idx}
                                className="bg-orange-50 border border-orange-200 rounded-md p-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-orange-700 border-orange-300"
                                      >
                                        {err.word}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        SCRAPE ERROR
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-orange-600 mt-1">{err.error}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Save Errors */}
                      {result.saveErrors.length > 0 && (
                        <div>
                          <div className="flex items-center mb-3">
                            <Database className="h-4 w-4 text-red-500 mr-2" />
                            <h4 className="font-semibold text-red-700">
                              Lỗi Database ({result.saveErrors.length} từ)
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {result.saveErrors.map((err, idx) => (
                              <div
                                key={idx}
                                className="bg-red-50 border border-red-200 rounded-md p-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-red-700 border-red-300"
                                      >
                                        {err.word}
                                      </Badge>
                                      <Badge variant="destructive" className="text-xs">
                                        DATABASE ERROR
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-red-600 mt-1">{err.error}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Successful Words */}
                      {result.details.savedWords.length > 0 && (
                        <div>
                          <div className="flex items-center mb-3">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <h4 className="font-semibold text-green-700">
                              Từ đã lưu thành công ({result.details.savedWords.length} từ)
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.details.savedWords.map((word, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-green-100 text-green-700"
                              >
                                {word}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Mode Toggle */}
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={inputMode === 'single' ? 'default' : 'outline'}
                  onClick={() => setInputMode('single')}
                  className="h-12 flex flex-col gap-1"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-medium">Nhập từng từ</span>
                </Button>
                <Button
                  variant={inputMode === 'bulk' ? 'default' : 'outline'}
                  onClick={() => setInputMode('bulk')}
                  className="h-12 flex flex-col gap-1"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-xs font-medium">Nhập hàng loạt</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Single Input */}
          {inputMode === 'single' && (
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Nhập một từ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    value={singleWord}
                    onChange={e => setSingleWord(e.target.value)}
                    placeholder="Nhập từ vựng..."
                    className="h-10"
                    disabled={isProcessing}
                  />
                  <Button
                    type="submit"
                    disabled={!singleWord.trim() || isProcessing}
                    className="w-full h-10"
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Tìm kiếm từ
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Bulk Input */}
          {inputMode === 'bulk' && (
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Nhập nhiều từ (tối đa 50 từ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={`Nhập từ, mỗi từ một dòng:

school
house
computer
beautiful

💡 Lưu ý: Bạn có thể thêm từ đã có trong hệ thống vào thư viện cá nhân của mình`}
                  className="min-h-[150px] resize-none"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleBulkSubmit}
                  disabled={!bulkText.trim() || isProcessing}
                  className="w-full h-10"
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Tìm kiếm tất cả
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ✅ Enhanced Quick Examples with User Note */}
          <Card className="shadow-lg bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm">💡 Gợi ý:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {['beautiful', 'computer', 'school', 'house'].map(word => (
                  <Button
                    key={word}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (inputMode === 'single') {
                        setSingleWord(word);
                      } else {
                        setBulkText(prev => (prev ? `${prev}\n${word}` : word));
                      }
                    }}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100 h-8 text-xs"
                    disabled={isProcessing}
                  >
                    {word}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                <strong>Lưu ý:</strong> Từ sẽ được lưu vào thư viện cá nhân của{' '}
                <strong>{userInfo?.name}</strong>. Bạn có thể thêm từ đã có của người khác vào thư
                viện của mình.
              </div>
            </CardContent>
          </Card>

          {/* Processing Info */}
          {isProcessing && (
            <Card className="shadow-lg bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    Đang scrape dữ liệu từ Longman Dictionary...
                  </span>
                </div>
                <p className="text-yellow-700 text-sm text-center mt-2">
                  Quá trình này có thể mất vài phút
                </p>
                <div className="text-xs text-yellow-600 text-center mt-1">
                  Đang xử lý cho: {userInfo?.name}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
