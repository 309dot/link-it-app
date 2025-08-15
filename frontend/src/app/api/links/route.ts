import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Link from '@/lib/models/Link';
import { 
  detectPlatform, 
  generateDeepLinks, 
  generateShortCode, 
  isValidUrl,
  extractUrlFromText,
  extractTitleFromText
} from '@/lib/utils/urlParser';

// POST /api/links - 새 링크 생성
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API 호출 시작');
    
    // MongoDB 완전 비활성화 - 목업 모드만 사용
    const useDatabase = false;
    console.log('🎯 목업 모드 전용 - MongoDB 완전 비활성화');

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
    
    // 고유한 단축 코드 생성 (중복 체크)
    let shortCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      shortCode = generateShortCode();
      const existingLink = await Link.findOne({ shortCode });
      if (!existingLink) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return NextResponse.json({
        success: false,
        error: '고유한 단축 코드를 생성할 수 없습니다. 다시 시도해주세요.'
      }, { status: 500 });
    }
    
    // 새 링크 생성
    const newLink = new Link({
      shortCode,
      originalUrl: finalUrl,
      iosUrl,
      androidUrl,
      platform,
      title: finalTitle,
      description,
      analytics: {
        totalClicks: 0,
        clicksByDevice: { desktop: 0, mobile: 0, tablet: 0 },
        clicksByBrowser: { chrome: 0, safari: 0, firefox: 0, edge: 0, other: 0 },
        recentClicks: []
      }
    });
    
    await newLink.save();
    
    // 응답 데이터
    const responseData = {
      id: newLink._id.toString(),
      shortCode: newLink.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/${newLink.shortCode}`,
      originalUrl: newLink.originalUrl,
      iosUrl: newLink.iosUrl,
      androidUrl: newLink.androidUrl,
      platform: newLink.platform,
      title: newLink.title,
      description: newLink.description,
      createdAt: newLink.createdAt,
      // 디버그 정보 (개발용)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          inputUrl: originalUrl,
          extractedUrl: finalUrl,
          extractedTitle: finalTitle
        }
      })
    };
    
    return NextResponse.json({
      success: true,
      message: '링크가 성공적으로 생성되었습니다.',
      data: responseData
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ 링크 생성 오류:', error);
    console.error('에러 세부정보:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasMongoURI: !!process.env.MONGODB_URI,
        mongoUriStart: process.env.MONGODB_URI?.substring(0, 20) + '...',
      }
    });
    
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      details: (error as Error).message,
      debug: {
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        hasMongoURI: !!process.env.MONGODB_URI
      }
    }, { status: 500 });
  }
}

// GET /api/links - 링크 목록 조회 (목업 모드)
export async function GET(request: NextRequest) {
  try {
    console.log('🎯 GET 요청 - 목업 데이터 반환');
    
    // 목업 링크 데이터
    const mockLinks = [
      {
        _id: 'mock_1',
        shortCode: 'demo1',
        originalUrl: 'https://www.coupang.com/example1',
        title: '테스트 링크 1',
        description: '데모용 링크입니다',
        platform: 'coupang',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        analytics: { totalClicks: 15 },
        shortUrl: 'https://link-it-app.vercel.app/demo1'
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
        shortUrl: 'https://link-it-app.vercel.app/demo2'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockLinks,
      message: '🎯 목업 데이터 - 실제 저장되지 않음'
    });
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    // 정렬 설정
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // 링크 조회
    const links = await Link.find({})
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    // 총 개수 조회
    const totalCount = await Link.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);
    
    // 응답 데이터 변환
    const formattedLinks = links.map((link) => ({
      id: link._id.toString(),
      shortCode: link.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/${link.shortCode}`,
      originalUrl: link.originalUrl,
      iosUrl: link.iosUrl,
      androidUrl: link.androidUrl,
      platform: link.platform,
      title: link.title,
      description: link.description,
      analytics: link.analytics,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        links: formattedLinks,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('링크 목록 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    }, { status: 500 });
  }
}
