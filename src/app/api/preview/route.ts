import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL이 필요합니다.' 
      }, { status: 400 });
    }

    // 간단한 URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: '유효하지 않은 URL입니다.' 
      }, { status: 400 });
    }

    // 특정 도메인에 대한 스킵 처리
    const domain = new URL(url).hostname;
    const skipDomains = ['coupang.com', 'naver.com', '11st.co.kr', 'gmarket.co.kr', 'auction.co.kr'];
    
    if (skipDomains.some(skipDomain => domain.includes(skipDomain))) {
      console.log(`스킵된 도메인: ${domain}`);
      return NextResponse.json({
        success: true,
        data: {
          title: domain,
          description: '',
          image: null,
          favicon: null,
          url: url,
          siteName: domain
        }
      });
    }

    // 간단한 메타데이터 추출 (fetch로 HTML 가져오기)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3초로 단축
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // 간단한 HTML 파싱으로 메타데이터 추출
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';
      
      // 메타 태그에서 설명 추출
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      const description = descMatch ? descMatch[1] : '';
      
      // 이미지 추출
      const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      const image = imageMatch ? imageMatch[1] : null;
      
      // 파비콘 추출
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
      const favicon = faviconMatch ? faviconMatch[1] : null;

      return NextResponse.json({
        success: true,
        data: {
          title: title || 'Unknown Title',
          description: description || '',
          image: image,
          favicon: favicon,
          url: url,
          siteName: new URL(url).hostname
        }
      });

    } catch (fetchError) {
      console.error('메타데이터 추출 실패:', fetchError);
      
      // 실패 시 기본값 반환
      return NextResponse.json({
        success: true,
        data: {
          title: new URL(url).hostname,
          description: '',
          image: null,
          favicon: null,
          url: url,
          siteName: new URL(url).hostname
        }
      });
    }

  } catch (error) {
    console.error('프리뷰 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
