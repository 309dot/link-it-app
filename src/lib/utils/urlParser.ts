// 지원하는 쇼핑몰 플랫폼 패턴
export const PLATFORM_PATTERNS = {
  coupang: {
    domains: ['coupang.com', 'link.coupang.com'],
    productRegex: /(?:products\/|a\/)([a-zA-Z0-9]+)/,
    deeplinks: {
      ios: 'coupang://products/{productId}',
      android: 'intent://products/{productId}#Intent;scheme=coupang;package=com.coupang.mobile;end'
    }
  },
  naver: {
    domains: ['shopping.naver.com', 'smartstore.naver.com'],
    productRegex: /products\/(\d+)/,
    deeplinks: {
      ios: 'navershopping://products/{productId}',
      android: 'intent://products/{productId}#Intent;scheme=navershopping;package=com.nhn.android.search;end'
    }
  },
  '11st': {
    domains: ['11st.co.kr'],
    productRegex: /products\/(\d+)/,
    deeplinks: {
      ios: '11st://products/{productId}',
      android: 'intent://products/{productId}#Intent;scheme=11st;package=com.elevenst;end'
    }
  },
  gmarket: {
    domains: ['gmarket.co.kr'],
    productRegex: /goodscode=(\w+)/,
    deeplinks: {
      ios: 'gmarket://products/{productId}',
      android: 'intent://products/{productId}#Intent;scheme=gmarket;package=com.gmarket.mobile;end'
    }
  },
  auction: {
    domains: ['auction.co.kr'],
    productRegex: /ItemNo=(\w+)/,
    deeplinks: {
      ios: 'auction://products/{productId}',
      android: 'intent://products/{productId}#Intent;scheme=auction;package=com.auction.mobile;end'
    }
  }
};

/**
 * URL에서 플랫폼 감지
 */
export function detectPlatform(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    for (const [platform, config] of Object.entries(PLATFORM_PATTERNS)) {
      if (config.domains.some(d => domain.includes(d))) {
        return platform;
      }
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * URL에서 상품 ID 추출
 */
export function extractProductId(url: string, platform: string): string | null {
  const config = PLATFORM_PATTERNS[platform as keyof typeof PLATFORM_PATTERNS];
  if (!config) return null;
  
  const match = url.match(config.productRegex);
  return match ? match[1] : null;
}

/**
 * 딥링크 URL 생성
 */
export function generateDeepLinks(originalUrl: string, platform: string): {
  iosUrl: string | null;
  androidUrl: string | null;
} {
  const config = PLATFORM_PATTERNS[platform as keyof typeof PLATFORM_PATTERNS];
  
  if (!config) {
    return { iosUrl: null, androidUrl: null };
  }
  
  const productId = extractProductId(originalUrl, platform);
  
  if (!productId) {
    return { iosUrl: null, androidUrl: null };
  }
  
  return {
    iosUrl: config.deeplinks.ios.replace('{productId}', productId),
    androidUrl: config.deeplinks.android.replace('{productId}', productId)
  };
}

/**
 * 고유한 단축 코드 생성
 */
export function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 텍스트에서 URL 추출
 */
export function extractUrlFromText(text: string): string | null {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  
  const supportedDomains = [
    'coupang.com',
    'link.coupang.com', 
    'shopping.naver.com',
    'smartstore.naver.com',
    '11st.co.kr',
    'gmarket.co.kr',
    'auction.co.kr'
  ];
  
  const urls = text.match(urlPattern);
  
  if (!urls || urls.length === 0) {
    return null;
  }
  
  // 지원하는 도메인의 URL 우선 선택
  for (const url of urls) {
    if (supportedDomains.some(domain => url.includes(domain))) {
      return url.trim();
    }
  }
  
  return urls[0].trim();
}

/**
 * 텍스트에서 제목 추출 (URL 제거 후)
 */
export function extractTitleFromText(text: string, extractedUrl: string): string {
  if (!extractedUrl) return '';
  
  const cleanText = text.replace(/https?:\/\/[^\s]+/gi, '').trim();
  
  const title = cleanText
    .replace(/[!?.]$/, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  return title.length > 100 ? title.substring(0, 100) + '...' : title;
}

/**
 * URL 유효성 검사
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
