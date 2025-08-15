import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',  // 정적 파일 생성
  trailingSlash: true,
  images: {
    unoptimized: true,  // 정적 export에서 이미지 최적화 비활성화
  },
  // basePath를 제거하여 Railway에서 루트 경로로 서빙
}

export default nextConfig