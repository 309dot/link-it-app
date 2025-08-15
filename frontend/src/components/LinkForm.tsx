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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Link as LinkIcon,
  ContentCopy,
  CheckCircle,
  Launch,
  ContentPaste,
  AutoFixHigh,
} from '@mui/icons-material';
import { useState } from 'react';
import { linkApi, type CreateLinkRequest, type LinkResponse } from '@/lib/api';
import { extractUrlFromText, extractFromClipboard, isValidUrl } from '@/utils/urlExtractor';

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
  const [isExtracting, setIsExtracting] = useState(false);

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || '링크 생성에 실패했습니다.');
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
    const value = e.target.value;
    
    // URL 필드에 입력할 때 자동으로 URL 추출 시도
    if (field === 'originalUrl' && value.includes('http')) {
      const extracted = extractUrlFromText(value);
      if (extracted.url && extracted.url !== value) {
        setFormData(prev => ({
          ...prev,
          originalUrl: extracted.url || '',
          title: prev.title || extracted.title,
          description: prev.description || extracted.description,
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 클립보드에서 붙여넣기 및 URL 추출
  const handlePasteFromClipboard = async () => {
    setIsExtracting(true);
    try {
      const extracted = await extractFromClipboard();
      if (extracted && extracted.url) {
        setFormData(prev => ({
          ...prev,
          originalUrl: extracted.url || '',
          title: prev.title || extracted.title,
          description: prev.description || extracted.description,
        }));
        setError(null);
      } else {
        setError('클립보드에서 유효한 URL을 찾을 수 없습니다.');
      }
    } catch {
      setError('클립보드 읽기에 실패했습니다.');
    } finally {
      setIsExtracting(false);
    }
  };

  // URL 필드 붙여넣기 이벤트 처리
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    if (pasteData.includes('http')) {
      e.preventDefault();
      const extracted = extractUrlFromText(pasteData);
      if (extracted.url) {
        setFormData(prev => ({
          ...prev,
          originalUrl: extracted.url || '',
          title: prev.title || extracted.title,
          description: prev.description || extracted.description,
        }));
      }
    }
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
            <Box sx={{ position: 'relative' }}>
              <TextField
                label="상품 URL"
                placeholder="URL을 입력하거나 '쿠팡을 추천합니다! 상품명 https://link.coupang.com/a/xxx' 같은 텍스트를 붙여넣으세요"
                value={formData.originalUrl}
                onChange={handleInputChange('originalUrl')}
                onPaste={handleUrlPaste}
                required
                fullWidth
                multiline
                maxRows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="클립보드에서 URL 자동 추출">
                        <IconButton
                          onClick={handlePasteFromClipboard}
                          disabled={isExtracting}
                          size="small"
                        >
                          {isExtracting ? (
                            <CircularProgress size={20} />
                          ) : (
                            <ContentPaste />
                          )}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                helperText={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      💡 <strong>팁:</strong> &ldquo;쿠팡을 추천합니다! 상품명 https://link.coupang.com/a/xxx&rdquo; 같은 텍스트를 붙여넣으면 URL만 자동으로 추출됩니다.
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      지원: 쿠팡, 네이버쇼핑, 11번가, G마켓, 옥션
                    </Typography>
                  </Box>
                }
              />
              
              {/* URL 추출 성공 표시 */}
              {formData.originalUrl && isValidUrl(formData.originalUrl) && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoFixHigh sx={{ color: 'success.main', fontSize: 16 }} />
                  <Typography variant="caption" color="success.main">
                    URL이 자동으로 추출되었습니다!
                  </Typography>
                </Box>
              )}
            </Box>

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
