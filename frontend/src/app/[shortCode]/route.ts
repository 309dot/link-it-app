import { NextRequest, NextResponse } from 'next/server';

// GET /[shortCode] - 서버사이드 리디렉션 처리
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    console.log('🔗 서버사이드 리디렉션 요청:', shortCode);

    // 1. 기본 목업 링크들
    const mockLinks: Record<string, string> = {
      'demo1': 'https://www.coupang.com/example1',
      'demo2': 'https://shopping.naver.com/example2',
      'test123': 'https://example.com'
    };

    let redirectUrl = mockLinks[shortCode];

    // 2. API에서 생성된 링크 확인
    if (!redirectUrl) {
      try {
        const apiUrl = new URL('/api/links', request.url);
        const response = await fetch(apiUrl.toString());
        const data = await response.json();
        
        if (data.success && data.data) {
          const foundLink = data.data.find((link: any) => link.shortCode === shortCode);
          if (foundLink) {
            redirectUrl = foundLink.originalUrl;
            console.log(`📋 API에서 링크 발견: ${shortCode} → ${redirectUrl}`);
          }
        }
      } catch (e) {
        console.warn('API 호출 실패:', e);
      }
    }

    // 3. shortCode가 인코딩된 URL인지 확인
    if (!redirectUrl) {
      try {
        const decodedUrl = decodeURIComponent(shortCode);
        if (decodedUrl.startsWith('http')) {
          redirectUrl = decodedUrl;
        }
      } catch (e) {
        // 디코딩 실패시 무시
      }
    }

    // 4. 기본 URL로 폴백
    if (!redirectUrl) {
      redirectUrl = 'https://www.coupang.com';
      console.log(`ℹ️ 기본 URL로 리디렉션: ${shortCode}`);
    }

    console.log(`🚀 최종 리디렉션: ${shortCode} → ${redirectUrl}`);

    // 즉시 리디렉션 (301 Permanent Redirect)
    return NextResponse.redirect(redirectUrl, { status: 301 });
    
  } catch (error) {
    console.error('리디렉션 오류:', error);
    
    // 에러시 기본 사이트로 리디렉션
    return NextResponse.redirect('https://www.coupang.com', { status: 302 });
  }
}