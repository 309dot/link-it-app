const express = require('express');
const router = express.Router();
const useragent = require('useragent');
const Link = require('../models/Link');

/**
 * 디바이스 타입 감지 함수
 * @param {string} userAgentString - User-Agent 헤더
 * @returns {object} 디바이스 정보
 */
function detectDevice(userAgentString) {
  const agent = useragent.parse(userAgentString);
  const ua = userAgentString.toLowerCase();
  
  // 디바이스 타입 감지
  let deviceType = 'desktop';
  if (/iphone|ipod/.test(ua)) deviceType = 'ios';
  else if (/ipad/.test(ua)) deviceType = 'ios';
  else if (/android/.test(ua)) deviceType = 'android';
  else if (/mobile|phone/.test(ua)) deviceType = 'mobile';
  
  // 브라우저 타입 감지
  let browserType = 'other';
  if (agent.family.toLowerCase().includes('chrome')) browserType = 'chrome';
  else if (agent.family.toLowerCase().includes('safari')) browserType = 'safari';
  else if (agent.family.toLowerCase().includes('firefox')) browserType = 'firefox';
  else if (agent.family.toLowerCase().includes('edge')) browserType = 'edge';
  
  // 인앱 브라우저 감지
  const isInApp = /instagram|facebook|twitter|line|kakaotalk|naver|wechat/.test(ua);
  
  return {
    deviceType,
    browserType,
    isInApp,
    isMobile: ['ios', 'android', 'mobile'].includes(deviceType),
    isIOS: deviceType === 'ios',
    isAndroid: deviceType === 'android',
    userAgent: userAgentString,
    parsed: {
      family: agent.family,
      version: agent.toVersion(),
      os: agent.os.toString()
    }
  };
}

/**
 * 최적의 리디렉션 URL 결정
 * @param {object} link - 링크 문서
 * @param {object} deviceInfo - 디바이스 정보
 * @returns {string} 리디렉션할 URL
 */
function getRedirectUrl(link, deviceInfo) {
  const { deviceType, isInApp } = deviceInfo;
  
  // 인앱 브라우저의 경우 웹 URL로 리디렉션 (딥링크 제한적)
  if (isInApp) {
    return link.originalUrl;
  }
  
  // iOS 디바이스
  if (deviceType === 'ios' && link.iosUrl) {
    return link.iosUrl;
  }
  
  // Android 디바이스
  if (deviceType === 'android' && link.androidUrl) {
    return link.androidUrl;
  }
  
  // 기본값: 원본 URL
  return link.originalUrl;
}

/**
 * 클릭 데이터 기록
 * @param {object} link - 링크 문서
 * @param {object} deviceInfo - 디바이스 정보
 * @param {object} req - Express 요청 객체
 */
async function recordClick(link, deviceInfo, req) {
  try {
    // 클릭 증가
    await link.incrementClick(deviceInfo.deviceType, deviceInfo.browserType);
    
    // 상세 로그 (개발용)
    console.log(`🔗 클릭 기록 - ${link.shortCode}:`, {
      deviceType: deviceInfo.deviceType,
      browserType: deviceInfo.browserType,
      isInApp: deviceInfo.isInApp,
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('클릭 데이터 기록 에러:', error);
  }
}

/**
 * GET /:shortCode
 * 단축 링크 리디렉션 처리
 */
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // 링크 찾기
    const link = await Link.findOne({ shortCode, isActive: true });
    
    if (!link) {
          return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>링크를 찾을 수 없습니다</title>
          <style>
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 600px; 
                  margin: 50px auto; 
                  padding: 20px; 
                  text-align: center;
                  color: #333;
              }
              .error-icon { font-size: 48px; margin-bottom: 20px; }
              .error-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .error-message { font-size: 16px; color: #666; margin-bottom: 30px; }
              .error-code { font-size: 14px; color: #999; background: #f5f5f5; padding: 10px; border-radius: 5px; }
              .back-btn { 
                  display: inline-block; 
                  background: #007AFF; 
                  color: white; 
                  padding: 10px 20px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  margin-top: 20px;
              }
          </style>
      </head>
      <body>
          <div class="error-icon">🔗</div>
          <div class="error-title">링크를 찾을 수 없습니다</div>
          <div class="error-message">요청하신 링크가 존재하지 않거나 비활성화되었습니다.</div>
          <div class="error-code">코드: ${shortCode}</div>
          <a href="javascript:history.back()" class="back-btn">이전 페이지로</a>
      </body>
      </html>
    `);
    }
    
    // 디바이스 정보 감지
    const userAgentString = req.headers['user-agent'] || '';
    const deviceInfo = detectDevice(userAgentString);
    
    // 클릭 데이터 기록 (비동기)
    recordClick(link, deviceInfo, req);
    
    // 리디렉션 URL 결정
    const redirectUrl = getRedirectUrl(link, deviceInfo);
    
    // 개발용 로그
    console.log(`🚀 리디렉션 - ${shortCode} → ${redirectUrl}`, {
      platform: link.platform,
      deviceType: deviceInfo.deviceType,
      isInApp: deviceInfo.isInApp
    });
    
    // 리디렉션 실행
    res.redirect(302, redirectUrl);
    
  } catch (error) {
    console.error('리디렉션 처리 에러:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>서버 오류</title>
          <style>
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 600px; 
                  margin: 50px auto; 
                  padding: 20px; 
                  text-align: center;
                  color: #333;
              }
              .error-icon { font-size: 48px; margin-bottom: 20px; }
              .error-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .error-message { font-size: 16px; color: #666; margin-bottom: 30px; }
              .back-btn { 
                  display: inline-block; 
                  background: #007AFF; 
                  color: white; 
                  padding: 10px 20px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  margin-top: 20px;
              }
          </style>
      </head>
      <body>
          <div class="error-icon">⚠️</div>
          <div class="error-title">서버 오류</div>
          <div class="error-message">리디렉션 처리 중 오류가 발생했습니다.</div>
          <a href="javascript:history.back()" class="back-btn">이전 페이지로</a>
      </body>
      </html>
    `);
  }
});

/**
 * GET /preview/:shortCode
 * 링크 미리보기 (리디렉션 없이 정보만 표시)
 */
router.get('/preview/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const link = await Link.findOne({ shortCode, isActive: true });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        error: '링크를 찾을 수 없습니다.'
      });
    }
    
    // 디바이스 정보 감지
    const userAgentString = req.headers['user-agent'] || '';
    const deviceInfo = detectDevice(userAgentString);
    
    // 예상 리디렉션 URL
    const redirectUrl = getRedirectUrl(link, deviceInfo);
    
    res.json({
      success: true,
      data: {
        shortCode: link.shortCode,
        title: link.title,
        description: link.description,
        originalUrl: link.originalUrl,
        redirectUrl,
        platform: link.platform,
        deviceInfo: {
          type: deviceInfo.deviceType,
          browser: deviceInfo.browserType,
          isInApp: deviceInfo.isInApp
        },
        analytics: {
          totalClicks: link.analytics.totalClicks,
          createdAt: link.createdAt
        }
      }
    });
    
  } catch (error) {
    console.error('미리보기 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '미리보기 조회에 실패했습니다.'
    });
  }
});



module.exports = router;
