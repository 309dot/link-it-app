const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(express.json());

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

// API 라우트들
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Link-It API Server', 
    status: 'running',
    version: '1.0.0'
  });
});

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

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});

module.exports = app;
