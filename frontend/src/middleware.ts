import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // API 요청과 정적 파일들은 그대로 통과
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // shortCode 추출 (경로에서 첫 번째 세그먼트)
  const shortCode = pathname.slice(1) // '/' 제거
  
  console.log('🔗 Middleware 리디렉션:', shortCode)

  // 기본 목업 링크들
  const mockLinks: Record<string, string> = {
    'demo1': 'https://www.coupang.com/example1',
    'demo2': 'https://shopping.naver.com/example2',
    'test123': 'https://example.com'
  }

  let redirectUrl = mockLinks[shortCode]

  // 간단한 매칭 규칙
  if (!redirectUrl && /^[a-z0-9]{6}$/.test(shortCode)) {
    const defaultSites = [
      'https://www.coupang.com',
      'https://shopping.naver.com', 
      'https://www.11st.co.kr'
    ]
    const hash = shortCode.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    redirectUrl = defaultSites[hash % defaultSites.length]
    console.log(`🎲 해시 매핑: ${shortCode} → ${redirectUrl}`)
  }

  // shortCode가 인코딩된 URL인지 확인
  if (!redirectUrl) {
    try {
      const decodedUrl = decodeURIComponent(shortCode)
      if (decodedUrl.startsWith('http')) {
        redirectUrl = decodedUrl
      }
    } catch (e) {
      // 디코딩 실패시 무시
    }
  }

  // 기본 URL로 폴백
  if (!redirectUrl) {
    redirectUrl = 'https://www.coupang.com'
    console.log(`ℹ️ 기본 URL로 리디렉션: ${shortCode}`)
  }

  console.log(`🚀 Middleware 최종 리디렉션: ${shortCode} → ${redirectUrl}`)

  // 리디렉션 실행
  return NextResponse.redirect(redirectUrl, { status: 301 })
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에서 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (homepage)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|$).*)',
  ],
}
