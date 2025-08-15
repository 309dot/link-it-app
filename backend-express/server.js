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

// 메인 페이지 - 직접 HTML 응답
app.get('/', (req, res) => {
  console.log('🏠 메인 페이지 요청 - 직접 HTML 응답');
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Link-It 딥링크 서비스</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .form-group { margin: 20px 0; }
        input, textarea { 
            width: 100%; 
            padding: 12px; 
            border: none; 
            border-radius: 8px; 
            font-size: 16px;
            box-sizing: border-box;
        }
        button { 
            background: #ff6b6b; 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 50px; 
            font-size: 16px; 
            cursor: pointer;
            font-weight: bold;
            margin: 10px 5px;
            transition: all 0.3s ease;
        }
        button:hover { 
            background: #ff5252; 
            transform: translateY(-2px);
        }
        .result { 
            margin-top: 20px; 
            padding: 15px; 
            background: rgba(255,255,255,0.2); 
            border-radius: 10px; 
            display: none;
        }
        .test-links { 
            margin-top: 30px; 
            text-align: center; 
        }
        .test-link { 
            color: #ffd700; 
            text-decoration: none; 
            margin: 0 15px;
            font-weight: bold;
        }
        .test-link:hover { 
            text-decoration: underline; 
        }
        .success { color: #90EE90; }
        .error { color: #FFB6C1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Link-It 딥링크 서비스</h1>
        <p>소셜미디어에서 앱으로 바로 이동하는 혁신적인 링크 서비스</p>
        
        <form onsubmit="createLink(event)">
            <div class="form-group">
                <label>📎 원본 URL:</label>
                <input type="text" id="originalUrl" 
                       placeholder="https://www.coupang.com/... 또는 전체 텍스트 붙여넣기" 
                       required>
            </div>
            
            <div class="form-group">
                <label>📝 제목 (선택사항):</label>
                <input type="text" id="title" placeholder="링크 제목">
            </div>
            
            <div class="form-group">
                <label>📄 설명 (선택사항):</label>
                <textarea id="description" placeholder="링크 설명" rows="3"></textarea>
            </div>
            
            <button type="submit">🔗 단축 링크 생성</button>
            <button type="button" onclick="pasteFromClipboard()">📋 클립보드에서 붙여넣기</button>
        </form>
        
        <div id="result" class="result">
            <h3 class="success">✅ 링크 생성 완료!</h3>
            <p><strong>단축 URL:</strong> <a id="shortUrl" target="_blank" style="color: #ffd700;"></a></p>
            <button onclick="copyToClipboard()">📋 복사</button>
        </div>
        
        <div class="test-links">
            <h3>🧪 테스트 링크들:</h3>
            <a href="/demo1" class="test-link">Demo1 (쿠팡)</a>
            <a href="/demo2" class="test-link">Demo2 (네이버)</a>
            <a href="/api/links" class="test-link">API 테스트</a>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 14px; opacity: 0.8;">
            <p>✅ Railway 통합 서비스 - 프론트엔드 + 백엔드 + 리디렉션</p>
            <p>🔗 이제 진짜로 작동하는 딥링크 서비스!</p>
        </div>
    </div>

    <script>
        async function createLink(event) {
            event.preventDefault();
            
            const originalUrl = document.getElementById('originalUrl').value;
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            
            try {
                const response = await fetch('/api/links', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ originalUrl, title, description })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const shortUrl = data.data.shortUrl;
                    document.getElementById('shortUrl').href = shortUrl;
                    document.getElementById('shortUrl').textContent = shortUrl;
                    document.getElementById('result').style.display = 'block';
                } else {
                    alert('❌ 링크 생성 실패: ' + data.error);
                }
            } catch (error) {
                alert('❌ 오류 발생: ' + error.message);
            }
        }
        
        async function pasteFromClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('originalUrl').value = text;
                alert('✅ 클립보드에서 붙여넣기 완료!');
            } catch (err) {
                prompt('클립보드 권한이 없습니다. 여기에 링크를 붙여넣으세요:', '');
            }
        }
        
        function copyToClipboard() {
            const shortUrl = document.getElementById('shortUrl').textContent;
            navigator.clipboard.writeText(shortUrl).then(() => {
                alert('✅ 클립보드에 복사되었습니다!');
            });
        }
        
        // 페이지 로드 시 환영 메시지
        window.onload = function() {
            console.log('🎉 Link-It 서비스가 정상적으로 로드되었습니다!');
        };
    </script>
</body>
</html>`);
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
