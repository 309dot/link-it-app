import { NextRequest, NextResponse } from 'next/server'

// 기본 목업 링크들
const mockLinks: Record<string, string> = {
  'demo1': 'https://www.coupang.com/example1',
  'demo2': 'https://shopping.naver.com/example2',
  'test123': 'https://example.com'
}

// GET /api/redirect/[shortCode] - 서버사이드 리디렉션
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params
    console.log('🔗 API 리디렉션 요청:', shortCode)

    let redirectUrl = mockLinks[shortCode]

    // API에서 생성된 링크 확인
    if (!redirectUrl) {
      try {
        const apiResponse = await fetch(`${request.nextUrl.origin}/api/links`)
        const apiData = await apiResponse.json()

        if (apiData.success && Array.isArray(apiData.data)) {
          const foundLink = apiData.data.find((link: any) => link.shortCode === shortCode)
          if (foundLink) {
            redirectUrl = foundLink.originalUrl
            console.log(`✅ API에서 링크 찾음: ${shortCode} → ${redirectUrl}`)
          }
        }
      } catch (e) {
        console.warn('⚠️ /api/links 호출 실패:', (e as Error).message)
      }
    }

    // 간단한 매칭 규칙
    if (!redirectUrl && /^[a-z0-9]{6}$/.test(shortCode)) {
      const defaultSites = [
        'https://www.coupang.com',
        'https://shopping.naver.com', 
        'https://www.11st.co.kr'
      ]
      const hash = shortCode.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
      redirectUrl = defaultSites[hash % defaultSites.length]
      console.log(`🎲 해시 매핑: ${shortCode} → ${redirectUrl}`)
    }

    // shortCode가 인코딩된 URL인지 확인
    if (!redirectUrl) {
      try {
        const decodedUrl = decodeURIComponent(shortCode)
        if (decodedUrl.startsWith('http')) {
          redirectUrl = decodedUrl
          console.log(`🔓 디코딩된 URL: ${shortCode} → ${redirectUrl}`)
        }
      } catch (e) {
        // 디코딩 실패시 무시
      }
    }

    // 기본 URL로 폴백
    if (!redirectUrl) {
      redirectUrl = 'https://www.coupang.com'
      console.log(`ℹ️ 기본 URL로 리디렉션: ${shortCode}`)
    }

    console.log(`🚀 최종 리디렉션: ${shortCode} → ${redirectUrl}`)

    // 301 Permanent Redirect 응답
    return NextResponse.redirect(redirectUrl, { status: 301 })
    
  } catch (error) {
    console.error('리디렉션 API 오류:', error)
    
    // 에러시 기본 사이트로 리디렉션
    return NextResponse.redirect('https://www.coupang.com', { status: 302 })
  }
}
