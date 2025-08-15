'use client';

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  ContentCopy,
  Launch,
  Smartphone,
  Computer,
  Analytics,
  TrendingUp,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { linkApi, type LinkWithAnalytics } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function Dashboard() {
  const [links, setLinks] = useState<LinkWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await linkApi.getAll(1, 20);
      setLinks(response.links);
    } catch (err: any) {
      setError(err.response?.data?.error || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (shortUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalStats = () => {
    return links.reduce(
      (acc, link) => {
        acc.totalClicks += link.analytics.totalClicks;
        acc.totalLinks += 1;
        acc.mobileClicks += link.analytics.deviceClicks.ios + link.analytics.deviceClicks.android;
        return acc;
      },
      { totalClicks: 0, totalLinks: 0, mobileClicks: 0 }
    );
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>데이터를 불러오는 중...</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 헤더 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            📊 분석 대시보드
          </Typography>
          <Typography variant="body1" color="text.secondary">
            링크 성과와 사용자 행동을 실시간으로 분석합니다.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 통계 카드들 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Analytics sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalClicks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      총 클릭 수
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalLinks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      생성된 링크
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Smartphone sx={{ mr: 2, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.mobileClicks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      모바일 클릭
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Computer sx={{ mr: 2, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalClicks > 0 ? Math.round((stats.mobileClicks / stats.totalClicks) * 100) : 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      모바일 비율
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 링크 목록 테이블 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              링크 목록
            </Typography>
            
            {links.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  아직 생성된 링크가 없습니다.
                </Typography>
                <Button variant="contained" href="/" sx={{ mt: 2 }}>
                  첫 번째 링크 만들기
                </Button>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>제목/URL</TableCell>
                      <TableCell>플랫폼</TableCell>
                      <TableCell align="center">클릭 수</TableCell>
                      <TableCell align="center">디바이스</TableCell>
                      <TableCell>생성일</TableCell>
                      <TableCell align="center">작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {link.title || '제목 없음'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                              }}
                            >
                              {link.shortUrl}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={link.platform.toUpperCase()}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" fontWeight="bold">
                            {link.analytics.totalClicks}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="caption">
                              📱 {link.analytics.deviceClicks.ios + link.analytics.deviceClicks.android}
                            </Typography>
                            <Typography variant="caption">
                              💻 {link.analytics.deviceClicks.desktop}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(link.createdAt)}
                          </Typography>
                          {link.lastClickedAt && (
                            <Typography variant="caption" color="text.secondary">
                              최근: {formatDate(link.lastClickedAt)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(link.shortUrl, link.id)}
                              color={copiedId === link.id ? 'success' : 'default'}
                              title="링크 복사"
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              href={link.shortUrl}
                              target="_blank"
                              title="링크 테스트"
                            >
                              <Launch fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
