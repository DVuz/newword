'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, LogIn } from 'lucide-react';

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
    <div className="min-h-screen relative overflow-hidden flex items-end">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1749281277/photo-1462258409682-731445253757_d9mxww.jpg"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>

      {/* User Info Bar - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        {isLoggedIn ? (
          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-white">
                <p className="text-sm font-medium">{userInfo?.name || userInfo?.email || 'User'}</p>
                <p className="text-xs text-white/70">Đã đăng nhập</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/70 hover:text-white text-xs underline underline-offset-2 transition-colors ml-2"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 bg-white/15 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-2 text-white hover:bg-white/25 transition-all duration-300"
          >
            <LogIn className="h-4 w-4" />
            <span className="text-sm font-medium">Đăng nhập</span>
          </button>
        )}
      </div>

      {/* Content - Moved to bottom */}
      <div className="relative z-10 w-full px-4 pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Welcome Message */}
          {isLoggedIn && userInfo && (
            <div className="text-center mb-6">
              <h1 className="text-white text-xl font-bold mb-2">
                Chào mừng trở lại, {userInfo.name || 'User'}! 👋
              </h1>
              <p className="text-white/70 text-sm">Hãy tiếp tục hành trình học tập của bạn</p>
            </div>
          )}

          {!isLoggedIn && (
            <div className="text-center mb-6">
              <h1 className="text-white text-xl font-bold mb-2">Chào mừng đến với NewWord! 📚</h1>
              <p className="text-white/70 text-sm mb-4">
                Đăng nhập để truy cập đầy đủ tính năng học tập
              </p>
              <button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Main Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {mainFeatures.map(feature => {
              const isDisabled = feature.requireAuth && !isLoggedIn;

              return (
                <button
                  key={feature.id}
                  className={`
                    group relative overflow-hidden
                    bg-white/15 backdrop-blur-lg border border-white/20
                    rounded-xl p-4 text-center shadow-xl
                    transition-all duration-300 transform
                    ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/25 hover:scale-105 hover:border-white/40'
                    }
                    ${selectedMode === feature.id ? 'scale-105 bg-white/30 border-white/50' : ''}
                    ${selectedMode !== null && selectedMode !== feature.id ? 'opacity-50' : ''}
                  `}
                  onClick={() => handleNavigation(feature.path, feature.id, feature.requireAuth)}
                  disabled={selectedMode !== null}
                >
                  {/* Gradient background */}
                  <div
                    className={`
                    absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300
                    bg-gradient-to-br ${feature.color}
                  `}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Lock icon for protected features when not logged in */}
                    {isDisabled && (
                      <div className="absolute top-0 right-0 bg-red-500/80 rounded-full p-1">
                        <LogIn className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white mb-2 group-hover:text-yellow-100 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/70 text-xs leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                      {feature.description}
                      {isDisabled && (
                        <span className="block text-red-300 text-xs mt-1">Cần đăng nhập</span>
                      )}
                    </p>

                    {/* Arrow indicator */}
                    <div className="mt-3 flex justify-center">
                      <ArrowRight className="h-3 w-3 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              );
            })}
          </div>

          {/* Grammar Features - Smaller buttons */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {grammarFeatures.map(feature => {
              const isDisabled = feature.requireAuth && !isLoggedIn;

              return (
                <button
                  key={feature.id}
                  className={`
                    group relative overflow-hidden
                    bg-white/10 backdrop-blur-lg border border-white/15
                    rounded-lg p-3 text-center shadow-lg
                    transition-all duration-300 transform
                    ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/20 hover:scale-105 hover:border-white/30'
                    }
                    ${selectedMode === feature.id ? 'scale-105 bg-white/25 border-white/40' : ''}
                    ${selectedMode !== null && selectedMode !== feature.id ? 'opacity-50' : ''}
                  `}
                  onClick={() => handleNavigation(feature.path, feature.id, feature.requireAuth)}
                  disabled={selectedMode !== null}
                >
                  {/* Gradient background */}
                  <div
                    className={`
                    absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-300
                    bg-gradient-to-br ${feature.color}
                  `}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Lock icon for protected features when not logged in */}
                    {isDisabled && (
                      <div className="absolute top-0 right-0 bg-red-500/80 rounded-full p-1">
                        <LogIn className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-xs font-bold text-white mb-1 group-hover:text-yellow-100 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/60 text-xs leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                      {feature.description}
                      {isDisabled && (
                        <span className="block text-red-300 text-xs mt-1">Cần đăng nhập</span>
                      )}
                    </p>

                    {/* Arrow indicator */}
                    <div className="mt-2 flex justify-center">
                      <ArrowRight className="h-2.5 w-2.5 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      {selectedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-lg rounded-xl p-6 text-center shadow-2xl border border-white/20 max-w-xs w-full mx-4">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 text-sm font-medium">
              Đang chuyển đến{' '}
              {[...mainFeatures, ...grammarFeatures].find(f => f.id === selectedMode)?.title}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
