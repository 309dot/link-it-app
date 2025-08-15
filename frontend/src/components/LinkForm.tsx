'use client';

import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Link as LinkIcon,
  ContentCopy,
  CheckCircle,
  Launch,
} from '@mui/icons-material';
import { useState } from 'react';
import { linkApi, type CreateLinkRequest, type LinkResponse } from '@/lib/api';

export default function LinkForm() {
  const [formData, setFormData] = useState<CreateLinkRequest>({
    originalUrl: '',
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const link = await linkApi.create(formData);
      setResult(link);
      // 폼 초기화 (URL만 제외)
      setFormData({
        originalUrl: '',
        title: '',
        description: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || '링크 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.shortUrl) {
      try {
        await navigator.clipboard.writeText(result.shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('복사 실패:', err);
      }
    }
  };

  const handleInputChange = (field: keyof CreateLinkRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Box>
      {/* 링크 생성 폼 */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🔗 스마트 딥링크 생성
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            쇼핑몰 상품 URL을 입력하면 자동으로 모바일 앱 딥링크가 포함된 단축 링크를 생성합니다.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="상품 URL"
              placeholder="https://www.coupang.com/products/123456"
              value={formData.originalUrl}
              onChange={handleInputChange('originalUrl')}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
              }}
              helperText="쿠팡, 네이버쇼핑, 11번가, G마켓, 옥션 등의 상품 URL을 지원합니다."
            />

            <TextField
              label="제목 (선택사항)"
              placeholder="예: 신상 운동화 50% 할인"
              value={formData.title}
              onChange={handleInputChange('title')}
              fullWidth
            />

            <TextField
              label="설명 (선택사항)"
              placeholder="예: 한정 수량 특가 세일"
              value={formData.description}
              onChange={handleInputChange('description')}
              fullWidth
              multiline
              rows={2}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!formData.originalUrl || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
              sx={{ mt: 1 }}
            >
              {loading ? '생성중...' : '딥링크 생성'}
            </Button>
          </Box>

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 생성 결과 */}
      <Collapse in={!!result}>
        {result && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                ✅ 딥링크가 생성되었습니다!
              </Typography>

              {/* 플랫폼 정보 */}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`${result.platform.toUpperCase()} 플랫폼`}
                  color="primary"
                  size="small"
                />
              </Box>

              {/* 단축 링크 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  단축 링크
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      flexGrow: 1,
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {result.shortUrl}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCopy}
                    startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                    color={copied ? 'success' : 'primary'}
                  >
                    {copied ? '복사됨!' : '복사'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    href={result.shortUrl}
                    target="_blank"
                    startIcon={<Launch />}
                  >
                    테스트
                  </Button>
                </Box>
              </Box>

              {/* 딥링크 정보 */}
              {(result.iosUrl || result.androidUrl) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    생성된 딥링크
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {result.iosUrl && (
                      <Box sx={{ p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          iOS 앱:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {result.iosUrl}
                        </Typography>
                      </Box>
                    )}
                    {result.androidUrl && (
                      <Box sx={{ p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Android 앱:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {result.androidUrl}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                📱 이 링크는 사용자의 디바이스를 자동으로 감지하여 iOS/Android 앱이 설치된 경우 
                앱으로, 그렇지 않은 경우 웹 페이지로 리디렉션됩니다.
              </Alert>
            </CardContent>
          </Card>
        )}
      </Collapse>
    </Box>
  );
}
