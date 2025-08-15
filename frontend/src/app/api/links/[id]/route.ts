import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Link from '@/lib/models/Link';
import { isValidUrl, detectPlatform, generateDeepLinks } from '@/lib/utils/urlParser';

// GET /api/links/[id] - 특정 링크 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const link = await Link.findById(id);
    
    if (!link) {
      return NextResponse.json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      }, { status: 404 });
    }
    
    const responseData = {
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
    };
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('링크 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    }, { status: 500 });
  }
}

// PUT /api/links/[id] - 링크 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const body = await request.json();
    const { originalUrl, title, description } = body;
    
    // 기존 링크 조회
    const existingLink = await Link.findById(id);
    
    if (!existingLink) {
      return NextResponse.json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      }, { status: 404 });
    }
    
    // URL이 변경된 경우 유효성 검사 및 딥링크 재생성
    let updateData: {
      title?: string;
      description?: string;
      originalUrl?: string;
      platform?: string;
      iosUrl?: string | null;
      androidUrl?: string | null;
    } = { title, description };
    
    if (originalUrl && originalUrl !== existingLink.originalUrl) {
      if (!isValidUrl(originalUrl)) {
        return NextResponse.json({
          success: false,
          error: '유효한 URL을 입력해주세요.'
        }, { status: 400 });
      }
      
      const platform = detectPlatform(originalUrl);
      const { iosUrl, androidUrl } = generateDeepLinks(originalUrl, platform);
      
      updateData = {
        ...updateData,
        originalUrl,
        platform,
        iosUrl,
        androidUrl
      };
    }
    
    // 링크 업데이트
    const updatedLink = await Link.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    const responseData = {
      id: updatedLink._id.toString(),
      shortCode: updatedLink.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/${updatedLink.shortCode}`,
      originalUrl: updatedLink.originalUrl,
      iosUrl: updatedLink.iosUrl,
      androidUrl: updatedLink.androidUrl,
      platform: updatedLink.platform,
      title: updatedLink.title,
      description: updatedLink.description,
      analytics: updatedLink.analytics,
      createdAt: updatedLink.createdAt,
      updatedAt: updatedLink.updatedAt
    };
    
    return NextResponse.json({
      success: true,
      message: '링크가 성공적으로 수정되었습니다.',
      data: responseData
    });
    
  } catch (error) {
    console.error('링크 수정 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    }, { status: 500 });
  }
}

// DELETE /api/links/[id] - 링크 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const deletedLink = await Link.findByIdAndDelete(id);
    
    if (!deletedLink) {
      return NextResponse.json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: '링크가 성공적으로 삭제되었습니다.',
      data: {
        id: deletedLink._id.toString(),
        shortCode: deletedLink.shortCode
      }
    });
    
  } catch (error) {
    console.error('링크 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    }, { status: 500 });
  }
}
