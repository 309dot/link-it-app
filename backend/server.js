const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const useragent = require('useragent');

// 환경변수 설정 (기본값 포함)
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deeplink-service';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static('public'));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB 연결
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
})
.catch((error) => {
  console.error('❌ MongoDB 연결 실패:', error);
});

// 데이터베이스 연결 상태 모니터링
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB 연결됨');
});

mongoose.connection.on('error', (error) => {
  console.error('💥 MongoDB 연결 에러:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB 연결 해제됨');
});

// 모델 import
const Link = require('./models/Link');

// 라우트 import
const linkRoutes = require('./routes/links');
const redirectRoutes = require('./routes/redirect');

// API 라우트 설정
app.use('/api/links', linkRoutes);
app.use('/', redirectRoutes); // 리디렉션은 루트 경로에서 처리

// 기본 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: '🔗 딥링크 서비스 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'POST /api/links': '새 링크 생성',
      'GET /api/links': '링크 목록 조회',
      'GET /api/links/:id': '특정 링크 조회',
      'PUT /api/links/:id': '링크 수정',
      'DELETE /api/links/:id': '링크 삭제',
      'GET /:shortCode': '단축 링크 리디렉션'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage()
  });
});

// 404 에러 핸들링
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '요청하신 리소스를 찾을 수 없습니다.',
    path: req.url
  });
});

// 전역 에러 핸들링
app.use((error, req, res, next) => {
  console.error('💥 서버 에러:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 딥링크 서비스 서버가 포트 ${PORT}에서 실행중입니다.`);
  console.log(`📡 API 엔드포인트: ${BASE_URL}`);
  console.log(`🏥 헬스체크: ${BASE_URL}/health`);
  console.log(`📚 API 문서: ${BASE_URL}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  mongoose.connection.close(() => {
    console.log('MongoDB 연결이 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다.');
  mongoose.connection.close(() => {
    console.log('MongoDB 연결이 종료되었습니다.');
    process.exit(0);
  });
});

module.exports = app;
