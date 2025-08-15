import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel 배포용 - API Routes 지원
  trailingSlash: false,
  images: {
    unoptimized: false,  // Vercel에서 이미지 최적화 활성화
  },
}

export default nextConfig