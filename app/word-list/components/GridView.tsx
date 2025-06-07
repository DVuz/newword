import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';

interface WordData {
  _id: string;
  word: string;
  pronunciation: { uk: string; us: string };
  audio: { uk: string; us: string };
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

interface GridViewProps {
  words: WordData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  selectedDate: string;
  onPageChange: (page: number) => void;
  getAudioUrl: (word: WordData) => string;
  getPronunciation: (word: WordData) => string;
  formatDate: (date: string) => string;
}

export default function GridView({
  words,
  pagination,
  selectedDate,
  onPageChange,
  getAudioUrl,
  getPronunciation,
  formatDate,
}: GridViewProps) {
  // Hàm phát audio cho từng loại (UK/US)
  const playAudio = (word: WordData, type: 'uk' | 'us') => {
    const audioUrl = word.audio[type];
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {words.map(word => (
          <Card key={word._id} className="hover:shadow-md transition-shadow border">
            <CardContent className="p-3">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-blue-600 text-base leading-tight">{word.word}</h3>
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

              {/* Pronunciation - Cả UK và US */}
              <div className="mb-2 space-y-1">
                {word.pronunciation.uk && (
                  <div className="text-xs text-gray-600">🇬🇧 /{word.pronunciation.uk}/</div>
                )}
                {word.pronunciation.us && (
                  <div className="text-xs text-gray-600">🇺🇸 /{word.pronunciation.us}/</div>
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
                    <p className="text-xs text-gray-700 leading-snug mb-1">{meaning.definition}</p>
                    {meaning.vietnamese && (
                      <p className="text-xs text-green-600 italic mb-1">→ {meaning.vietnamese}</p>
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
                {/* Audio Buttons - Cả UK và US */}
                <div className="flex gap-1">
                  {/* UK Audio Button */}
                  {word.audio.uk ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playAudio(word, 'uk')}
                      className="h-6 px-2 text-xs"
                    >
                      <Volume2 className="h-2 w-2 mr-1" />
                      🇬🇧
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="h-6 px-2 text-xs opacity-50"
                    >
                      <VolumeX className="h-2 w-2 mr-1" />
                      🇬🇧
                    </Button>
                  )}

                  {/* US Audio Button */}
                  {word.audio.us ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playAudio(word, 'us')}
                      className="h-6 px-2 text-xs"
                    >
                      <Volume2 className="h-2 w-2 mr-1" />
                      🇺🇸
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="h-6 px-2 text-xs opacity-50"
                    >
                      <VolumeX className="h-2 w-2 mr-1" />
                      🇺🇸
                    </Button>
                  )}
                </div>

                {/* Created Date */}
                <span className="text-xs text-gray-400">{formatDate(word.createdAt)}</span>
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
                {selectedDate !== 'all' && <span className="text-blue-600 ml-1">(đã lọc)</span>}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
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
  );
}
