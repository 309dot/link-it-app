import { NextRequest, NextResponse } from 'next/server'

interface LinkPreview {
  title: string
  description: string
  image: string
  url: string
  siteName: string
  favicon: string
}

// URL에서 메타데이터 추출
async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    console.log('🔍 링크 프리뷰 가져오기:', url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkIt/1.0; +https://link-it-app.vercel.app)'
      },
      // 5초 타임아웃
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    
    // HTML에서 메타 태그 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                       html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    
    const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
    
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i)

    const urlObj = new URL(url)
    
    const preview: LinkPreview = {
      title: titleMatch?.[1]?.trim() || urlObj.hostname,
      description: descMatch?.[1]?.trim() || '',
      image: imageMatch?.[1] ? new URL(imageMatch[1], url).href : '',
      url: url,
      siteName: siteNameMatch?.[1]?.trim() || urlObj.hostname,
      favicon: faviconMatch?.[1] ? new URL(faviconMatch[1], url).href : `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`
    }

    console.log('✅ 프리뷰 추출 완료:', preview.title)
    return preview

  } catch (error) {
    console.error('❌ 프리뷰 추출 실패:', error)
    
    // 기본 프리뷰 반환
    try {
      const urlObj = new URL(url)
      return {
        title: urlObj.hostname,
        description: '링크 프리뷰를 가져올 수 없습니다',
        image: '',
        url: url,
        siteName: urlObj.hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`
      }
    } catch (e) {
      return null
    }
  }
}

// POST /api/preview - 링크 프리뷰 가져오기
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL이 필요합니다'
      }, { status: 400 })
    }

    // URL 유효성 검사
    try {
      new URL(url)
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 URL입니다'
      }, { status: 400 })
    }

    const preview = await fetchLinkPreview(url)

    if (!preview) {
      return NextResponse.json({
        success: false,
        error: '프리뷰를 가져올 수 없습니다'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: preview
    })

  } catch (error) {
    console.error('프리뷰 API 오류:', error)
    
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
