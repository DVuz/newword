'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Plus,
  Search,
  Code,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  Sparkles,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface ProcessResult {
  processed: number;
  translated: number;
  saved: number;
  translationErrors: Array<{ word: string; error: string }>;
  saveErrors: Array<{ word: string; error: string }>;
}

export default function CreateTerms() {
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [singleTerm, setSingleTerm] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Xử lý single term
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTerm.trim()) return;
    await processTerms([singleTerm.trim()]);
    setSingleTerm('');
  };

  // Xử lý bulk terms
  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;
    const terms = bulkText
      .split(/[\n,]/)
      .map(term => term.trim())
      .filter(term => term);

    if (terms.length === 0) {
      setError('Không tìm thấy term nào');
      return;
    }

    if (terms.length > 50) {
      setError('Tối đa 50 terms mỗi lần');
      return;
    }

    await processTerms(terms);
    setBulkText('');
  };

  // Gửi request đến API
  const processTerms = async (terms: string[]) => {
    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/programming-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: terms, mode: inputMode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      setResult(data.data);
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi xử lý programming terms');
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = bulkText.split(/[\n,]/).filter(t => t.trim()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200 rounded-full blur-2xl"></div>
        <div className="absolute top-32 right-16 w-24 h-24 bg-blue-200 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-cyan-200 rounded-full blur-2xl"></div>
      </div>

      {/* Floating Avatar */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-white backdrop-blur-sm bg-white/10 hover:scale-110 transition-transform duration-300 cursor-pointer">
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

      <div className="container mx-auto p-4 max-w-7xl min-h-screen relative z-10 flex flex-col">
        {/* Header - Responsive */}
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
              <Code className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Programming Terms
              </h1>
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 animate-pulse" />
            </div>
          </div>

          <div className="w-16 sm:w-24"></div>
        </div>

        {/* Alerts - Responsive */}
        {(error || result) && (
          <div className="mb-4 space-y-2">
            {error && (
              <Alert
                variant="destructive"
                className="py-2 shadow-md border-0 bg-red-50/80 backdrop-blur-sm"
              >
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className="py-2 bg-emerald-50/80 border-emerald-200 shadow-md backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm font-medium">
                    <span className="text-emerald-700">✅ Xử lý: {result.processed}</span>
                    <span className="text-blue-700">🤖 Dịch: {result.translated}</span>
                    <span className="text-purple-700">💾 Lưu: {result.saved}</span>
                    <span className="text-orange-700">
                      ⚠️ Lỗi: {result.translationErrors.length + result.saveErrors.length}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main Content - Responsive Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel - Input Section */}
          <div className="lg:col-span-7 space-y-4">
            {/* Mode Selection */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={inputMode === 'single' ? 'default' : 'outline'}
                    onClick={() => setInputMode('single')}
                    className={`h-10 md:h-12 text-sm transition-all duration-300 ${
                      inputMode === 'single'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-white/50 hover:bg-white/80 border-2 border-blue-200'
                    }`}
                    disabled={isProcessing}
                  >
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Thêm từng term</span>
                    <span className="sm:hidden">Đơn lẻ</span>
                  </Button>

                  <Button
                    variant={inputMode === 'bulk' ? 'default' : 'outline'}
                    onClick={() => setInputMode('bulk')}
                    className={`h-10 md:h-12 text-sm transition-all duration-300 ${
                      inputMode === 'bulk'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-white/50 hover:bg-white/80 border-2 border-purple-200'
                    }`}
                    disabled={isProcessing}
                  >
                    <Search className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Thêm hàng loạt</span>
                    <span className="sm:hidden">Hàng loạt</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Input Section */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base md:text-lg font-semibold">
                  <div
                    className={`p-2 rounded-lg mr-3 ${
                      inputMode === 'single' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}
                  >
                    {inputMode === 'single' ? (
                      <Plus className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Search className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <span className="hidden sm:inline">
                    {inputMode === 'single'
                      ? 'Nhập một programming term'
                      : 'Nhập nhiều programming terms'}
                  </span>
                  <span className="sm:hidden">
                    {inputMode === 'single' ? 'Nhập term' : 'Nhập nhiều terms'}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                {inputMode === 'single' ? (
                  <form onSubmit={handleSingleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={singleTerm}
                        onChange={e => setSingleTerm(e.target.value)}
                        placeholder="Ví dụ: declare, manipulate..."
                        className="h-10 md:h-12 text-sm md:text-base border-2 border-blue-200 focus:border-blue-400 bg-white/80"
                        disabled={isProcessing}
                      />
                      <div className="text-xs text-gray-600 bg-blue-50/50 p-2 rounded">
                        💡 Nhập thuật ngữ lập trình: declare, initialize, callback...
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!singleTerm.trim() || isProcessing}
                      className="w-full h-10 md:h-12 text-sm md:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md transition-all duration-300"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Đang xử lý...</span>
                          <span className="sm:hidden">Xử lý...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Xử lý với AI & thêm vào từ điển</span>
                          <span className="sm:hidden">Xử lý với AI</span>
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        value={bulkText}
                        onChange={e => setBulkText(e.target.value)}
                        placeholder="declare, initialize, manipulate
serialize, polymorphism
inheritance, callback"
                        className="h-32 md:h-40 resize-none text-sm border-2 border-purple-200 focus:border-purple-400 bg-white/80"
                        disabled={isProcessing}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div className="text-gray-600 bg-purple-50/50 p-2 rounded flex items-center gap-1">
                          <FileText className="h-3 w-3 text-purple-500" />
                          <span className="hidden sm:inline">
                            Mỗi từ một dòng hoặc cách nhau bởi dấu phẩy. Tối đa 50 từ.
                          </span>
                          <span className="sm:hidden">Tối đa 50 từ, cách nhau bởi dấu phẩy</span>
                        </div>

                        {bulkText.trim() && (
                          <div
                            className={`font-medium p-2 rounded flex items-center gap-1 ${
                              wordCount > 50
                                ? 'text-red-600 bg-red-50/50'
                                : 'text-blue-600 bg-blue-50/50'
                            }`}
                          >
                            <TrendingUp className="h-3 w-3" />
                            Số từ: {wordCount} {wordCount > 50 && '(Quá giới hạn!)'}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleBulkSubmit}
                      disabled={!bulkText.trim() || isProcessing || wordCount > 50}
                      className="w-full h-10 md:h-12 text-sm md:text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md transition-all duration-300 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Đang xử lý {wordCount} từ...</span>
                          <span className="sm:hidden">Xử lý {wordCount} từ...</span>
                        </>
                      ) : wordCount > 50 ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Vượt quá giới hạn 50 từ</span>
                          <span className="sm:hidden">Quá giới hạn</span>
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Xử lý {wordCount} từ với AI</span>
                          <span className="sm:hidden">Xử lý {wordCount} từ</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results (Moves below on mobile) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Processing Status */}
            {isProcessing && (
              <Card className="shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-0 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                      <span className="text-orange-800 font-semibold text-sm md:text-base">
                        <span className="hidden sm:inline">Đang xử lý với Gemini AI...</span>
                        <span className="sm:hidden">Đang xử lý...</span>
                      </span>
                    </div>
                    <p className="text-sm text-orange-700">
                      🤖{' '}
                      <span className="hidden sm:inline">
                        Đang tạo định nghĩa, ví dụ và phân loại
                      </span>
                      <span className="sm:hidden">Tạo định nghĩa và ví dụ</span>
                    </p>
                    <div className="w-full h-1 bg-orange-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Display - Errors */}
            {result && (result.translationErrors.length > 0 || result.saveErrors.length > 0) && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-yellow-50 to-amber-50 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg text-amber-800 flex items-center">
                    <XCircle className="h-5 w-5 text-amber-600 mr-2" />
                    Lỗi ({result.translationErrors.length + result.saveErrors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-48 md:max-h-60 overflow-y-auto">
                    {/* Translation errors */}
                    {result.translationErrors.map((error, idx) => (
                      <div
                        key={`translation-${idx}`}
                        className="bg-white/80 p-3 rounded border border-amber-200 shadow-sm"
                      >
                        <div className="text-sm">
                          <span className="font-semibold text-red-800">
                            🤖 AI Lỗi - {error.word}:
                          </span>
                          <span className="text-gray-700 ml-1 break-words">{error.error}</span>
                        </div>
                      </div>
                    ))}

                    {/* Save errors */}
                    {result.saveErrors.map((error, idx) => (
                      <div
                        key={`save-${idx}`}
                        className="bg-white/80 p-3 rounded border border-amber-200 shadow-sm"
                      >
                        <div className="text-sm">
                          <span className="font-semibold text-orange-800">
                            💾 DB Lỗi - {error.word}:
                          </span>
                          <span className="text-gray-700 ml-1 break-words">{error.error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success state */}
            {result &&
              result.saved > 0 &&
              result.translationErrors.length === 0 &&
              result.saveErrors.length === 0 && (
                <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-md">
                  <CardContent className="p-4 text-center">
                    <div className="space-y-3">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                      <div className="space-y-1">
                        <p className="font-semibold text-green-800">Thành công!</p>
                        <p className="text-sm text-green-700">
                          Đã xử lý và lưu {result.saved}/{result.processed} programming terms
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Empty state when no processing and no results */}
            {!isProcessing && !result && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-md">
                <CardContent className="p-6 text-center text-gray-500">
                  <div className="space-y-3">
                    <Code className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="text-sm">Kết quả sẽ hiển thị ở đây</p>
                    <p className="text-xs hidden sm:block">
                      Nhập programming terms và bấm xử lý để bắt đầu
                    </p>
                    <p className="text-xs sm:hidden">Nhập terms để bắt đầu</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
