const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(helmet({
  contentSecurityPolicy: false,  // Next.js 정적 파일을 위해
}));
app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (우선순위: public 폴더 → Next.js 빌드 결과물)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../frontend/out')));

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jing309:Elrhs4113@cluster0.eyfjgmh.mongodb.net/sample_mflix?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 연결 성공'))
.catch(err => console.error('❌ MongoDB 연결 실패:', err));

// Link 스키마
const linkSchema = new mongoose.Schema({
  shortCode: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
  iosUrl: String,
  androidUrl: String,
  platform: String,
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  analytics: {
    totalClicks: { type: Number, default: 0 }
  }
});

const Link = mongoose.model('Link', linkSchema);

// 유틸리티 함수들
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

function detectPlatform(url) {
  if (url.includes('coupang.com')) return 'coupang';
  if (url.includes('shopping.naver.com')) return 'naver';
  if (url.includes('11st.co.kr')) return '11st';
  if (url.includes('gmarket.co.kr')) return 'gmarket';
  return 'unknown';
}

function generateDeepLinks(originalUrl, platform) {
  return {
    iosUrl: `${platform}://open?url=${encodeURIComponent(originalUrl)}`,
    androidUrl: `intent://open?url=${encodeURIComponent(originalUrl)}#Intent;scheme=${platform};end`
  };
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function extractUrlFromText(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}

// API 라우트들 (메인 페이지는 아래쪽에서 처리)

// 링크 생성
app.post('/api/links', async (req, res) => {
  try {
    const { originalUrl, title, description } = req.body;
    
    // URL 추출 및 검증
    let finalUrl = originalUrl;
    if (!isValidUrl(originalUrl)) {
      const extractedUrl = extractUrlFromText(originalUrl);
      if (extractedUrl && isValidUrl(extractedUrl)) {
        finalUrl = extractedUrl;
      } else {
        return res.status(400).json({
          success: false,
          error: '유효한 URL을 입력해주세요.'
        });
      }
    }

    const platform = detectPlatform(finalUrl);
    const { iosUrl, androidUrl } = generateDeepLinks(finalUrl, platform);
    const shortCode = generateShortCode();

    const link = new Link({
      shortCode,
      originalUrl: finalUrl,
      iosUrl,
      androidUrl,
      platform,
      title: title || '',
      description: description || ''
    });

    await link.save();

    res.json({
      success: true,
      data: {
        ...link.toObject(),
        shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`
      }
    });

  } catch (error) {
    console.error('링크 생성 에러:', error);
    res.status(500).json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.'
    });
  }
});

// 링크 미리보기 API (메타데이터 추출)
app.post('/api/preview', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL이 필요합니다.' 
      });
    }

    // 간단한 URL 유효성 검사
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ 
        success: false, 
        error: '유효하지 않은 URL입니다.' 
      });
    }

    // 메타데이터 추출 (간단한 구현)
    const https = require('https');
    const http = require('http');
    
    const client = url.startsWith('https:') ? https : http;
    
    const request = client.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
        // 헤더만 읽으면 충분하므로 1KB만 읽기
        if (data.length > 1024) {
          response.destroy();
        }
      });
      
      response.on('end', () => {
        // 간단한 HTML 파싱으로 제목 추출
        const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        // 메타 태그에서 설명 추출
        const descMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const description = descMatch ? descMatch[1] : '';
        
        // 이미지 추출
        const imageMatch = data.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        const image = imageMatch ? imageMatch[1] : null;
        
        res.json({
          success: true,
          data: {
            title: title || 'Unknown Title',
            description: description || '',
            image: image,
            favicon: null,
            url: url
          }
        });
      });
    });
    
    request.on('error', (error) => {
      console.error('미리보기 추출 실패:', error);
      res.status(500).json({
        success: false,
        error: '메타데이터를 가져올 수 없습니다.',
        details: error.message
      });
    });
    
    // 5초 타임아웃
    request.setTimeout(5000, () => {
      request.destroy();
      res.status(408).json({
        success: false,
        error: '요청 시간이 초과되었습니다.'
      });
    });
    
  } catch (error) {
    console.error('미리보기 API 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 링크 목록 조회
app.get('/api/links', async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 }).limit(10);
    const linksWithShortUrl = links.map(link => ({
      ...link.toObject(),
      shortUrl: `${req.protocol}://${req.get('host')}/${link.shortCode}`
    }));

    res.json({
      success: true,
      data: linksWithShortUrl
    });
  } catch (error) {
    console.error('링크 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.'
    });
  }
});

// 🎯 핵심: 서버사이드 리디렉션
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    console.log(`🔗 리디렉션 요청: ${shortCode}`);

    // 데이터베이스에서 링크 찾기
    const link = await Link.findOne({ shortCode });

    if (link) {
      // 클릭 수 증가
      link.analytics.totalClicks += 1;
      await link.save();

      console.log(`✅ 리디렉션: ${shortCode} → ${link.originalUrl}`);
      
      // 302 리디렉션 (서버사이드)
      return res.redirect(302, link.originalUrl);
    }

    // 목업 데이터 체크
    const mockLinks = {
      'demo1': 'https://www.coupang.com/example1',
      'demo2': 'https://shopping.naver.com/example2',
      'test123': 'https://example.com'
    };

    if (mockLinks[shortCode]) {
      console.log(`✅ 목업 리디렉션: ${shortCode} → ${mockLinks[shortCode]}`);
      return res.redirect(302, mockLinks[shortCode]);
    }

    // 찾을 수 없는 경우 기본 리디렉션
    console.log(`ℹ️ 기본 리디렉션: ${shortCode} → 쿠팡`);
    res.redirect(302, 'https://www.coupang.com');

  } catch (error) {
    console.error('리디렉션 에러:', error);
    res.redirect(302, 'https://www.coupang.com');
  }
});

// Next.js 정적 파일 서빙 (기존 UI 복원)
app.get('/', (req, res) => {
  console.log('🏠 메인 페이지 요청 - Next.js UI로 리디렉션');
  const indexPath = path.join(__dirname, '../frontend/out/index.html');
  console.log('📁 index.html 경로:', indexPath);
  
  // index.html이 있는지 확인
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    console.log('✅ Next.js index.html 발견, 서빙 중');
    res.sendFile(indexPath);
  } else {
    console.log('❌ Next.js 빌드 파일 없음, 간단한 안내 페이지 표시');
    res.send(`
      <html>
        <head><title>Link-It Service</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🚀 Link-It 딥링크 서비스</h1>
          <p>Next.js 프론트엔드가 빌드되지 않았습니다.</p>
          <p><a href="/api/links">API 테스트</a> | <a href="/demo1">리디렉션 테스트</a></p>
        </body>
      </html>
    `);
  }
});

// Next.js 정적 파일을 위한 catch-all
app.get('*', (req, res) => {
  // 리디렉션 처리 (6자리 알파벳/숫자)
  if (req.path.match(/^\/[a-zA-Z0-9]{6}$/)) {
    // 리디렉션 로직은 위에서 이미 처리됨
    return;
  }
  
  // API 요청이 아닌 경우 index.html 서빙 (SPA)
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, '../frontend/out/index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Frontend not built yet' });
    }
  } else {
    res.status(404).json({ error: 'API not found' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Railway 통합 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🎯 프론트엔드 + 백엔드 + 리디렉션 모두 통합!`);
});

module.exports = app;
