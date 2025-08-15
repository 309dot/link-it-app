import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;

  try {
    console.log(`🔗 리디렉션 요청: ${shortCode}`);

    // 데모 링크 처리 (실제 모바일 친화적 URL)
    const demoLinks: Record<string, string> = {
      'demo1': 'https://m.coupang.com',
      'demo2': 'https://m.shopping.naver.com'
    };

    if (demoLinks[shortCode]) {
      console.log(`✅ 데모 링크 리디렉션: ${shortCode} → ${demoLinks[shortCode]}`);
      return NextResponse.redirect(demoLinks[shortCode], 302);
    }

    // API에서 실제 링크 정보 조회
    try {
      const apiUrl = `${request.nextUrl.origin}/api/links`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success && data.data) {
        const link = data.data.find((l: any) => l.shortCode === shortCode);
        
        if (link) {
          console.log(`✅ 링크 발견: ${shortCode} → ${link.originalUrl}`);
          
          // 디바이스 감지
          const userAgent = request.headers.get('user-agent') || '';
          const isIOS = /iPhone|iPad|iPod/.test(userAgent);
          const isAndroid = /Android/.test(userAgent);
          const isInAppBrowser = /FBAN|FBAV|Instagram|Line|KakaoTalk/.test(userAgent);
          
          // 스마트 리디렉션 로직 (모바일 웹 최적화)
          let redirectUrl = link.originalUrl;
          
          // 모바일 디바이스면 모바일 버전으로 변경
          if (isMobile || isIOS || isAndroid) {
            // 쿠팡 URL을 모바일 버전으로 변경
            if (redirectUrl.includes('coupang.com')) {
              redirectUrl = redirectUrl.replace('www.coupang.com', 'm.coupang.com');
              redirectUrl = redirectUrl.replace('coupang.com', 'm.coupang.com');
            }
            // 네이버쇼핑 URL을 모바일 버전으로 변경  
            else if (redirectUrl.includes('shopping.naver.com')) {
              redirectUrl = redirectUrl.replace('shopping.naver.com', 'm.shopping.naver.com');
            }
          }
          
          console.log(`📱 디바이스 감지: iOS=${isIOS}, Android=${isAndroid}, 최종 URL=${redirectUrl}`);
          
          // 클릭 추적
          try {
            await fetch(`${request.nextUrl.origin}/api/analytics`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shortCode,
                userAgent,
                isIOS,
                isAndroid,
                isInAppBrowser,
                finalUrl: redirectUrl
              })
            });
          } catch (analyticsError) {
            console.warn('클릭 추적 실패:', analyticsError);
          }
          
          return NextResponse.redirect(redirectUrl, 302);
        }
      }
    } catch (apiError) {
      console.warn('API 조회 실패:', apiError);
    }
    
    // 기본 폴백 - 홈페이지로 리디렉션
    console.log(`⚠️ 알 수 없는 shortCode: ${shortCode}, 홈페이지로 리디렉션`);
    return NextResponse.redirect(`${request.nextUrl.origin}/`, 302);

  } catch (error) {
    console.error('리디렉션 에러:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/`, 302);
  }
}
