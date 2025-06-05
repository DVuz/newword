'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Code2, List, Database, ArrowRight } from 'lucide-react';

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const router = useRouter();

  const mainFeatures = [
    {
      id: 'dictionary',
      title: 'Nhập Từ Điển',
      description: 'Tìm kiếm và thêm từ vựng mới với AI',
      color: 'from-blue-500 to-blue-600',
      icon: BookOpen,
      path: '/create-new-word',
    },
    {
      id: 'programming-terms',
      title: 'Programming Terms',
      description: 'Thêm thuật ngữ lập trình với Gemini AI',
      color: 'from-purple-500 to-purple-600',
      icon: Code2,
      path: '/create-terms',
    },
    {
      id: 'word-list',
      title: 'Từ Vựng Tiếng Anh',
      description: 'Xem danh sách từ vựng đã học',
      color: 'from-green-500 to-green-600',
      icon: List,
      path: '/word-list',
    },
    {
      id: 'terms-list',
      title: 'Terms Library',
      description: 'Thư viện thuật ngữ lập trình',
      color: 'from-indigo-500 to-indigo-600',
      icon: Database,
      path: '/terms-list',
    },
  ];

  const handleNavigation = (path: string, featureId: string) => {
    setSelectedMode(featureId);
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-end">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dfizo8h6h/image/upload/v1749027208/duong_2_qdyrb1.jpg"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>

      {/* Content - Moved to bottom */}
      <div className="relative z-10 w-full px-4 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {mainFeatures.map(feature => {
            const IconComponent = feature.icon;
            return (
              <button
                key={feature.id}
                className={`
                  group relative overflow-hidden
                  bg-white/15 backdrop-blur-lg border border-white/20
                  rounded-xl p-4 text-center shadow-xl
                  hover:bg-white/25 hover:scale-105 hover:border-white/40
                  transition-all duration-300 transform
                  ${selectedMode === feature.id ? 'scale-105 bg-white/30 border-white/50' : ''}
                  ${selectedMode !== null && selectedMode !== feature.id ? 'opacity-50' : ''}
                `}
                onClick={() => handleNavigation(feature.path, feature.id)}
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
                  {/* Icon */}
                  <div className="flex justify-center mb-3">
                    <div
                      className={`
                      p-3 rounded-lg bg-gradient-to-br ${feature.color}
                      shadow-lg group-hover:scale-110 transition-transform duration-300
                    `}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-yellow-100 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/70 text-xs leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                    {feature.description}
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
      </div>

      {/* Loading Animation */}
      {selectedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-lg rounded-xl p-6 text-center shadow-2xl border border-white/20 max-w-xs w-full mx-4">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 text-sm font-medium">
              Đang chuyển đến {mainFeatures.find(f => f.id === selectedMode)?.title}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
