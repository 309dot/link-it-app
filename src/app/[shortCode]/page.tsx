'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function RedirectPage() {
  const params = useParams();
  const shortCode = params.shortCode as string;

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log(`🔗 리디렉션 시작: ${shortCode}`);
        
        // 데모 링크 처리
        const demoLinks: Record<string, string> = {
          'demo1': 'https://www.coupang.com',
          'demo2': 'https://shopping.naver.com'
        };

        if (demoLinks[shortCode]) {
          console.log(`✅ 데모 링크 리디렉션: ${shortCode} → ${demoLinks[shortCode]}`);
          window.location.href = demoLinks[shortCode];
          return;
        }

        // API에서 실제 링크 정보 조회
        const response = await fetch(`/api/links`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // mockLinksStore에서 shortCode 찾기
          const link = data.data.find((l: any) => l.shortCode === shortCode);
          
          if (link) {
            console.log(`✅ 링크 발견: ${shortCode} → ${link.originalUrl}`);
            
            // 디바이스 감지
            const userAgent = navigator.userAgent;
            const isIOS = /iPhone|iPad|iPod/.test(userAgent);
            const isAndroid = /Android/.test(userAgent);
            const isMobile = /Mobile/.test(userAgent);
            const isInAppBrowser = /FBAN|FBAV|Instagram|Line|KakaoTalk/.test(userAgent);
            
            // 스마트 리디렉션 로직
            let redirectUrl = link.originalUrl; // 기본값
            
            if (isInAppBrowser) {
              // 인앱 브라우저에서는 웹 URL 사용
              redirectUrl = link.originalUrl;
            } else if (isIOS && link.iosUrl) {
              // iOS 앱 딥링크
              redirectUrl = link.iosUrl;
            } else if (isAndroid && link.androidUrl) {
              // Android 앱 딥링크  
              redirectUrl = link.androidUrl;
            }
            
            console.log(`📱 디바이스 감지: iOS=${isIOS}, Android=${isAndroid}, 최종 URL=${redirectUrl}`);
            
            // 클릭 추적
            try {
              await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  shortCode,
                  userAgent,
                  isIOS,
                  isAndroid,
                  isMobile,
                  isInAppBrowser,
                  finalUrl: redirectUrl
                })
              });
            } catch (analyticsError) {
              console.warn('클릭 추적 실패:', analyticsError);
            }
            
            // 실제 리디렉션
            window.location.href = redirectUrl;
            return;
          }
        }
        
        // 링크를 찾을 수 없는 경우 기본 페이지로
        console.log(`⚠️ 알 수 없는 shortCode: ${shortCode}, 홈페이지로 리디렉션`);
        window.location.href = '/';
        
      } catch (error) {
        console.error('리디렉션 에러:', error);
        window.location.href = '/';
      }
    };

    if (shortCode) {
      handleRedirect();
    }
  }, [shortCode]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        backgroundColor: '#f5f5f5'
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        🔗 리디렉션 중...
      </Typography>
      <Typography variant="body2" color="textSecondary">
        잠시만 기다려주세요.
      </Typography>
    </Box>
  );
}
