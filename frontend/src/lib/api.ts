import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 링크 생성 요청 타입
export interface CreateLinkRequest {
  originalUrl: string;
  title?: string;
  description?: string;
}

// 링크 응답 타입
export interface LinkResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  iosUrl: string | null;
  androidUrl: string | null;
  platform: string;
  title?: string;
  description?: string;
  createdAt: string;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// 분석 데이터 타입
export interface AnalyticsData {
  totalClicks: number;
  deviceClicks: {
    ios: number;
    android: number;
    desktop: number;
    other: number;
  };
  browserClicks: {
    chrome: number;
    safari: number;
    firefox: number;
    edge: number;
    other: number;
  };
}

export interface LinkWithAnalytics extends LinkResponse {
  analytics: AnalyticsData;
  lastClickedAt: string | null;
  isActive: boolean;
}

// API 함수들
export const linkApi = {
  // 링크 생성
  create: async (data: CreateLinkRequest): Promise<LinkResponse> => {
    const response = await apiClient.post<ApiResponse<LinkResponse>>('/api/links', data);
    return response.data.data;
  },

  // 링크 목록 조회
  getAll: async (page = 1, limit = 10): Promise<{
    links: LinkWithAnalytics[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const response = await apiClient.get<ApiResponse<{
      links: LinkWithAnalytics[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>>('/api/links', {
      params: { page, limit }
    });
    return response.data.data;
  },

  // 특정 링크 조회
  getById: async (id: string): Promise<LinkWithAnalytics> => {
    const response = await apiClient.get<ApiResponse<LinkWithAnalytics>>(`/api/links/${id}`);
    return response.data.data;
  },

  // 링크 수정
  update: async (id: string, data: Partial<CreateLinkRequest>): Promise<LinkWithAnalytics> => {
    const response = await apiClient.put<ApiResponse<LinkWithAnalytics>>(`/api/links/${id}`, data);
    return response.data.data;
  },

  // 링크 삭제
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/links/${id}`);
  },

  // 링크 분석 데이터 조회
  getAnalytics: async (id: string): Promise<{
    linkId: string;
    shortCode: string;
    analytics: AnalyticsData;
    createdAt: string;
    lastClickedAt: string | null;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      linkId: string;
      shortCode: string;
      analytics: AnalyticsData;
      createdAt: string;
      lastClickedAt: string | null;
    }>>(`/api/links/${id}/analytics`);
    return response.data.data;
  },

  // 링크 미리보기
  preview: async (shortCode: string): Promise<{
    shortCode: string;
    title?: string;
    description?: string;
    originalUrl: string;
    redirectUrl: string;
    platform: string;
    deviceInfo: {
      type: string;
      browser: string;
      isInApp: boolean;
    };
    analytics: {
      totalClicks: number;
      createdAt: string;
    };
  }> => {
    const response = await apiClient.get<ApiResponse<{
      shortCode: string;
      title?: string;
      description?: string;
      originalUrl: string;
      redirectUrl: string;
      platform: string;
      deviceInfo: {
        type: string;
        browser: string;
        isInApp: boolean;
      };
      analytics: {
        totalClicks: number;
        createdAt: string;
      };
    }>>(`/preview/${shortCode}`);
    return response.data.data;
  },
};

export default apiClient;
