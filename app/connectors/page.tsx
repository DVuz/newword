'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ConnectorItem {
  word: string;
  meaning: string;
  examples: string[];
  usage?: string;
}

interface ConnectorGroup {
  id: string;
  title: string;
  description: string;
  connectors: ConnectorItem[];
}

const CONNECTOR_GROUPS: ConnectorGroup[] = [
  {
    id: 'contrast',
    title: '1. Chỉ sự tương phản (Contrast)',
    description: 'Từ nối diễn tả sự đối lập, trái ngược giữa các ý',
    connectors: [
      {
        word: 'However',
        meaning: 'tuy nhiên',
        examples: [
          'The weather was terrible. However, we still went hiking.',
          "She studied hard. However, she didn't pass the exam.",
        ],
      },
      {
        word: 'Although / Though / Even though',
        meaning: 'mặc dù',
        examples: [
          'Although it was raining, we went for a walk.',
          'Though he was tired, he continued working.',
          'Even though she was busy, she helped us.',
        ],
      },
      {
        word: 'Nevertheless / Nonetheless',
        meaning: 'tuy nhiên, dẫu vậy',
        examples: [
          'The task was difficult. Nevertheless, he completed it on time.',
          'It was expensive. Nonetheless, she bought it.',
        ],
      },
      {
        word: 'On the other hand',
        meaning: 'mặt khác',
        examples: [
          'Living in the city is convenient. On the other hand, it can be very noisy.',
          'The job pays well. On the other hand, it requires long hours.',
        ],
      },
      {
        word: 'In contrast',
        meaning: 'trái lại',
        examples: [
          'Summer is hot and humid. In contrast, winter is cold and dry.',
          'The first method is simple. In contrast, the second one is quite complex.',
        ],
      },
      {
        word: 'Whereas',
        meaning: 'trong khi đó (so sánh 2 vế đối lập)',
        examples: [
          'John is tall, whereas his brother is short.',
          'She loves reading, whereas he prefers watching movies.',
        ],
      },
      {
        word: 'While',
        meaning: 'trong khi',
        examples: [
          'While I was cooking, he was watching TV.',
          'While the idea is good, the execution is poor.',
        ],
      },
      {
        word: 'But',
        meaning: 'nhưng',
        examples: [
          'I wanted to go, but I was too busy.',
          'The restaurant is expensive, but the food is excellent.',
        ],
      },
    ],
  },
  {
    id: 'cause-effect',
    title: '2. Chỉ nguyên nhân - kết quả (Cause & Effect)',
    description: 'Từ nối chỉ mối quan hệ nguyên nhân và kết quả',
    connectors: [
      {
        word: 'Because / Since / As',
        meaning: 'bởi vì',
        examples: [
          'We stayed home because it was raining.',
          "Since you're here, let's start the meeting.",
          'As it was getting late, we decided to leave.',
        ],
      },
      {
        word: 'Therefore',
        meaning: 'vì vậy',
        examples: [
          'It was raining heavily. Therefore, the match was postponed.',
          'She studied hard. Therefore, she passed the exam with flying colors.',
        ],
      },
      {
        word: 'Thus / Hence',
        meaning: 'do đó',
        examples: [
          'The evidence was insufficient. Thus, the case was dismissed.',
          'The demand is high. Hence, the price has increased.',
        ],
      },
      {
        word: 'Consequently',
        meaning: 'kết quả là',
        examples: [
          'The company made poor decisions. Consequently, it went bankrupt.',
          "He didn't follow the instructions. Consequently, the machine broke down.",
        ],
      },
      {
        word: 'As a result',
        meaning: 'kết quả là',
        examples: [
          'The traffic was terrible. As a result, we were late for the meeting.',
          'She worked overtime every day. As a result, she became exhausted.',
        ],
      },
      {
        word: 'Due to / Owing to',
        meaning: 'bởi vì (dùng với danh từ)',
        usage: 'Theo sau bởi danh từ hoặc V-ing',
        examples: [
          'The flight was cancelled due to bad weather.',
          'Owing to his hard work, he got promoted.',
        ],
      },
    ],
  },
  {
    id: 'addition',
    title: '3. Chỉ sự bổ sung (Addition)',
    description: 'Từ nối thêm thông tin, ý tưởng vào câu trước',
    connectors: [
      {
        word: 'And',
        meaning: 'và',
        examples: ['I like tea and coffee.', 'She is smart and hardworking.'],
      },
      {
        word: 'Also',
        meaning: 'cũng',
        examples: [
          'He speaks English. He also speaks French.',
          "The hotel is comfortable. It's also affordable.",
        ],
      },
      {
        word: 'Moreover',
        meaning: 'hơn nữa',
        examples: [
          'The hotel is centrally located. Moreover, it offers free breakfast.',
          "He's an excellent student. Moreover, he's also a talented athlete.",
        ],
      },
      {
        word: 'Furthermore',
        meaning: 'hơn nữa',
        examples: [
          'The product is affordable. Furthermore, it comes with a warranty.',
          "She speaks three languages. Furthermore, she's learning a fourth one.",
        ],
      },
      {
        word: 'In addition / Additionally',
        meaning: 'ngoài ra',
        examples: [
          'The course covers grammar. In addition, it includes conversation practice.',
          'We need to reduce costs. Additionally, we should improve efficiency.',
        ],
      },
      {
        word: 'Not only... but also...',
        meaning: 'không chỉ... mà còn...',
        examples: [
          'She is not only beautiful but also intelligent.',
          'The book is not only informative but also entertaining.',
        ],
      },
    ],
  },
  {
    id: 'purpose',
    title: '4. Chỉ mục đích (Purpose)',
    description: 'Từ nối thể hiện mục đích, ý định',
    connectors: [
      {
        word: 'So that',
        meaning: 'để mà',
        examples: [
          'I study hard so that I can pass the exam.',
          "She speaks quietly so that she won't wake the baby.",
        ],
      },
      {
        word: 'In order to / So as to',
        meaning: 'để làm gì',
        examples: [
          'I wake up early in order to catch the bus.',
          'He worked overtime so as to complete the project.',
        ],
      },
      {
        word: 'For the purpose of',
        meaning: 'với mục đích',
        examples: [
          'The meeting was organized for the purpose of discussing the budget.',
          'This tool is designed for the purpose of data analysis.',
        ],
      },
      {
        word: 'With a view to / With the aim of',
        meaning: 'nhằm mục đích',
        examples: [
          'The company expanded with a view to increasing profits.',
          'The course was designed with the aim of improving communication skills.',
        ],
      },
    ],
  },
  {
    id: 'comparison',
    title: '5. So sánh (Comparison)',
    description: 'Từ nối thể hiện sự so sánh, tương đồng',
    connectors: [
      {
        word: 'Similarly',
        meaning: 'tương tự',
        examples: [
          'John works hard. Similarly, his brother is also dedicated.',
          "The first experiment failed. Similarly, the second one also didn't work.",
        ],
      },
      {
        word: 'Likewise',
        meaning: 'cũng vậy',
        examples: [
          'She enjoys reading. Likewise, her sister loves books.',
          'The company focuses on quality. Likewise, they emphasize customer service.',
        ],
      },
      {
        word: 'In the same way',
        meaning: 'theo cách tương tự',
        examples: [
          'Children learn by imitation. In the same way, adults can learn from observation.',
          'Technology has changed communication. In the same way, it has transformed education.',
        ],
      },
      {
        word: 'By comparison / In comparison',
        meaning: 'khi so sánh',
        examples: [
          'The first car is expensive. By comparison, the second one is quite affordable.',
          'In comparison to last year, sales have increased significantly.',
        ],
      },
    ],
  },
  {
    id: 'sequence',
    title: '6. Chỉ trình tự, thời gian (Order/Time)',
    description: 'Từ nối sắp xếp thứ tự các ý tưởng hoặc sự kiện',
    connectors: [
      {
        word: 'First / Firstly',
        meaning: 'đầu tiên, thứ nhất',
        examples: [
          'First, we need to identify the problem.',
          'Firstly, let me explain the background of this issue.',
        ],
      },
      {
        word: 'Second / Secondly',
        meaning: 'thứ hai',
        examples: [
          'Second, we should analyze the data.',
          'Secondly, we need to consider the costs involved.',
        ],
      },
      {
        word: 'Then / After that',
        meaning: 'sau đó',
        examples: [
          'First, mix the ingredients. Then, bake for 30 minutes.',
          'We finished the presentation. After that, we answered questions.',
        ],
      },
      {
        word: 'Eventually / Finally',
        meaning: 'cuối cùng',
        examples: [
          'Eventually, we found the solution.',
          'Finally, I would like to thank everyone for their support.',
        ],
      },
      {
        word: 'Meanwhile',
        meaning: 'trong lúc đó',
        examples: [
          'She was cooking dinner. Meanwhile, he was helping the kids with homework.',
          'The team was preparing for the presentation. Meanwhile, the client was reviewing the proposal.',
        ],
      },
      {
        word: 'At the same time',
        meaning: 'đồng thời',
        examples: [
          'She was working and studying at the same time.',
          'The company is expanding while reducing costs at the same time.',
        ],
      },
      {
        word: 'Before / After / When / While',
        meaning: 'trước/sau/khi...',
        examples: [
          'Before you leave, please turn off the lights.',
          'After the meeting, we went for lunch.',
          'When it rains, the roads become slippery.',
          'While I was reading, the phone rang.',
        ],
      },
    ],
  },
  {
    id: 'emphasis',
    title: '7. Nhấn mạnh (Emphasis)',
    description: 'Từ nối nhấn mạnh, làm nổi bật ý quan trọng',
    connectors: [
      {
        word: 'Indeed',
        meaning: 'thực vậy',
        examples: [
          'The task was challenging. Indeed, it was the most difficult one yet.',
          "She is talented. Indeed, she's one of the best in her field.",
        ],
      },
      {
        word: 'In fact',
        meaning: 'thực tế là',
        examples: [
          'I thought the movie was good. In fact, it was excellent.',
          "The problem is not minor. In fact, it's quite serious.",
        ],
      },
      {
        word: 'Especially / Particularly',
        meaning: 'đặc biệt là',
        examples: [
          'I love all fruits, especially apples.',
          'The weather was beautiful, particularly in the morning.',
        ],
      },
      {
        word: 'Above all',
        meaning: 'trên hết',
        examples: [
          'She has many qualities, but above all, she is honest.',
          'The company values many things, but above all, customer satisfaction.',
        ],
      },
    ],
  },
  {
    id: 'conclusion',
    title: '8. Tóm tắt / Kết luận (Summary / Conclusion)',
    description: 'Từ nối tóm tắt hoặc đưa ra kết luận',
    connectors: [
      {
        word: 'In conclusion / To conclude',
        meaning: 'để kết luận',
        examples: [
          'In conclusion, the project was a great success.',
          'To conclude, we recommend implementing the new system immediately.',
        ],
      },
      {
        word: 'To sum up / In summary',
        meaning: 'tóm lại',
        examples: [
          'To sum up, there are three main benefits of this approach.',
          'In summary, the research shows that exercise improves mental health.',
        ],
      },
      {
        word: 'All in all',
        meaning: 'nhìn chung',
        examples: [
          'All in all, it was a memorable experience.',
          'All in all, the team performed well despite the challenges.',
        ],
      },
      {
        word: 'Overall',
        meaning: 'tổng thể',
        examples: [
          'Overall, the conference was well-organized and informative.',
          'Overall, I think the proposal has merit and should be considered.',
        ],
      },
    ],
  },
];

