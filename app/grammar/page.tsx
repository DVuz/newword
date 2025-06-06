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
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

interface ProcessResult {
  processed: number;
  analyzed: number;
  saved: number;
  analysisErrors: Array<{ grammar: string; error: string }>;
  saveErrors: Array<{ grammar: string; error: string }>;
}

export default function CreateGrammar() {
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [singleGrammar, setSingleGrammar] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Xử lý single grammar
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleGrammar.trim()) return;
    await processGrammar([singleGrammar.trim()]);
    setSingleGrammar('');
  };

  // Xử lý bulk grammar
  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;
    const grammarInputs = bulkText
      .split(/[\n]/)
      .map(input => input.trim())
      .filter(input => input);

    if (grammarInputs.length === 0) {
      setError('Không tìm thấy cấu trúc ngữ pháp nào');
      return;
    }

    if (grammarInputs.length > 10) {
      setError('Tối đa 10 cấu trúc mỗi lần');
      return;
    }

    await processGrammar(grammarInputs);
    setBulkText('');
  };

  // Gửi request đến API
  const processGrammar = async (grammarInputs: string[]) => {
    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/grammar-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammarInputs, mode: inputMode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      setResult(data.data);
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi xử lý cấu trúc ngữ pháp');
    } finally {
      setIsProcessing(false);
    }
  };

  const grammarCount = bulkText.split(/[\n]/).filter(t => t.trim()).length;

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
        {/* Header */}
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
                Grammar Structures
              </h1>
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-pink-500 animate-pulse" />
            </div>
          </div>

          <div className="w-16 sm:w-24"></div>
        </div>

        {/* Alerts */}
        {(error || result) && (
          <div className="mb-4 space-y-2">
            {error && (
              <Alert variant="destructive" className="py-2 shadow-md border-0 bg-red-50/80 backdrop-blur-sm">
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
                    <span className="text-blue-700">🤖 Phân tích: {result.analyzed}</span>
                    <span className="text-purple-700">💾 Lưu: {result.saved}</span>
                    <span className="text-orange-700">
                      ⚠️ Lỗi: {result.analysisErrors.length + result.saveErrors.length}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main Content */}
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
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'bg-white/50 hover:bg-white/80 border-2 border-indigo-200'
                    }`}
                    disabled={isProcessing}
                  >
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Thêm từng cấu trúc</span>
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
                  <div className={`p-2 rounded-lg mr-3 ${
                    inputMode === 'single' ? 'bg-indigo-100' : 'bg-purple-100'
                  }`}>
                    {inputMode === 'single' ? (
                      <Plus className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Search className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <span className="hidden sm:inline">
                    {inputMode === 'single'
                      ? 'Nhập một cấu trúc ngữ pháp'
                      : 'Nhập nhiều cấu trúc ngữ pháp'}
                  </span>
                  <span className="sm:hidden">
                    {inputMode === 'single' ? 'Nhập cấu trúc' : 'Nhập nhiều cấu trúc'}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                {inputMode === 'single' ? (
                  <form onSubmit={handleSingleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={singleGrammar}
                        onChange={e => setSingleGrammar(e.target.value)}
                        placeholder="Ví dụ: have someone do something"
                        className="h-10 md:h-12 text-sm md:text-base border-2 border-indigo-200 focus:border-indigo-400 bg-white/80"
                        disabled={isProcessing}
                      />
                      <div className="text-xs text-gray-600 bg-indigo-50/50 p-2 rounded">
                        💡 Nhập cấu trúc ngữ pháp: have someone do, make someone do, get someone to do...
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!singleGrammar.trim() || isProcessing}
                      className="w-full h-10 md:h-12 text-sm md:text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all duration-300"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Đang phân tích...</span>
                          <span className="sm:hidden">Phân tích...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Phân tích với AI & lưu ngữ pháp</span>
                          <span className="sm:hidden">Phân tích với AI</span>
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
                        placeholder="have someone do something
have someone doing something
make someone do something
get someone to do something
let someone do something"
                        className="h-32 md:h-40 resize-none text-sm border-2 border-purple-200 focus:border-purple-400 bg-white/80"
                        disabled={isProcessing}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div className="text-gray-600 bg-purple-50/50 p-2 rounded flex items-center gap-1">
                          <FileText className="h-3 w-3 text-purple-500" />
                          <span className="hidden sm:inline">Mỗi cấu trúc một dòng. Tối đa 10 cấu trúc.</span>
                          <span className="sm:hidden">Tối đa 10 cấu trúc, mỗi dòng một cấu trúc</span>
                        </div>

                        {bulkText.trim() && (
                          <div className={`font-medium p-2 rounded flex items-center gap-1 ${
                            grammarCount > 10
                              ? 'text-red-600 bg-red-50/50'
                              : 'text-indigo-600 bg-indigo-50/50'
                          }`}>
                            <TrendingUp className="h-3 w-3" />
                            Số cấu trúc: {grammarCount} {grammarCount > 10 && '(Quá giới hạn!)'}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleBulkSubmit}
                      disabled={!bulkText.trim() || isProcessing || grammarCount > 10}
                      className="w-full h-10 md:h-12 text-sm md:text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md transition-all duration-300 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Đang phân tích {grammarCount} cấu trúc...</span>
                          <span className="sm:hidden">Phân tích {grammarCount} cấu trúc...</span>
                        </>
                      ) : grammarCount > 10 ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Vượt quá giới hạn 10 cấu trúc</span>
                          <span className="sm:hidden">Quá giới hạn</span>
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Phân tích {grammarCount} cấu trúc với AI</span>
                          <span className="sm:hidden">Phân tích {grammarCount} cấu trúc</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-5 space-y-4">
            {/* Processing Status */}
            {isProcessing && (
              <Card className="shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-0 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                      <span className="text-orange-800 font-semibold text-sm md:text-base">
                        <span className="hidden sm:inline">Đang phân tích với Gemini AI...</span>
                        <span className="sm:inline">Đang phân tích...</span>
                      </span>
                    </div>
                    <p className="text-sm text-orange-700">
                      🤖 <span className="hidden sm:inline">Đang tạo cấu trúc, ví dụ và phân loại</span>
                      <span className="sm:hidden">Tạo cấu trúc và ví dụ</span>
                    </p>
                    <div className="w-full h-1 bg-orange-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Display - Errors */}
            {result && (result.analysisErrors.length > 0 || result.saveErrors.length > 0) && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-yellow-50 to-amber-50 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg text-amber-800 flex items-center">
                    <XCircle className="h-5 w-5 text-amber-600 mr-2" />
                    Lỗi ({result.analysisErrors.length + result.saveErrors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-48 md:max-h-60 overflow-y-auto">
                    {/* Analysis errors */}
                    {result.analysisErrors.map((error, idx) => (
                      <div
                        key={`analysis-${idx}`}
                        className="bg-white/80 p-3 rounded border border-amber-200 shadow-sm"
                      >
                        <div className="text-sm">
                          <span className="font-semibold text-red-800">
                            🤖 AI Lỗi - {error.grammar}:
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
                            💾 DB Lỗi - {error.grammar}:
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
              result.analysisErrors.length === 0 &&
              result.saveErrors.length === 0 && (
                <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-md">
                  <CardContent className="p-4 text-center">
                    <div className="space-y-3">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                      <div className="space-y-1">
                        <p className="font-semibold text-green-800">Thành công!</p>
                        <p className="text-sm text-green-700">
                          Đã phân tích và lưu {result.saved}/{result.processed} cấu trúc ngữ pháp
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
                    <GraduationCap className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="text-sm">Kết quả sẽ hiển thị ở đây</p>
                    <p className="text-xs hidden sm:block">
                      Nhập cấu trúc ngữ pháp và bấm phân tích để bắt đầu
                    </p>
                    <p className="text-xs sm:hidden">Nhập cấu trúc để bắt đầu</p>
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
