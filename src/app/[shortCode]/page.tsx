'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function ShortCodeRedirectPage() {
  const params = useParams();
  const shortCode = params.shortCode as string;

  useEffect(() => {
    // 간단한 bit.ly 방식: 바로 API로 리디렉션 요청
    window.location.href = `/api/redirect/${shortCode}`;
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
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        🔗 리디렉션 중...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {shortCode}로 이동합니다
      </Typography>
    </Box>
  );
}
