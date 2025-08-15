import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔗 미들웨어 요청: ${pathname}`);
  
  // API 경로는 제외
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') ||
      pathname === '/' ||
      pathname === '/dashboard') {
    return NextResponse.next();
  }
  
  // 4-6자리 영숫자 단축 링크 패턴 감지
  const shortCodePattern = /^\/([a-zA-Z0-9]{4,6})$/;
  const match = pathname.match(shortCodePattern);
  
  if (match) {
    const shortCode = match[1];
    console.log(`✅ 미들웨어 매치: ${shortCode} → /api/redirect/${shortCode}`);
    
    // /shortCode를 /api/redirect/shortCode로 rewrite
    const url = request.nextUrl.clone();
    url.pathname = `/api/redirect/${shortCode}`;
    return NextResponse.rewrite(url);
  }
  
  console.log(`❌ 미들웨어 매치 실패: ${pathname}`);
  // 그 외의 경우는 정상 처리
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
