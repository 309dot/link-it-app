import { NextRequest, NextResponse } from 'next/server';

// 디바이스 감지 함수
function detectDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  return {
    isIOS: /iphone|ipad|ipod/.test(ua),
    isAndroid: /android/.test(ua),
    isMobile: /mobile/.test(ua),
    isTablet: /tablet|ipad/.test(ua),
    isInApp: /fban|fbav|instagram|line|kakaotalk|wechat/.test(ua),
    browserType: getBrowserType(ua)
  };
}

function getBrowserType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('edg')) return 'edge';
  
  return 'other';
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile/.test(ua)) return 'mobile';
  
  return 'desktop';
}

// GET /[shortCode] - 리디렉션 처리 (목업 모드)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    console.log('🔗 리디렉션 요청:', shortCode);
    
    // 목업 링크 데이터 (간단한 매핑)
    const mockLinks: Record<string, string> = {
      'demo1': 'https://www.coupang.com/example1',
      'demo2': 'https://shopping.naver.com/example2',
      'test123': 'https://example.com'
    };
    
    // shortCode로 URL 찾기 (목업 데이터에서)
    let redirectUrl = mockLinks[shortCode];
    
    // 목업에 없으면 기본 동작: shortCode가 URL 형태인지 확인
    if (!redirectUrl) {
      // 만약 shortCode가 실제로는 인코딩된 URL이라면
      try {
        const decodedUrl = decodeURIComponent(shortCode);
        if (decodedUrl.startsWith('http')) {
          redirectUrl = decodedUrl;
        }
      } catch (e) {
        // 디코딩 실패시 무시
      }
    }
    
    // 여전히 URL을 찾지 못했으면 기본 데모 사이트로
    if (!redirectUrl) {
      redirectUrl = 'https://www.coupang.com'; // 기본 리디렉션
      console.log(`ℹ️ 알 수 없는 shortCode: ${shortCode}, 기본 URL로 리디렉션`);
    }
    
    // User-Agent 분석
    const userAgent = request.headers.get('user-agent') || '';
    const device = detectDevice(userAgent);
    
    console.log(`🚀 목업 리디렉션 - ${shortCode} → ${redirectUrl}`, {
      deviceType: getDeviceType(userAgent),
      isInApp: device.isInApp
    });
    
    // 리디렉션 응답 (HTML 방식으로 더 안정적인 리디렉션)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>링크 이동 중...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="0; url=${redirectUrl}">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>🔗 링크로 이동 중입니다...</h2>
          <p>자동으로 이동되지 않으면 <a href="${redirectUrl}" style="color: #007bff;">여기를 클릭</a>하세요.</p>
          <script>
            // JavaScript 리디렉션 (백업용)
            setTimeout(function() {
              window.location.href = "${redirectUrl}";
            }, 100);
          </script>
        </body>
      </html>`,
      { 
        status: 200,
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
    
  } catch (error) {
    console.error('리디렉션 오류:', error);
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>오류 발생</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>⚠️ 오류가 발생했습니다</h1>
          <p>일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요.</p>
          <a href="/" style="color: #007bff; text-decoration: none;">🏠 홈으로 돌아가기</a>
        </body>
      </html>`,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}
