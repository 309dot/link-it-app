'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function RedirectPage() {
  const params = useParams();
  const shortCode = params.shortCode as string;

  useEffect(() => {
    const performRedirect = async () => {
      console.log(`🔗 shortCode 처리 시작: ${shortCode}`);

      // 목업 링크 데이터
      const mockLinks: Record<string, string> = {
        'demo1': 'https://www.coupang.com/example1',
        'demo2': 'https://shopping.naver.com/example2', 
        'test123': 'https://example.com'
      };

      // 1. 기본 목업 데이터에서 찾기
      let redirectUrl = mockLinks[shortCode];

      // 2. API에서 최근 생성된 링크 정보 가져오기 시도
      if (!redirectUrl) {
        try {
          const response = await fetch('/api/links');
          const data = await response.json();
          
          if (data.success && data.data) {
            // 생성된 목업 링크 중에서 찾기
            const foundLink = data.data.find((link: any) => link.shortCode === shortCode);
            if (foundLink) {
              redirectUrl = foundLink.originalUrl;
            }
          }
        } catch (e) {
          console.warn('API 호출 실패:', e);
        }
      }

      // 3. shortCode가 URL 형태인지 확인
      if (!redirectUrl) {
        try {
          const decodedUrl = decodeURIComponent(shortCode);
          if (decodedUrl.startsWith('http')) {
            redirectUrl = decodedUrl;
          }
        } catch (e) {
          // 디코딩 실패시 무시
        }
      }

      // 4. 여전히 URL을 찾지 못했으면 기본 URL
      if (!redirectUrl) {
        redirectUrl = 'https://www.coupang.com';
        console.log(`ℹ️ 기본 URL로 리디렉션: ${shortCode}`);
      }

      console.log(`🚀 최종 리디렉션: ${shortCode} → ${redirectUrl}`);

      // 500ms 후 리디렉션 (페이지 로딩 시간 확보)
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    };

    performRedirect();
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
