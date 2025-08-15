import React from 'react'
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material'
import { Link as LinkIcon, Public } from '@mui/icons-material'

interface LinkPreviewData {
  title: string
  description: string
  image: string
  url: string
  siteName: string
  favicon: string
}

interface LinkPreviewProps {
  preview: LinkPreviewData | null
  loading: boolean
  error: string | null
}

export default function LinkPreview({ preview, loading, error }: LinkPreviewProps) {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <LinkIcon sx={{ animation: 'pulse 1.5s infinite', color: 'primary.main' }} />
            <Typography color="text.secondary">
              링크 프리뷰를 가져오는 중...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ mt: 2, mb: 2, borderColor: 'warning.main' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <Public sx={{ color: 'warning.main' }} />
            <Typography color="warning.main" variant="body2">
              {error}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!preview) return null

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mt: 2, 
        mb: 2, 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main'
        }
      }}
      onClick={() => window.open(preview.url, '_blank')}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" gap={2}>
          {/* 이미지 */}
          {preview.image && (
            <Box
              sx={{
                width: 80,
                height: 80,
                flexShrink: 0,
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: 'grey.100'
              }}
            >
              <img
                src={preview.image}
                alt={preview.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // 이미지 로드 실패시 숨기기
                  e.currentTarget.style.display = 'none'
                }}
              />
            </Box>
          )}

          {/* 콘텐츠 */}
          <Box flex={1} minWidth={0}>
            {/* 사이트 정보 */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Avatar 
                src={preview.favicon} 
                sx={{ width: 16, height: 16 }}
              >
                <Public sx={{ fontSize: 12 }} />
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {preview.siteName}
              </Typography>
            </Box>

            {/* 제목 */}
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {preview.title}
            </Typography>

            {/* 설명 */}
            {preview.description && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.4
                }}
              >
                {preview.description}
              </Typography>
            )}

            {/* URL */}
            <Typography 
              variant="caption" 
              color="primary.main"
              sx={{ mt: 1, display: 'block' }}
            >
              {new URL(preview.url).hostname}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
