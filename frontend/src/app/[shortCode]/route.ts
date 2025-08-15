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

    // 2. 간단한 매칭 규칙 (API 호출 없이)
    if (!redirectUrl) {
      // 알파벳+숫자 조합이면 기본 사이트들로 랜덤 매핑
      if (/^[a-z0-9]{6}$/.test(shortCode)) {
        const defaultSites = [
          'https://www.coupang.com',
          'https://shopping.naver.com', 
          'https://www.11st.co.kr'
        ];
        // shortCode 해시값으로 사이트 선택
        const hash = shortCode.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        redirectUrl = defaultSites[hash % defaultSites.length];
        console.log(`🎲 해시 매핑: ${shortCode} → ${redirectUrl}`);
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