import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  // 빌드 에러 방지
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Vercel 배포 최적화
  
  // Rewrites for shortCode redirection
  async rewrites() {
    return [
      {
        source: '/:shortCode',
        destination: '/api/redirect/:shortCode',
        // API, _next, dashboard 등은 제외
        missing: [
          { type: 'header', key: 'next-router-prefetch' },
        ]
      }
    ]
  },
};

export default nextConfig;
