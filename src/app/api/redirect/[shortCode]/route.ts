import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Link from '@/lib/models/Link';

// 로컬 테스트용 - API에서 링크 정보 가져오기

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;

  try {
    console.log(`🔗 리디렉션 요청: ${shortCode} (로컬 인메모리 모드)`);

    // API를 통해 링크 정보 조회
    try {
      const apiUrl = `${request.nextUrl.origin}/api/links`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success && data.data) {
        const link = data.data.find((l: any) => l.shortCode === shortCode);
        
        if (!link) {
          console.log(`⚠️ 알 수 없는 shortCode: ${shortCode}, 홈페이지로 리디렉션`);
          return NextResponse.redirect(`${request.nextUrl.origin}/`, 302);
        }

        console.log(`✅ 링크 발견: ${shortCode} → ${link.originalUrl}`);
        
        // 디바이스 감지
        const userAgent = request.headers.get('user-agent') || '';
        const isIOS = /iPhone|iPad|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isInAppBrowser = /FBAN|FBAV|Instagram|Line|KakaoTalk/.test(userAgent);
        const isMobile = isIOS || isAndroid;
        
        // 스마트 리디렉션 로직
        let redirectUrl = link.originalUrl;
        
        // 딥링크 우선 시도 (인앱 브라우저가 아닌 경우)
        if (!isInAppBrowser && isMobile) {
          if (isIOS && link.iosUrl) {
            redirectUrl = link.iosUrl;
          } else if (isAndroid && link.androidUrl) {
            redirectUrl = link.androidUrl;
          }
        }
        
        // 모바일 디바이스면 모바일 버전으로 변경
        if (isMobile && redirectUrl === link.originalUrl) {
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
        
        // 클릭 분석 로그 (실제 업데이트는 생략 - 로컬 테스트용)
        console.log(`📈 클릭 추적: ${shortCode} - 디바이스: ${isMobile ? 'mobile' : 'desktop'}`);
        
        return NextResponse.redirect(redirectUrl, 302);
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
