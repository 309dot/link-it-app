import { NextRequest, NextResponse } from 'next/server';

// 클릭 분석 데이터 저장소 (실제로는 MongoDB 사용)
const analyticsStore: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 클릭 이벤트 기록
    const analyticsData = {
      id: Date.now().toString(),
      shortCode: data.shortCode,
      timestamp: new Date(),
      userAgent: data.userAgent,
      isIOS: data.isIOS,
      isAndroid: data.isAndroid,
      isMobile: data.isMobile,
      isInAppBrowser: data.isInAppBrowser,
      finalUrl: data.finalUrl,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
          request.headers.get('x-real-ip') || 
          'unknown'
    };
    
    analyticsStore.push(analyticsData);
    
    console.log('📊 클릭 분석 기록:', analyticsData);
    
    return NextResponse.json({ 
      success: true, 
      message: '클릭 분석 데이터 저장됨' 
    });
    
  } catch (error) {
    console.error('분석 데이터 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: '분석 데이터 저장 실패' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shortCode = url.searchParams.get('shortCode');
    
    let filteredData = analyticsStore;
    
    if (shortCode) {
      filteredData = analyticsStore.filter(item => item.shortCode === shortCode);
    }
    
    return NextResponse.json({
      success: true,
      analytics: filteredData,
      total: filteredData.length
    });
    
  } catch (error) {
    console.error('분석 데이터 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '분석 데이터 조회 실패' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
