'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit3,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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
}

export default function CreateNewWord() {
  const [inputMode, setInputMode] = useState<'bulk' | 'single'>('single');
  const [bulkText, setBulkText] = useState('');
  const [singleWord, setSingleWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

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

  // Gửi request đến API
  const processWords = async (words: string[]) => {
    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          words,
          mode: inputMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
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
              src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1748938841/%C3%81nh_D%C6%B0%C6%A1ng_s_facebook_2023-4-17_story_1_nm0n4s.jpg"
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
        {/* Header */}
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

          {/* Enhanced Success Result */}
          {result && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
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
beautiful`}
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

          {/* Quick Examples */}
          <Card className="shadow-lg bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm">💡 Gợi ý:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
