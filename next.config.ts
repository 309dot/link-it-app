import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel 배포용 - API Routes 지원
  trailingSlash: true,
  images: {
    unoptimized: false,  // Vercel에서 이미지 최적화 활성화
  },
  
  // 미들웨어 방식으로 변경하여 rewrites 제거
}

export default nextConfig