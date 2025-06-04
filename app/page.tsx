'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const router = useRouter();

  const mainFeatures = [
    {
      id: 'dictionary',
      title: 'Nhập Từ Điển',
      description: 'Tìm kiếm và thêm từ vựng mới',
      color: 'from-blue-500 to-blue-600',
      path: '/create-new-word',
    },
    {
      id: 'review',
      title: 'Xem Từ Vựng',
      description: 'Xem lại danh sách từ đã học',
      color: 'from-green-500 to-green-600',
      path: '/word-list',
    },
  ];

  const handleNavigation = (path: string, featureId: string) => {
    setSelectedMode(featureId);
    setTimeout(() => {
      router.push(path);
    }, 500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
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
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-96">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          {mainFeatures.map(feature => (
            <button
              key={feature.id}
              className={`
                bg-white/15 backdrop-blur-lg border border-white/30
                rounded-xl p-6 text-center shadow-xl
                hover:bg-white/25 hover:scale-105
                transition-all duration-300
                ${selectedMode === feature.id ? 'scale-105 bg-white/25' : ''}
              `}
              onClick={() => handleNavigation(feature.path, feature.id)}
            >
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/80 text-sm">{feature.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Loading Animation */}
      {selectedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-700 text-sm">Đang chuyển trang...</p>
          </div>
        </div>
      )}
    </div>
  );
}
