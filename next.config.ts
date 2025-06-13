import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ✅ Cho phép TẤT CẢ nguồn fetch đến app này
  async headers() {
    return [
      {
        // Áp dụng cho TẤT CẢ routes
        source: '/(.*)',
        headers: [
          // ✅ Cho phép TẤT CẢ origin
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          // ✅ Cho phép TẤT CẢ HTTP methods
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
          },
          // ✅ Cho phép TẤT CẢ headers
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          // ✅ Cho phép credentials (cookies, auth headers)
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // ✅ Cache preflight response trong 24h
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
          // ✅ Expose headers cho client
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Content-Length, X-JSON',
          },
        ],
      },
      {
        // Riêng cho API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
