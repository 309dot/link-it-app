import mongoose, { Schema, Document } from 'mongoose';

export interface ILink extends Document {
  shortCode: string;
  originalUrl: string;
  iosUrl?: string;
  androidUrl?: string;
  platform: string;
  title?: string;
  description?: string;
  analytics: {
    totalClicks: number;
    clicksByDevice: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    clicksByBrowser: {
      chrome: number;
      safari: number;
      firefox: number;
      edge: number;
      other: number;
    };
    recentClicks: Array<{
      timestamp: Date;
      deviceType: string;
      browserType: string;
      isInApp: boolean;
      ip?: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>({
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 4,
    maxlength: 10
  },
  originalUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(url: string) {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      message: '유효한 URL이 아닙니다.'
    }
  },
  iosUrl: {
    type: String,
    trim: true
  },
  androidUrl: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['coupang', 'naver', '11st', 'gmarket', 'auction', 'unknown'],
    default: 'unknown'
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  analytics: {
    totalClicks: {
      type: Number,
      default: 0
    },
    clicksByDevice: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    clicksByBrowser: {
      chrome: { type: Number, default: 0 },
      safari: { type: Number, default: 0 },
      firefox: { type: Number, default: 0 },
      edge: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    recentClicks: [{
      timestamp: { type: Date, default: Date.now },
      deviceType: { type: String, required: true },
      browserType: { type: String, required: true },
      isInApp: { type: Boolean, default: false },
      ip: String
    }]
  }
}, {
  timestamps: true
});

// 인덱스 생성
LinkSchema.index({ shortCode: 1 });
LinkSchema.index({ createdAt: -1 });
LinkSchema.index({ 'analytics.totalClicks': -1 });

export default mongoose.models.Link || mongoose.model<ILink>('Link', LinkSchema);