export default function ConnectorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const [showExamples, setShowExamples] = useState<Record<string, boolean>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Check admin authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }

        // Decode JWT to check role
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin') {
          router.push('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Filter groups based on search term
  const filteredGroups = CONNECTOR_GROUPS.map(group => ({
    ...group,
    connectors: group.connectors.filter(
      connector =>
        connector.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connector.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connector.examples.some(example => example.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  })).filter(group => group.connectors.length > 0);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleExamples = (key: string) => {
    setShowExamples(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">Đang xác thực quyền admin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Quay lại</span>
              </button>

              <div className="h-8 w-px bg-gray-300"></div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Từ Nối Câu
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  </h1>
                  <p className="text-gray-600 text-sm">Bộ sưu tập từ nối tiếng Anh chuyên nghiệp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Stats */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Tìm kiếm từ nối..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-4 text-gray-600 text-sm bg-white rounded-lg px-4 py-3 border shadow-sm">
            <span className="font-medium">
              {filteredGroups.reduce((acc, group) => acc + group.connectors.length, 0)} từ nối
            </span>
            <span>•</span>
            <span className="font-medium">{filteredGroups.length} nhóm</span>
            <span>•</span>
            <button
              onClick={() => {
                const newState = !allExpanded;
                setAllExpanded(newState);
                setExpandedGroups(newState ? CONNECTOR_GROUPS.map(g => g.id) : []);
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
            </button>
          </div>
        </div>

        {/* Connector Groups */}
        <div className="space-y-6">
          {filteredGroups.map(group => {
            const isExpanded = expandedGroups.includes(group.id);
            const visibleConnectors = isExpanded ? group.connectors : group.connectors.slice(0, 3);

            return (
              <Card
                key={group.id}
                className="bg-white border shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors py-5"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                        w-4 h-4 rounded-full
                        ${
                          group.id === 'contrast'
                            ? 'bg-red-500'
                            : group.id === 'cause-effect'
                            ? 'bg-blue-500'
                            : group.id === 'addition'
                            ? 'bg-green-500'
                            : group.id === 'purpose'
                            ? 'bg-purple-500'
                            : group.id === 'comparison'
                            ? 'bg-orange-500'
                            : group.id === 'sequence'
                            ? 'bg-indigo-500'
                            : group.id === 'emphasis'
                            ? 'bg-pink-500'
                            : 'bg-gray-500'
                        }
                      `}
                      ></div>
                      <div>
                        <CardTitle className="text-gray-900 text-lg font-bold">
                          {group.title}
                        </CardTitle>
                        <p className="text-gray-600 text-sm mt-1">{group.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
                        {group.connectors.length} từ
                      </Badge>
                      <div className="flex items-center text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {visibleConnectors.map((connector, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-base mb-1">
                              {connector.word}
                            </h4>
                            <p className="text-blue-600 text-sm italic font-medium">
                              {connector.meaning}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(connector.word, `${connector.word}-${index}`)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-200 rounded-lg"
                          >
                            {copiedStates[`${connector.word}-${index}`] ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>

                        {connector.usage && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1 font-medium">Cách dùng:</p>
                            <p className="text-xs text-gray-700 bg-blue-50 rounded px-2 py-1 border border-blue-100">
                              {connector.usage}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-medium">Ví dụ:</p>
                            <button
                              onClick={() => toggleExamples(`${group.id}-${index}`)}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-200"
                            >
                              {showExamples[`${group.id}-${index}`] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          {showExamples[`${group.id}-${index}`] && (
                            <div className="space-y-2">
                              {connector.examples.map((example, exampleIndex) => (
                                <div
                                  key={exampleIndex}
                                  className="text-xs text-gray-700 bg-blue-50 rounded px-3 py-2 border-l-4 border-blue-300"
                                >
                                  {example}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show more button */}
                  {group.connectors.length > 3 && !isExpanded && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100"
                      >
                        Xem thêm {group.connectors.length - 3} từ nối khác
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No results */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-gray-900 text-xl font-bold mb-3">Không tìm thấy kết quả</h3>
            <p className="text-gray-600 text-base">Thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>
    </div>
  );
}
