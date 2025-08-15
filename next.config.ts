import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel 배포용 - API Routes 지원
  trailingSlash: true,
  images: {
    unoptimized: false,  // Vercel에서 이미지 최적화 활성화
  },
  
  // Next.js 내장 rewrites 사용 (vercel.json 대신)
  async rewrites() {
    return [
      {
        source: '/demo1',
        destination: '/api/redirect/demo1',
      },
      {
        source: '/demo2',
        destination: '/api/redirect/demo2',
      },
      {
        source: '/:shortCode(\\w{6})',
        destination: '/api/redirect/:shortCode',
      },
    ]
  },
}

export default nextConfig