import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;

  try {
    console.log(`🔗 리디렉션 요청: ${shortCode}`);

    // 데모 링크 처리
    const demoLinks: Record<string, string> = {
      'demo1': 'https://www.coupang.com',
      'demo2': 'https://shopping.naver.com'
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
          
          // 스마트 리디렉션 로직
          let redirectUrl = link.originalUrl;
          
          if (isInAppBrowser) {
            // 인앱 브라우저에서는 웹 URL 사용
            redirectUrl = link.originalUrl;
          } else if (isIOS && link.iosUrl) {
            // iOS 앱 딥링크
            redirectUrl = link.iosUrl;
          } else if (isAndroid && link.androidUrl) {
            // Android 앱 딥링크  
            redirectUrl = link.androidUrl;
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
