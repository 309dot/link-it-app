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

    // 실제 생성된 링크가 있다면 해당 URL로 리디렉션
    // (실제로는 데이터베이스에서 조회해야 함)
    
    // 기본 폴백 - 쿠팡으로 리디렉션
    console.log(`⚠️ 알 수 없는 shortCode: ${shortCode}, 기본 페이지로 리디렉션`);
    return NextResponse.redirect('https://www.coupang.com', 302);

  } catch (error) {
    console.error('리디렉션 에러:', error);
    return NextResponse.redirect('https://www.coupang.com', 302);
  }
}
