'use client';

import { Container, Box, Typography, Card, CardContent } from '@mui/material';
import { Speed, Security, Analytics } from '@mui/icons-material';
import Navbar from '@/components/Navbar';
import LinkForm from '@/components/LinkForm';

export default function Home() {
  return (
    <>
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