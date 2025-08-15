/**
 * 텍스트에서 URL과 제목을 추출하는 유틸리티
 */

// URL 패턴 정규식
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

// 지원하는 쇼핑몰 도메인
const SUPPORTED_DOMAINS = [
  'coupang.com',
  'link.coupang.com',
  'shopping.naver.com',
  'smartstore.naver.com',
  '11st.co.kr',
  'gmarket.co.kr',
  'auction.co.kr'
];

/**
 * 텍스트에서 URL을 추출
 * @param text - 분석할 텍스트
 * @returns 추출된 정보
 */
export function extractUrlFromText(text: string): {
  url: string | null;
  title: string;
  description: string;
} {
  // URL 패턴 찾기
  const urls = text.match(URL_PATTERN);
  
  let extractedUrl: string | null = null;
  let cleanText = text;
  
  if (urls && urls.length > 0) {
    // 지원하는 도메인의 URL 우선 선택
    for (const url of urls) {
      if (SUPPORTED_DOMAINS.some(domain => url.includes(domain))) {
        extractedUrl = url;
        break;
      }
    }
    
    // 지원 도메인이 없으면 첫 번째 URL 사용
    if (!extractedUrl) {
      extractedUrl = urls[0];
    }
    
    // URL을 제거한 깨끗한 텍스트 생성
    cleanText = text.replace(URL_PATTERN, '').trim();
  }
  
  // 텍스트에서 제목과 설명 분리
  const { title, description } = parseTextContent(cleanText);
  
  return {
    url: extractedUrl,
    title,
    description
  };
}

/**
 * 텍스트 내용을 제목과 설명으로 분리
 * @param text - 분석할 텍스트
 * @returns 제목과 설명
 */
function parseTextContent(text: string): { title: string; description: string } {
  if (!text) {
    return { title: '', description: '' };
  }
  
  // 특수 문자로 문장 분리 (!, ?, ., 등)
  const sentences = text.split(/[!?.]/).filter(s => s.trim());
  
  if (sentences.length === 0) {
    return { title: text.trim(), description: '' };
  }
  
  if (sentences.length === 1) {
    const singleText = sentences[0].trim();
    // 짧으면 제목, 길면 설명으로 분류
    if (singleText.length <= 50) {
      return { title: singleText, description: '' };
    } else {
      return { title: '', description: singleText };
    }
  }
  
  // 여러 문장이 있는 경우
  const title = sentences[0].trim();
  const description = sentences.slice(1).join('. ').trim();
  
  return { title, description };
}

/**
 * URL이 유효한지 검사
 * @param url - 검사할 URL
 * @returns 유효성 여부
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 클립보드에서 텍스트를 읽고 URL 추출
 * @returns Promise<추출된 정보>
 */
export async function extractFromClipboard(): Promise<{
  url: string | null;
  title: string;
  description: string;
} | null> {
  try {
    const text = await navigator.clipboard.readText();
    return extractUrlFromText(text);
  } catch (error) {
    console.error('클립보드 읽기 실패:', error);
    return null;
  }
}
