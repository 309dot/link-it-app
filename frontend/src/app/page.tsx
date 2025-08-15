'use client';

import { Container, Box, Typography, Card, CardContent } from '@mui/material';
import { Speed, Security, Analytics } from '@mui/icons-material';
import Navbar from '@/components/Navbar';
import LinkForm from '@/components/LinkForm';
import { useEffect, useSearchParams } from 'react';
import { Suspense } from 'react';

// 리디렉션 처리 컴포넌트
function RedirectHandler() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      console.log('🔗 메인 페이지에서 리디렉션:', code);
      
      // 기본 목업 링크들
      const mockLinks: Record<string, string> = {
        'demo1': 'https://www.coupang.com/example1',
        'demo2': 'https://shopping.naver.com/example2',
        'test123': 'https://example.com'
      };

      let redirectUrl = mockLinks[code];

      if (redirectUrl) {
        // 목업 링크 즉시 리디렉션
        console.log(`✅ 목업 링크 리디렉션: ${code} → ${redirectUrl}`);
        window.location.href = redirectUrl;
        return;
      }

      // API에서 생성된 링크 확인
      fetch('/api/links')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const foundLink = data.data.find((link: any) => link.shortCode === code);
            if (foundLink) {
              redirectUrl = foundLink.originalUrl;
              console.log(`✅ API에서 링크 발견: ${code} → ${redirectUrl}`);
              window.location.href = redirectUrl;
              return;
            }
          }
          
          // 기본 URL로 폴백
          redirectUrl = 'https://www.coupang.com';
          console.log(`ℹ️ 기본 URL로 리디렉션: ${code}`);
          window.location.href = redirectUrl;
        })
        .catch(error => {
          console.error('API 호출 실패:', error);
          window.location.href = 'https://www.coupang.com';
        });
    }
  }, [code]);

  if (code) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>🚀 Link-It 리디렉션 중...</h1>
          <p>Short Code: <code>{code}</code></p>
          <p>잠시 후 자동으로 이동됩니다...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <RedirectHandler />
      </Suspense>
      
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 헤더 섹션 */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            🚀 스마트 딥링크 서비스
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            소셜미디어에서 모바일 앱으로 바로 이동하는 혁신적인 링크 서비스
          </Typography>
        </Box>

        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 4
          }}
        >
          {/* 왼쪽: 링크 생성 폼 */}
          <Box>
            <LinkForm />
          </Box>

          {/* 오른쪽: 기능 설명 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Speed sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">빠른 리디렉션</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  사용자 디바이스를 자동 감지하여 최적의 경로로 즉시 이동시킵니다.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">안전한 링크</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  검증된 쇼핑몰만 지원하며, 안전하고 신뢰할 수 있는 리디렉션을 보장합니다.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Analytics sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">실시간 분석</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  클릭 수, 디바이스 정보, 전환율 등을 실시간으로 추적하고 분석합니다.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* 지원 플랫폼 */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            지원 플랫폼
          </Typography>
          <Typography variant="body2" color="text.secondary">
            쿠팡 • 네이버쇼핑 • 11번가 • G마켓 • 옥션
          </Typography>
        </Box>
      </Container>
    </>
  );
}