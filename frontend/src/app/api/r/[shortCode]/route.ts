import { NextRequest, NextResponse } from 'next/server'

// 기본 목업 링크들
const mockLinks: Record<string, string> = {
  'demo1': 'https://www.coupang.com/example1',
  'demo2': 'https://shopping.naver.com/example2',
  'test123': 'https://example.com'
}

// GET /api/r/[shortCode] - 간단한 리디렉션
export async function GET(
  request: NextRequest,
  context: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = context.params
    console.log('🔗 간단 리디렉션:', shortCode)

    let redirectUrl = mockLinks[shortCode]

    // 기본 URL로 폴백
    if (!redirectUrl) {
      redirectUrl = 'https://www.coupang.com'
      console.log(`ℹ️ 기본 URL로 리디렉션: ${shortCode}`)
    }

    console.log(`🚀 최종 리디렉션: ${shortCode} → ${redirectUrl}`)

    // 301 Permanent Redirect 응답
    return NextResponse.redirect(redirectUrl, { status: 301 })
    
  } catch (error) {
    console.error('리디렉션 오류:', error)
    
    // 에러시 기본 사이트로 리디렉션
    return NextResponse.redirect('https://www.coupang.com', { status: 302 })
  }
}
