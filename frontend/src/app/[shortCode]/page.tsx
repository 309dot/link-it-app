'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function RedirectPage() {
  const params = useParams();
  const shortCode = params.shortCode as string;

  useEffect(() => {
    // 목업 링크 데이터
    const mockLinks: Record<string, string> = {
      'demo1': 'https://www.coupang.com/example1',
      'demo2': 'https://shopping.naver.com/example2',
      'test123': 'https://example.com'
    };

    // shortCode로 URL 찾기
    let redirectUrl = mockLinks[shortCode];

    // 목업에 없으면 기본 URL
    if (!redirectUrl) {
      // shortCode가 URL 형태인지 확인
      try {
        const decodedUrl = decodeURIComponent(shortCode);
        if (decodedUrl.startsWith('http')) {
          redirectUrl = decodedUrl;
        }
      } catch (e) {
        // 디코딩 실패시 무시
      }
    }

    // 여전히 URL을 찾지 못했으면 기본 URL
    if (!redirectUrl) {
      redirectUrl = 'https://www.coupang.com';
    }

    console.log(`🔗 리디렉션: ${shortCode} → ${redirectUrl}`);

    // 즉시 리디렉션
    window.location.href = redirectUrl;
  }, [shortCode]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h2>🔗 링크로 이동 중입니다...</h2>
      <p>자동으로 이동되지 않으면 새로고침 해주세요.</p>
      <div style={{ 
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#666'
      }}>
        ShortCode: {shortCode}
      </div>
    </div>
  );
}
