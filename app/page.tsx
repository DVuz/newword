'use client';
import { ArrowRight, Crown, LogIn, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = checking
  const [userInfo, setUserInfo] = useState<any>(null);
  const router = useRouter();

  // Check login status on component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const userDataString = localStorage.getItem('userData');

        if (authToken && userDataString) {
          const userData = JSON.parse(userDataString);
          setUserInfo(userData);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  const mainFeatures = [
    {
      id: 'dictionary',
      title: 'Nhập Từ Điển',
      description: 'Tìm kiếm và thêm từ vựng mới với AI',
      color: 'from-blue-500 to-blue-600',
      path: '/create-new-word',
      requireAuth: true,
    },
    {
      id: 'programming-terms',
      title: 'Programming Terms',
      description: 'Thêm thuật ngữ lập trình với Gemini AI',
      color: 'from-purple-500 to-purple-600',
      path: '/create-terms',
      requireAuth: true,
    },
    {
      id: 'word-list',
      title: 'Từ Vựng Tiếng Anh',
      description: 'Xem danh sách từ vựng đã học',
      color: 'from-green-500 to-green-600',
      path: '/word-list',
      requireAuth: true,
    },
    {
      id: 'terms-list',
      title: 'Terms Library',
      description: 'Thư viện thuật ngữ lập trình',
      color: 'from-indigo-500 to-indigo-600',
      path: '/terms-list',
      requireAuth: true,
    },
    // ✅ Admin Only Feature - Connectors
    ...(userInfo?.role === 'admin'
      ? [
          {
            id: 'connectors',
            title: 'Từ Nối Câu',
            description: 'Tài liệu từ nối câu chuyên nghiệp (Admin Only)',
            color: 'from-purple-600 to-indigo-700',
            path: '/connectors',
            requireAuth: true,
            adminOnly: true,
          },
        ]
      : []),
  ];

  // Grammar features - smaller buttons
  const grammarFeatures = [
    {
      id: 'create-grammar',
      title: 'Tạo Grammar',
      description: 'Phân tích cấu trúc ngữ pháp với AI',
      color: 'from-orange-500 to-orange-600',
      path: '/grammar',
      requireAuth: true,
    },
    {
      id: 'grammar-list',
      title: 'Grammar Library',
      description: 'Xem thư viện ngữ pháp',
      color: 'from-pink-500 to-pink-600',
      path: '/grammar-list',
      requireAuth: true,
    },
  ];

  const handleNavigation = (path: string, featureId: string, requireAuth: boolean = false) => {
    // Check if feature requires authentication
    if (requireAuth && !isLoggedIn) {
      // Redirect to login page
      router.push('/login');
      return;
    }

    setSelectedMode(featureId);
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setIsLoggedIn(false);
      setUserInfo(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Show loading spinner while checking login status
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* User Info Bar - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        {isLoggedIn ? (
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {userInfo?.role === 'admin' ? (
                  <Crown className="h-4 w-4 text-yellow-300" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="text-white">
                <p className="text-sm font-medium">{userInfo?.name || userInfo?.email || 'User'}</p>
                <p className="text-xs text-white/70">
                  {userInfo?.role === 'admin' ? 'Admin' : 'Member'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-white/10 transition-all"
            >
              Thoát
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white hover:bg-white/20 transition-all shadow-lg"
          >
            <LogIn className="h-4 w-4" />
            <span className="text-sm font-medium">Đăng nhập</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
                NewWord
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
            </div>

            {isLoggedIn && userInfo ? (
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl text-white/90 flex items-center justify-center gap-2">
                  Xin chào,{' '}
                  <span className="font-semibold text-blue-300">{userInfo.name || 'User'}</span>!
                  {userInfo?.role === 'admin' && (
                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 rounded-full">
                      <Crown className="h-4 w-4 text-white" />
                      <span className="text-white text-sm font-medium">Admin</span>
                    </div>
                  )}
                </h2>
                <p className="text-white/70">
                  {userInfo?.role === 'admin'
                    ? 'Chào mừng quản trị viên! Bạn có thể truy cập tất cả tính năng đặc biệt.'
                    : 'Sẵn sàng học tập và khám phá ngôn ngữ mới!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl text-white/90">
                  Ứng dụng học từ vựng thông minh với AI
                </h2>
                <p className="text-white/70 max-w-2xl mx-auto">
                  Khám phá và học từ vựng tiếng Anh, thuật ngữ lập trình với sự hỗ trợ của AI
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <LogIn className="h-5 w-5" />
                  Bắt đầu ngay
                </button>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {mainFeatures.map(feature => {
              const isDisabled = feature.requireAuth && !isLoggedIn;

              return (
                <div
                  key={feature.id}
                  className={`
                    group relative overflow-hidden
                    bg-white/5 backdrop-blur-md border border-white/10
                    rounded-2xl p-6 shadow-lg hover:shadow-xl
                    transition-all duration-300 transform
                    ${
                      isDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:bg-white/10 hover:scale-[1.02] hover:border-white/20 cursor-pointer'
                    }
                    ${selectedMode === feature.id ? 'scale-[1.02] bg-white/15 border-white/30' : ''}
                  `}
                  onClick={() =>
                    !isDisabled && handleNavigation(feature.path, feature.id, feature.requireAuth)
                  }
                >
                  {/* Gradient background */}
                  <div
                    className={`
                      absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300
                      bg-gradient-to-br ${feature.color}
                    `}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Top badges */}
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        bg-gradient-to-br ${feature.color} shadow-lg
                      `}
                      >
                        {feature.adminOnly ? (
                          <Crown className="h-6 w-6 text-white" />
                        ) : (
                          <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                        )}
                      </div>

                      {feature.adminOnly && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 rounded-full">
                          <span className="text-white text-xs font-bold">ADMIN</span>
                        </div>
                      )}

                      {isDisabled && (
                        <div className="bg-red-500/80 px-2 py-1 rounded-full">
                          <LogIn className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                      {feature.description}
                    </p>

                    {isDisabled && (
                      <p className="text-red-300 text-xs mt-2 font-medium">
                        Cần đăng nhập để sử dụng
                      </p>
                    )}

                    {/* Arrow */}
                    <div className="mt-4 flex justify-end">
                      <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grammar Features - Compact row */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-white/90 mb-4 text-center">Ngữ pháp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grammarFeatures.map(feature => {
                const isDisabled = feature.requireAuth && !isLoggedIn;

                return (
                  <div
                    key={feature.id}
                    className={`
                      group relative overflow-hidden
                      bg-white/5 backdrop-blur-md border border-white/10
                      rounded-xl p-4 shadow-lg
                      transition-all duration-300 transform
                      ${
                        isDisabled
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:bg-white/10 hover:scale-[1.02] hover:border-white/20 cursor-pointer'
                      }
                    `}
                    onClick={() =>
                      !isDisabled && handleNavigation(feature.path, feature.id, feature.requireAuth)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                          w-8 h-8 rounded-lg flex items-center justify-center
                          bg-gradient-to-br ${feature.color}
                        `}
                        >
                          <div className="w-4 h-4 bg-white/30 rounded-full"></div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-blue-200 transition-colors">
                            {feature.title}
                          </h4>
                          <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {isDisabled ? (
                        <LogIn className="h-4 w-4 text-red-400" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      {selectedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl border border-white/20 max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold mb-2">Đang tải...</p>
            <p className="text-gray-500 text-sm">
              {[...mainFeatures, ...grammarFeatures].find(f => f.id === selectedMode)?.title}
            </p>
          </div>
        </div>
      )}

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
