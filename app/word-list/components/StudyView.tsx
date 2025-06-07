import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Target } from 'lucide-react';

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

interface StudyViewProps {
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
}

export default function StudyView({
  words,
  pagination,
  selectedDate,
  onPageChange,
  getAudioUrl,
  getPronunciation,
}: StudyViewProps) {
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
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3 text-center">
          <p className="text-sm text-blue-700">
            <Target className="h-4 w-4 inline mr-1" />
            Chế độ học tập: Hover qua từ để xem chi tiết • 🇬🇧 UK & 🇺🇸 US Audio
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
                  <h3 className="font-bold text-blue-600 text-lg mb-2">{word.word}</h3>

                  {/* Chỉ hiển thị phiên âm IPA */}
                  <div className="space-y-1 mb-2">
                    {word.pronunciation.uk && (
                      <p className="text-xs text-gray-600">🇬🇧 /{word.pronunciation.uk}/</p>
                    )}
                    {word.pronunciation.us && (
                      <p className="text-xs text-gray-600">🇺🇸 /{word.pronunciation.us}/</p>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {word.level && (
                      <Badge variant="secondary" className="text-xs">
                        {word.level}
                      </Badge>
                    )}
                    <div className="flex gap-1">
                      {word.audio.uk && (
                        <Badge variant="outline" className="text-xs">
                          🇬🇧
                        </Badge>
                      )}
                      {word.audio.us && (
                        <Badge variant="outline" className="text-xs">
                          🇺🇸
                        </Badge>
                      )}
                    </div>
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

                  {/* Pronunciation - Cả UK và US */}
                  <div className="space-y-1 my-2">
                    {word.pronunciation.uk && (
                      <p className="text-sm text-gray-600">🇬🇧 /{word.pronunciation.uk}/</p>
                    )}
                    {word.pronunciation.us && (
                      <p className="text-sm text-gray-600">🇺🇸 /{word.pronunciation.us}/</p>
                    )}
                  </div>

                  <p className="text-green-600 font-medium">{word.vietnamese}</p>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {word.meanings.slice(0, 2).map((meaning, idx) => (
                    <div key={idx} className="border-l-2 border-blue-200 pl-2">
                      <Badge variant="outline" className="text-xs mb-1">
                        {meaning.partOfSpeech}
                      </Badge>
                      <p className="text-sm text-gray-700 mb-1">{meaning.definition}</p>
                      {meaning.vietnamese && (
                        <p className="text-sm text-green-600 italic mb-1">→ {meaning.vietnamese}</p>
                      )}
                      {meaning.examples[0] && (
                        <p className="text-xs text-gray-500 italic">"{meaning.examples[0]}"</p>
                      )}
                    </div>
                  ))}
                  {word.meanings.length > 2 && (
                    <p className="text-xs text-gray-400 italic">
                      +{word.meanings.length - 2} nghĩa khác...
                    </p>
                  )}
                </div>

                {/* Audio Buttons - Cả UK và US */}
                <div className="flex gap-1 pt-2 border-t">
                  {/* UK Audio Button */}
                  {word.audio.uk ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={e => {
                        e.stopPropagation();
                        playAudio(word, 'uk');
                      }}
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
                      onClick={e => {
                        e.stopPropagation();
                        playAudio(word, 'us');
                      }}
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
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

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
