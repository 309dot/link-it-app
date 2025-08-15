import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Link from '@/lib/models/Link';

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

// GET /[shortCode] - 리디렉션 처리
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    await connectDB();
    const { shortCode } = await params;
    
    // 링크 조회
    const link = await Link.findOne({ shortCode });
    
    if (!link) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>링크를 찾을 수 없습니다</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🔍 링크를 찾을 수 없습니다</h1>
            <p>요청하신 단축 링크가 존재하지 않거나 삭제되었습니다.</p>
            <a href="/" style="color: #007bff; text-decoration: none;">🏠 홈으로 돌아가기</a>
          </body>
        </html>`,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }
    
    // User-Agent 분석
    const userAgent = request.headers.get('user-agent') || '';
    const device = detectDevice(userAgent);
    const deviceType = getDeviceType(userAgent);
    
    // 클릭 분석 데이터 업데이트
    const clickData = {
      timestamp: new Date(),
      deviceType,
      browserType: device.browserType,
      isInApp: device.isInApp,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
    };
    
    // 분석 데이터 업데이트 (비동기로 처리하여 리디렉션 속도 향상)
    Promise.resolve().then(async () => {
      try {
        await Link.findByIdAndUpdate(link._id, {
          $inc: {
            'analytics.totalClicks': 1,
            [`analytics.clicksByDevice.${deviceType}`]: 1,
            [`analytics.clicksByBrowser.${device.browserType}`]: 1
          },
          $push: {
            'analytics.recentClicks': {
              $each: [clickData],
              $slice: -100 // 최근 100개만 보관
            }
          }
        });
        
        console.log(`🚀 리디렉션 - ${shortCode} → ${link.originalUrl}`, {
          platform: link.platform,
          deviceType,
          isInApp: device.isInApp
        });
        
      } catch (updateError) {
        console.error('분석 데이터 업데이트 오류:', updateError);
      }
    });
    
    // 리디렉션 URL 결정
    let redirectUrl = link.originalUrl;
    
    // 인앱 브라우저에서는 항상 웹 URL 사용 (딥링크가 제대로 작동하지 않을 수 있음)
    if (device.isInApp) {
      redirectUrl = link.originalUrl;
    }
    // iOS 디바이스이고 iOS 딥링크가 있는 경우
    else if (device.isIOS && link.iosUrl) {
      redirectUrl = link.iosUrl;
    }
    // Android 디바이스이고 Android 딥링크가 있는 경우
    else if (device.isAndroid && link.androidUrl) {
      redirectUrl = link.androidUrl;
    }
    
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
