'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function CatchAllRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string[];
  
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // slug 배열에서 첫 번째 요소가 shortCode
        const shortCode = slug?.[0];
        
        if (!shortCode) {
          // 잘못된 경로면 홈으로
          router.push('/');
          return;
        }
        
        console.log(`🔗 Catch-all 리디렉션: ${shortCode}`);
        
        // 4-6자리 영숫자 패턴 확인
        const shortCodePattern = /^[a-zA-Z0-9]{4,6}$/;
        if (!shortCodePattern.test(shortCode)) {
          console.log(`❌ 잘못된 shortCode 패턴: ${shortCode}`);
          router.push('/');
          return;
        }
        
        // API로 리디렉션 처리
        const response = await fetch(`/api/redirect/${shortCode}`);
        
        if (response.redirected) {
          // 서버에서 리디렉션이 일어났다면 해당 URL로 이동
          window.location.href = response.url;
          return;
        }
        
        // 응답이 있다면 JSON으로 파싱해서 URL 추출
        if (response.ok) {
          const data = await response.json();
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          }
        }
        
        // 그 외의 경우 API 응답 헤더에서 Location 확인
        const location = response.headers.get('location');
        if (location) {
          window.location.href = location;
          return;
        }
        
        // 최후의 수단: 직접 API 호출로 데이터 가져오기
        const fallbackResponse = await fetch('/api/links');
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success && fallbackData.data) {
          const link = fallbackData.data.find((l: any) => l.shortCode === shortCode);
          if (link) {
            window.location.href = link.originalUrl;
            return;
          }
        }
        
        // 모든 방법이 실패하면 홈으로
        console.log(`⚠️ shortCode를 찾을 수 없음: ${shortCode}`);
        router.push('/');
        
      } catch (error) {
        console.error('리디렉션 오류:', error);
        router.push('/');
      }
    };

    handleRedirect();
  }, [slug, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        🔗 리디렉션 중...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        잠시만 기다려주세요
      </Typography>
    </Box>
  );
}
