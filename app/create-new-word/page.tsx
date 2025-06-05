'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus, Search, Edit3, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ProcessResult {
  processed: number;
  scraped: number;
  saved: number;
  scrapeErrors: Array<{ word: string; error: string }>;
  saveErrors: Array<{ word: string; error: string }>;
}

export default function CreateNewWord() {
  const [inputMode, setInputMode] = useState<'bulk' | 'single'>('single');
  const [bulkText, setBulkText] = useState('');
  const [singleWord, setSingleWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string>('');
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
      <div className="container mx-auto p-6 max-w-2xl">
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

          {/* Success Result */}
          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>✅ Đã xử lý: {result.processed} từ</div>
                  <div>📚 Scrape thành công: {result.scraped} từ</div>
                  <div>💾 Lưu database: {result.saved} từ</div>
                  {result.scrapeErrors.length > 0 && (
                    <div className="text-orange-600">
                      ⚠️ Lỗi scrape: {result.scrapeErrors.length} từ
                    </div>
                  )}
                  {result.saveErrors.length > 0 && (
                    <div className="text-red-600">❌ Lỗi lưu: {result.saveErrors.length} từ</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
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
