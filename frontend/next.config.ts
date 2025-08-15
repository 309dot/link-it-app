import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',  // 정적 파일 생성 (Railway 통합용)
  trailingSlash: false,
  images: {
    unoptimized: true,  // 정적 export에서 이미지 최적화 비활성화
  },
}

export default nextConfig