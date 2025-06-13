'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';

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
  };
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
  onPageChange: (page: number) => Promise<void>;
  getAudioUrl: (word: WordData) => string;
  getPronunciation: (word: WordData) => string;
  getUserBadge: (addedBy: WordData['addedBy']) => {
    icon: React.ComponentType<any>;
    color: string;
    label: string;
  };
  isAuthenticated: boolean;
  currentUserId?: string;
}

export default function StudyView({
  words,
  pagination,
  onPageChange,
  getAudioUrl,
  getPronunciation,
  getUserBadge,
  isAuthenticated,
  currentUserId,
}: StudyViewProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [studiedWords, setStudiedWords] = useState<Set<string>>(new Set());
  const [playingAudio, setPlayingAudio] = useState(false);

  const currentWord = words[currentWordIndex];
  const progress = ((currentWordIndex + 1) / words.length) * 100;

  useEffect(() => {
    setCurrentWordIndex(0);
    setShowMeaning(false);
    setStudiedWords(new Set());
  }, [words]);

  const playAudio = async () => {
    if (!currentWord) return;
    const audioUrl = getAudioUrl(currentWord);
    if (!audioUrl) return;

    try {
      setPlayingAudio(true);
      const audio = new Audio(audioUrl);

      audio.onended = () => setPlayingAudio(false);
      audio.onerror = () => setPlayingAudio(false);

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(false);
    }
  };

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowMeaning(false);
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setShowMeaning(false);
    }
  };

  const markAsStudied = (known: boolean) => {
    const newStudiedWords = new Set(studiedWords);
    if (known) {
      newStudiedWords.add(currentWord._id);
    } else {
      newStudiedWords.delete(currentWord._id);
    }
    setStudiedWords(newStudiedWords);

    // Auto move to next word after marking
    setTimeout(() => {
      if (currentWordIndex < words.length - 1) {
        nextWord();
      }
    }, 500);
  };

  const resetStudy = () => {
    setCurrentWordIndex(0);
    setShowMeaning(false);
    setStudiedWords(new Set());
  };

  if (!currentWord) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Không có từ nào để học</p>
        </CardContent>
      </Card>
    );
  }

  const userBadge = getUserBadge(currentWord.addedBy);
  const IconComponent = userBadge.icon;
  const isKnown = studiedWords.has(currentWord._id);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card>
        {/* <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Tiến độ học: {currentWordIndex + 1} / {words.length}
            </span>
            <span className="text-sm text-gray-500">Đã học: {studiedWords.size} từ</span>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </CardContent> */}
      </Card>

      {/* Study Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={prevWord}
              disabled={currentWordIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              <span className={`text-sm px-2 py-1 rounded-full ${userBadge.color}`}>
                {userBadge.label}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextWord}
              disabled={currentWordIndex === words.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {/* Word and Pronunciation */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-4xl font-bold text-gray-800">{currentWord.word}</h1>

              <Button
                variant="ghost"
                size="sm"
                onClick={playAudio}
                disabled={playingAudio}
                className="h-10 w-10 p-0"
              >
                {playingAudio ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            <p className="text-lg text-gray-600">{getPronunciation(currentWord)}</p>

            {/* Level and Frequency */}
            <div className="flex justify-center gap-2">
              {currentWord.level && <Badge variant="secondary">{currentWord.level}</Badge>}
              {currentWord.frequency && <Badge variant="outline">{currentWord.frequency}</Badge>}
            </div>
          </div>

          {/* Show/Hide Meaning Button */}
          <Button
            onClick={() => setShowMeaning(!showMeaning)}
            variant="outline"
            size="lg"
            className="w-full max-w-xs"
          >
            {showMeaning ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Ẩn nghĩa
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Hiện nghĩa
              </>
            )}
          </Button>

          {/* Meanings */}
          {showMeaning && (
            <div className="space-y-4 text-left">
              {/* Vietnamese translation */}
              {currentWord.vietnamese && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-orange-700 font-medium">🇻🇳 {currentWord.vietnamese}</p>
                </div>
              )}

              {/* Detailed meanings */}
              <div className="space-y-3">
                {currentWord.meanings.map((meaning, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {meaning.partOfSpeech}
                      </Badge>
                    </div>

                    <p className="text-gray-700 mb-2">{meaning.definition}</p>

                    {meaning.vietnamese && (
                      <p className="text-orange-600 text-sm mb-2">→ {meaning.vietnamese}</p>
                    )}

                    {meaning.examples.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">Ví dụ:</p>
                        {meaning.examples.slice(0, 2).map((example, exIdx) => (
                          <p key={exIdx} className="text-sm text-gray-600 italic">
                            "{example}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Actions */}
          {showMeaning && (
            <div className="flex gap-3 justify-center pt-4">
              <Button
                onClick={() => markAsStudied(false)}
                variant={isKnown ? 'outline' : 'destructive'}
                size="lg"
                className="flex-1 max-w-xs"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Chưa biết
              </Button>

              <Button
                onClick={() => markAsStudied(true)}
                variant={isKnown ? 'default' : 'outline'}
                size="lg"
                className="flex-1 max-w-xs"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Đã biết
              </Button>
            </div>
          )}

          {/* Study completion */}
          {currentWordIndex === words.length - 1 && studiedWords.size > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-700 font-medium mb-2">
                🎉 Hoàn thành! Bạn đã học {studiedWords.size}/{words.length} từ
              </p>
              <Button onClick={resetStudy} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-3 w-3" />
                Học lại
              </Button>
            </div>
          )}

          {/* Word metadata */}
          <div className="text-xs text-gray-400 pt-4 border-t">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Thêm bởi {currentWord.addedBy.userName}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Controls */}
      <div className="flex justify-center gap-2">
        <Button onClick={resetStudy} variant="outline" size="sm">
          <RotateCcw className="mr-2 h-3 w-3" />
          Bắt đầu lại
        </Button>
      </div>
    </div>
  );
}
