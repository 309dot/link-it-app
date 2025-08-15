'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Container
} from '@mui/material';
import { isValidUrl, detectPlatform } from '@/lib/utils/urlParser';

export default function SmartLinkPage() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSmartRedirect = async () => {
    if (!originalUrl || !isValidUrl(originalUrl)) {
      alert('유효한 URL을 입력해주세요');
      return;
    }

    setLoading(true);
    
    try {
      // 디바이스 감지
      const userAgent = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isMobile = /Mobile/.test(userAgent);
      
      // 플랫폼 감지
      const platform = detectPlatform(originalUrl);
      
      let redirectUrl = originalUrl;
      
      // 🎯 딥링크 핵심 로직: 디바이스별 최적 경로
      if (isMobile || isIOS || isAndroid) {
        // 쿠팡 모바일 최적화
        if (redirectUrl.includes('coupang.com')) {
          redirectUrl = redirectUrl.replace('www.coupang.com', 'm.coupang.com');
          redirectUrl = redirectUrl.replace('coupang.com', 'm.coupang.com');
          
          // iOS에서 쿠팡 앱 시도
          if (isIOS) {
            const appUrl = `coupang://product/${extractProductId(redirectUrl)}`;
            tryAppLink(appUrl, redirectUrl);
            return;
          }
        }
        
        // 네이버쇼핑 모바일 최적화
        else if (redirectUrl.includes('shopping.naver.com')) {
          redirectUrl = redirectUrl.replace('shopping.naver.com', 'm.shopping.naver.com');
          
          // Android에서 네이버쇼핑 앱 시도
          if (isAndroid) {
            const appUrl = `navershopping://product?id=${extractProductId(redirectUrl)}`;
            tryAppLink(appUrl, redirectUrl);
            return;
          }
        }
      }
      
      // 직접 리디렉션
      console.log(`🚀 스마트 리디렉션: ${originalUrl} → ${redirectUrl}`);
      console.log(`📱 디바이스: iOS=${isIOS}, Android=${isAndroid}, Mobile=${isMobile}`);
      
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('리디렉션 오류:', error);
      // 실패해도 원본 URL로라도 이동
      window.location.href = originalUrl;
    } finally {
      setLoading(false);
    }
  };

  // 앱 링크 시도 후 웹 폴백
  const tryAppLink = (appUrl: string, webFallback: string) => {
    const startTime = Date.now();
    
    // 앱 실행 시도
    window.location.href = appUrl;
    
    // 2초 후에도 페이지에 있으면 앱이 없는 것으로 간주
    setTimeout(() => {
      if (Date.now() - startTime < 2500) {
        window.location.href = webFallback;
      }
    }, 2000);
  };

  // 간단한 상품 ID 추출 (실제로는 더 정교해야 함)
  const extractProductId = (url: string): string => {
    const matches = url.match(/\/(\d+)/);
    return matches ? matches[1] : 'unknown';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            🚀 스마트 딥링크 서비스
          </Typography>
          
          <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
            디바이스를 감지해서 최적의 경로로 안내합니다
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>💡 작동 방식:</strong><br/>
            • 모바일에서는 앱 실행 시도 → 실패시 모바일웹<br/>
            • 데스크톱에서는 바로 웹사이트로 이동<br/>
            • 쿠팡, 네이버쇼핑, 11번가 등 지원
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="상품 URL"
              placeholder="https://www.coupang.com/vp/products/123456 또는 다른 쇼핑몰 URL"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              multiline
              rows={3}
            />
            
            <Button
              variant="contained"
              size="large"
              onClick={handleSmartRedirect}
              disabled={loading || !originalUrl}
              sx={{ py: 2 }}
            >
              {loading ? '🔗 리디렉션 중...' : '🎯 스마트 리디렉션 실행'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            단축 URL 기능은 제외하고 딥링크 핵심 기능에만 집중한 버전입니다
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
