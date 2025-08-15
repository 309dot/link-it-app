const shortid = require('shortid');

/**
 * URL에서 플랫폼을 감지하고 딥링크 URL을 생성하는 유틸리티
 */

// 지원하는 쇼핑 플랫폼 매핑
const PLATFORM_PATTERNS = {
  coupang: {
    regex: /coupang\.com/i,
    name: 'coupang',
    iosScheme: 'coupang://',
    androidScheme: 'coupang://'
  },
  naver: {
    regex: /shopping\.naver\.com|smartstore\.naver\.com/i,
    name: 'naver',
    iosScheme: 'navershopping://',
    androidScheme: 'navershopping://'
  },
  elevenst: {
    regex: /11st\.co\.kr/i,
    name: '11st',
    iosScheme: '11st://',
    androidScheme: '11st://'
  },
  gmarket: {
    regex: /gmarket\.co\.kr/i,
    name: 'gmarket',
    iosScheme: 'gmarket://',
    androidScheme: 'gmarket://'
  },
  auction: {
    regex: /auction\.co\.kr/i,
    name: 'auction',
    iosScheme: 'auction://',
    androidScheme: 'auction://'
  }
};

/**
 * URL에서 플랫폼을 감지
 * @param {string} url - 분석할 URL
 * @returns {string} 플랫폼 이름
 */
function detectPlatform(url) {
  for (const [key, platform] of Object.entries(PLATFORM_PATTERNS)) {
    if (platform.regex.test(url)) {
      return platform.name;
    }
  }
  return 'other';
}

/**
 * 상품 ID를 URL에서 추출 (플랫폼별)
 * @param {string} url - 상품 URL
 * @param {string} platform - 플랫폼 이름
 * @returns {string|null} 상품 ID
 */
function extractProductId(url, platform) {
  try {
    const urlObj = new URL(url);
    
    switch (platform) {
      case 'coupang':
        // 쿠팡: /products/{productId} 또는 ?itemId={itemId}
        const coupangMatch = url.match(/\/products\/(\d+)/i) || 
                           url.match(/itemId=(\d+)/i);
        return coupangMatch ? coupangMatch[1] : null;
        
      case 'naver':
        // 네이버쇼핑: /products/{productId} 또는 ?nvMid={nvMid}
        const naverMatch = url.match(/\/products\/(\d+)/i) || 
                          url.match(/nvMid=(\d+)/i);
        return naverMatch ? naverMatch[1] : null;
        
      case '11st':
        // 11번가: /products/{productId}
        const elevenMatch = url.match(/\/products\/(\d+)/i);
        return elevenMatch ? elevenMatch[1] : null;
        
      case 'gmarket':
        // G마켓: ?goodscode={goodscode}
        const gmarketMatch = url.match(/goodscode=(\d+)/i);
        return gmarketMatch ? gmarketMatch[1] : null;
        
      case 'auction':
        // 옥션: ?itemno={itemno}
        const auctionMatch = url.match(/itemno=(\d+)/i);
        return auctionMatch ? auctionMatch[1] : null;
        
      default:
        return null;
    }
  } catch (error) {
    console.error('URL 파싱 에러:', error);
    return null;
  }
}

/**
 * 딥링크 URL 생성
 * @param {string} originalUrl - 원본 URL
 * @param {string} platform - 플랫폼 이름
 * @returns {object} iOS/Android 딥링크 URL
 */
function generateDeepLinks(originalUrl, platform) {
  const productId = extractProductId(originalUrl, platform);
  const platformConfig = Object.values(PLATFORM_PATTERNS).find(p => p.name === platform);
  
  if (!productId || !platformConfig) {
    return {
      iosUrl: null,
      androidUrl: null
    };
  }
  
  // 플랫폼별 딥링크 URL 생성
  const iosUrl = `${platformConfig.iosScheme}product/${productId}`;
  const androidUrl = `${platformConfig.androidScheme}product/${productId}`;
  
  return {
    iosUrl,
    androidUrl
  };
}

/**
 * 고유한 단축 코드 생성
 * @returns {string} 단축 코드
 */
function generateShortCode() {
  // shortid 대신 더 짧고 깔끔한 코드 생성
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * URL 유효성 검사
 * @param {string} url - 검사할 URL
 * @returns {boolean} 유효성 여부
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  detectPlatform,
  extractProductId,
  generateDeepLinks,
  generateShortCode,
  isValidUrl,
  PLATFORM_PATTERNS
};
