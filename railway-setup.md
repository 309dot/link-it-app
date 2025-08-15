# Railway 배포 가이드

## 🚀 Railway란?
- Node.js, Express 완벽 지원
- GitHub 자동 배포
- 간단한 환경변수 설정
- 무료 tier: 월 $5 크레딧

## 📋 Railway 배포 단계

### 1. Railway 회원가입
1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. 무료 플랜 선택

### 2. 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `link-it-app` 저장소 선택

### 3. 환경변수 설정
```
MONGODB_URI=mongodb+srv://jing309:Elrhs4113@cluster0.eyfjgmh.mongodb.net/sample_mflix?retryWrites=true&w=majority&appName=Cluster0
PORT=3000
NODE_ENV=production
```

### 4. 배포 설정
- Root Directory: `/` (전체 프로젝트)
- Build Command: `npm run build`
- Start Command: `npm start`

## 🎯 예상 결과
- URL: `https://your-app.railway.app`
- 서버사이드 리디렉션으로 100% 확실한 동작
- 환경변수 문제 해결
- 빠른 배포 시간

## 🔧 Railway 장점
- ✅ Express.js 완벽 지원
- ✅ 서버사이드 리디렉션
- ✅ 간단한 환경변수
- ✅ 자동 HTTPS
- ✅ GitHub 자동 배포
