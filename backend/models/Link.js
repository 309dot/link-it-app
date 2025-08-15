const mongoose = require('mongoose');

// 링크 스키마 정의
const linkSchema = new mongoose.Schema({
  // 단축 코드 (고유 식별자)
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 원본 URL (웹 버전)
  originalUrl: {
    type: String,
    required: true
  },
  
  // iOS 앱 딥링크 URL
  iosUrl: {
    type: String,
    default: null
  },
  
  // Android 앱 딥링크 URL
  androidUrl: {
    type: String,
    default: null
  },
  
  // 플랫폼 정보 (auto-detected)
  platform: {
    type: String,
    enum: ['coupang', 'naver', '11st', 'gmarket', 'auction', 'other'],
    default: 'other'
  },
  
  // 클릭 분석 데이터
  analytics: {
    totalClicks: { type: Number, default: 0 },
    deviceClicks: {
      ios: { type: Number, default: 0 },
      android: { type: Number, default: 0 },
      desktop: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    browserClicks: {
      chrome: { type: Number, default: 0 },
      safari: { type: Number, default: 0 },
      firefox: { type: Number, default: 0 },
      edge: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  
  // 메타데이터
  title: String,
  description: String,
  
  // 타임스탬프
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 마지막 클릭 시간
  lastClickedAt: {
    type: Date,
    default: null
  },
  
  // 활성 상태
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 인덱스 추가 (성능 최적화)
linkSchema.index({ createdAt: -1 });
linkSchema.index({ 'analytics.totalClicks': -1 });

// 가상 필드: 완전한 단축 URL
linkSchema.virtual('fullShortUrl').get(function() {
  return `${process.env.BASE_URL || 'http://localhost:3000'}/${this.shortCode}`;
});

// 클릭 증가 메서드
linkSchema.methods.incrementClick = function(deviceType = 'other', browserType = 'other') {
  this.analytics.totalClicks += 1;
  this.analytics.deviceClicks[deviceType] = (this.analytics.deviceClicks[deviceType] || 0) + 1;
  this.analytics.browserClicks[browserType] = (this.analytics.browserClicks[browserType] || 0) + 1;
  this.lastClickedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Link', linkSchema);
