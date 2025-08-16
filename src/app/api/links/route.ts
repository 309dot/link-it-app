import { NextRequest, NextResponse } from 'next/server';
import {
  generateDeepLinks,
  detectPlatform,
  extractUrlFromText,
  isValidUrl,
  extractTitleFromText
} from '@/lib/utils/urlParser';
import connectDB from '@/lib/mongodb';
import Link from '@/lib/models/Link';

// 로컬 테스트용 임시 인메모리 저장소
interface LocalLink {
  _id: string;
  shortCode: string;
  originalUrl: string;
  iosUrl: string | null;
  androidUrl: string | null;
  platform: string;
  title: string;
  description: string;
  createdAt: string;
  analytics: { 
    totalClicks: number;
    clicksByDevice: { desktop: number; mobile: number; tablet: number };
    clicksByBrowser: { chrome: number; safari: number; firefox: number; edge: number; other: number };
    recentClicks: Array<{
      timestamp: Date;
      deviceType: string;
      browserType: string;
      isInApp: boolean;
    }>;
  };
}

const localLinksStore: Record<string, LocalLink> = {};

// POST /api/links - 새 링크 생성
export async function POST(request: NextRequest) {
  try {
    // MongoDB 연결 시도
    const db = await connectDB();
    const useMemoryStore = !db;
    
    console.log(`🔧 API 호출 시작 (${useMemoryStore ? '인메모리' : 'MongoDB'} 모드)`);

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

    let responseData;

    if (useMemoryStore) {
      // 인메모리 모드
      let shortCode;
      let attempts = 0;
      do {
        shortCode = Math.random().toString(36).substring(2, 8);
        attempts++;
        if (!localLinksStore[shortCode]) break;
      } while (attempts < 10);

      if (attempts >= 10) {
        return NextResponse.json({
          success: false,
          error: '유니크한 단축코드 생성에 실패했습니다. 다시 시도해주세요.'
        }, { status: 500 });
      }

      const newLink: LocalLink = {
        _id: 'local_' + Date.now(),
        shortCode,
        originalUrl: finalUrl,
        iosUrl,
        androidUrl,
        platform,
        title: finalTitle || '',
        description: description || '',
        createdAt: new Date().toISOString(),
        analytics: {
          totalClicks: 0,
          clicksByDevice: { desktop: 0, mobile: 0, tablet: 0 },
          clicksByBrowser: { chrome: 0, safari: 0, firefox: 0, edge: 0, other: 0 },
          recentClicks: []
        }
      };

      localLinksStore[shortCode] = newLink;
      console.log(`💾 링크 저장됨 (메모리): ${shortCode} → ${finalUrl}`);

      responseData = {
        _id: newLink._id,
        shortCode: newLink.shortCode,
        originalUrl: newLink.originalUrl,
        iosUrl: newLink.iosUrl,
        androidUrl: newLink.androidUrl,
        platform: newLink.platform,
        title: newLink.title,
        description: newLink.description,
        createdAt: newLink.createdAt,
        analytics: { totalClicks: newLink.analytics.totalClicks },
        shortUrl: `${request.nextUrl.origin}/${newLink.shortCode}`
      };
    } else {
      // MongoDB 모드
      let shortCode;
      let attempts = 0;
      do {
        shortCode = Math.random().toString(36).substring(2, 8);
        attempts++;
        const existingLink = await Link.findOne({ shortCode });
        if (!existingLink) break;
      } while (attempts < 10);

      if (attempts >= 10) {
        return NextResponse.json({
          success: false,
          error: '유니크한 단축코드 생성에 실패했습니다. 다시 시도해주세요.'
        }, { status: 500 });
      }

      const newLink = await Link.create({
        shortCode,
        originalUrl: finalUrl,
        iosUrl,
        androidUrl,
        platform,
        title: finalTitle || '',
        description: description || '',
        analytics: {
          totalClicks: 0,
          clicksByDevice: { desktop: 0, mobile: 0, tablet: 0 },
          clicksByBrowser: { chrome: 0, safari: 0, firefox: 0, edge: 0, other: 0 },
          recentClicks: []
        }
      });

      console.log(`💾 링크 저장됨 (MongoDB): ${shortCode} → ${finalUrl}`);

      responseData = {
        _id: newLink._id.toString(),
        shortCode: newLink.shortCode,
        originalUrl: newLink.originalUrl,
        iosUrl: newLink.iosUrl,
        androidUrl: newLink.androidUrl,
        platform: newLink.platform,
        title: newLink.title,
        description: newLink.description,
        createdAt: newLink.createdAt.toISOString(),
        analytics: { totalClicks: newLink.analytics.totalClicks },
        shortUrl: `${request.nextUrl.origin}/${newLink.shortCode}`
      };
    }

    return NextResponse.json({
      success: true,
      data: responseData,
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
    // MongoDB 연결 시도
    const db = await connectDB();
    const useMemoryStore = !db;
    
    console.log(`🎯 GET 요청 - 링크 목록 조회 (${useMemoryStore ? '인메모리' : 'MongoDB'} 모드)`);

    let formattedLinks;

    if (useMemoryStore) {
      // 인메모리 모드
      const links = Object.values(localLinksStore)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      // 기본 데모 링크 추가 (저장소가 비어있을 때)
      const demoLinks = links.length === 0 ? [
        {
          _id: 'demo_1',
          shortCode: 'demo1',
          originalUrl: 'https://www.coupang.com/example1',
          iosUrl: 'coupang://product/example1',
          androidUrl: 'intent://product/example1#Intent;scheme=coupang;package=com.coupang.mobile;end',
          platform: 'coupang',
          title: '테스트 링크 1',
          description: '데모용 링크입니다',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          analytics: { 
            totalClicks: 15,
            clicksByDevice: { desktop: 5, mobile: 10, tablet: 0 },
            clicksByBrowser: { chrome: 8, safari: 5, firefox: 2, edge: 0, other: 0 },
            recentClicks: []
          }
        },
        {
          _id: 'demo_2',
          shortCode: 'demo2',
          originalUrl: 'https://shopping.naver.com/example2',
          iosUrl: 'navershopping://product?id=example2',
          androidUrl: 'intent://product?id=example2#Intent;scheme=navershopping;package=com.nhn.android.search;end',
          platform: 'naver',
          title: '테스트 링크 2',
          description: '데모용 링크입니다',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          analytics: { 
            totalClicks: 7,
            clicksByDevice: { desktop: 2, mobile: 5, tablet: 0 },
            clicksByBrowser: { chrome: 4, safari: 2, firefox: 1, edge: 0, other: 0 },
            recentClicks: []
          }
        }
      ] : [];

      const allLinks = [...demoLinks, ...links];

      formattedLinks = allLinks.map(link => ({
        _id: link._id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        iosUrl: link.iosUrl,
        androidUrl: link.androidUrl,
        platform: link.platform,
        title: link.title,
        description: link.description,
        createdAt: link.createdAt,
        analytics: { totalClicks: link.analytics.totalClicks },
        shortUrl: `${request.nextUrl.origin}/${link.shortCode}`
      }));
    } else {
      // MongoDB 모드
      const links = await Link.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      formattedLinks = links.map((link: any) => ({
        _id: link._id.toString(),
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        iosUrl: link.iosUrl,
        androidUrl: link.androidUrl,
        platform: link.platform,
        title: link.title,
        description: link.description,
        createdAt: link.createdAt.toISOString(),
        analytics: { totalClicks: link.analytics.totalClicks },
        shortUrl: `${request.nextUrl.origin}/${link.shortCode}`
      }));
    }

    console.log(`📋 총 ${formattedLinks.length}개 링크 반환`);

    return NextResponse.json({
      success: true,
      data: formattedLinks,
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