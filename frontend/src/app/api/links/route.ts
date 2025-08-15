import { NextRequest, NextResponse } from 'next/server';
import {
  generateDeepLinks,
  detectPlatform,
  extractUrlFromText,
  isValidUrl,
  extractTitleFromText
} from '@/lib/utils/urlParser';

// 메모리에 생성된 링크 저장 (간단한 인메모리 저장소)
interface MockLink {
  _id: string;
  shortCode: string;
  originalUrl: string;
  iosUrl: string | null;
  androidUrl: string | null;
  platform: string;
  title: string;
  description: string;
  createdAt: string;
  analytics: { totalClicks: number };
  shortUrl: string;
}

const mockLinksStore: Record<string, MockLink> = {};

// POST /api/links - 새 링크 생성
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API 호출 시작');

    const body = await request.json();
    const { originalUrl, title, description } = body;

    // 입력값에서 URL 추출 시도
    let finalUrl = originalUrl;
    let finalTitle = title;

    // originalUrl이 URL이 아닌 텍스트인 경우 URL 추출
    if (originalUrl && !isValidUrl(originalUrl)) {
      const extractedUrl = extractUrlFromText(originalUrl);
      if (extractedUrl && isValidUrl(extractedUrl)) {
        finalUrl = extractedUrl;
        // 제목이 없으면 텍스트에서 추출
        if (!finalTitle) {
          finalTitle = extractTitleFromText(originalUrl, extractedUrl);
        }
      }
    }

    // 최종 URL 유효성 검사
    if (!finalUrl || !isValidUrl(finalUrl)) {
      return NextResponse.json({
        success: false,
        error: '유효한 URL을 입력해주세요. 텍스트에 URL이 포함되어 있는지 확인해주세요.'
      }, { status: 400 });
    }

    // 플랫폼 감지
    const platform = detectPlatform(finalUrl);

    // 딥링크 URL 생성
    const { iosUrl, androidUrl } = generateDeepLinks(finalUrl, platform);

    // 목업 응답 생성
    const mockShortCode = Math.random().toString(36).substring(2, 8);
    const mockLink = {
      _id: 'mock_' + Date.now(),
      shortCode: mockShortCode,
      originalUrl: finalUrl,
      iosUrl,
      androidUrl,
      platform,
      title: finalTitle,
      description: description || '',
      createdAt: new Date().toISOString(),
      analytics: { totalClicks: 0 },
      shortUrl: `${request.nextUrl.origin}/${mockShortCode}`
    };

    // 인메모리 저장소에 저장
    mockLinksStore[mockShortCode] = mockLink;
    console.log(`💾 링크 저장됨: ${mockShortCode} → ${finalUrl}`);

    return NextResponse.json({
      success: true,
      data: mockLink,
      message: '✅ 링크 생성 완료!'
    });

  } catch (error) {
    console.error('❌ POST 에러:', error);
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// GET /api/links - 링크 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🎯 GET 요청 - 링크 목록 조회');

    // 기본 목업 링크 데이터
    const defaultMockLinks = [
      {
        _id: 'mock_1',
        shortCode: 'demo1',
        originalUrl: 'https://www.coupang.com/example1',
        title: '테스트 링크 1',
        description: '데모용 링크입니다',
        platform: 'coupang',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        analytics: { totalClicks: 15 },
        shortUrl: `${request.nextUrl.origin}/demo1`
      },
      {
        _id: 'mock_2',
        shortCode: 'demo2',
        originalUrl: 'https://shopping.naver.com/example2',
        title: '테스트 링크 2',
        description: '데모용 링크입니다',
        platform: 'naver',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        analytics: { totalClicks: 7 },
        shortUrl: `${request.nextUrl.origin}/demo2`
      }
    ];

    // 저장된 링크들과 기본 링크들 합치기
    const allLinks = [
      ...defaultMockLinks,
      ...Object.values(mockLinksStore)
    ];

    console.log(`📋 총 ${allLinks.length}개 링크 반환`);

    return NextResponse.json({
      success: true,
      data: allLinks,
      message: '📋 링크 목록 조회 완료'
    });

  } catch (error) {
    console.error('❌ GET 에러:', error);
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