'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Calendar, Trash2 } from 'lucide-react';

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
  }|null;
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
  onPageChange: (page: number) => Promise<void>;
  getAudioUrl: (word: WordData) => string;
  getPronunciation: (word: WordData) => string;
  formatDate: (dateString: string) => string;
  getUserBadge: (addedBy: WordData['addedBy']) => {
    icon: React.ComponentType<any>;
    color: string;
    label: string;
  };
  isAuthenticated: boolean;
  currentUserId?: string;
}

export default function GridView({
  words,
  pagination,
  onPageChange,
  getAudioUrl,
  getPronunciation,
  formatDate,
  getUserBadge,
  isAuthenticated,
  currentUserId,
}: GridViewProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const playAudio = async (word: WordData) => {
    const audioUrl = getAudioUrl(word);
    if (!audioUrl) return;

    try {
      setPlayingAudio(word._id);
      const audio = new Audio(audioUrl);

      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => setPlayingAudio(null);

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
    }
  };

  const deleteWord = async (word: WordData) => {
    if (!isAuthenticated || !word.addedBy || word.addedBy.userId !== currentUserId) {
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa từ "${word.word}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/words?word=${encodeURIComponent(word.word)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh the page or update the word list
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Có lỗi xảy ra khi xóa từ');
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      alert('Có lỗi xảy ra khi xóa từ');
    }
  };

  return (
    <div className="space-y-4">
      {/* Words Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {words.map(word => {
          const userBadge = getUserBadge(word.addedBy);
          const isMyWord = currentUserId && word.addedBy && word.addedBy.userId === currentUserId;
          const IconComponent = userBadge.icon;

          return (
            <Card
              key={word._id}
              className="group hover:shadow-lg transition-all duration-300 border hover:border-blue-300 relative"
            >
              <CardContent className="p-3">
                {/* Header with word and user info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-800 mb-1 truncate">{word.word}</h3>
                    <div className="text-xs text-gray-500 mb-1">{getPronunciation(word)}</div>
                  </div>

                  {/* Audio button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(word)}
                        disabled={playingAudio === word._id}
                        className="h-7 w-7 p-0 ml-2 flex-shrink-0"
                      >
                        {playingAudio === word._id ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Phát âm</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Level and Frequency badges */}
                <div className="flex gap-1 mb-2">
                  {word.level && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {word.level}
                    </Badge>
                  )}
                  {word.frequency && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {word.frequency}
                    </Badge>
                  )}
                </div>

                {/* Meanings */}
                <div className="space-y-1 mb-3">
                  {word.meanings.slice(0, 2).map((meaning, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-medium text-blue-600">{meaning.partOfSpeech}</span>
                      <p className="text-gray-600 line-clamp-2 mt-0.5">{meaning.definition}</p>
                      {meaning.vietnamese && (
                        <p className="text-orange-600 line-clamp-1 mt-0.5">{meaning.vietnamese}</p>
                      )}
                    </div>
                  ))}

                  {word.meanings.length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{word.meanings.length - 2} nghĩa khác
                    </div>
                  )}
                </div>

                {/* Vietnamese translation */}
                {word.vietnamese && (
                  <div className="mb-3">
                    <p className="text-xs text-orange-600 font-medium line-clamp-2">
                      🇻🇳 {word.vietnamese}
                    </p>
                  </div>
                )}

                {/* Footer with user info and actions */}
                <div className="border-t pt-2 mt-3">
                  <div className="flex items-center justify-between">
                    {/* User badge */}
                    <div className="flex items-center gap-1">
                      <IconComponent className="h-3 w-3" />
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${userBadge.color}`}>
                        {userBadge.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Date added */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {formatDate(word.createdAt)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Thêm bởi {word.addedBy?.userName || 'Không rõ'} lúc {formatDate(word.addedBy?.addedAt || word.createdAt)}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete button for own words */}
                      {isMyWord && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWord(word)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Xóa từ của tôi</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, pagination.pages))].map((_, idx) => {
              const pageNum = pagination.page - 2 + idx;
              if (pageNum < 1 || pageNum > pagination.pages) return null;

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="h-8 px-2"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="text-center text-xs text-gray-500 pt-2">
        Hiển thị {words.length} từ trên trang {pagination.page} / {pagination.pages} (
        {pagination.total} từ tổng cộng)
      </div>
    </div>
  );
}
