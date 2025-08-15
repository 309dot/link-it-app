import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && process.env.NODE_ENV !== 'development') {
  console.warn('⚠️ MONGODB_URI 환경변수가 설정되지 않았습니다.');
}

interface CachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Next.js에서 MongoDB 연결을 캐시하여 재사용
declare global {
  var mongoose: CachedMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  // 환경변수가 없으면 에러 발생
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경변수가 설정되지 않았습니다.');
    console.error('Vercel 환경변수 확인 필요:', {
      NODE_ENV: process.env.NODE_ENV,
      hasMongoURI: !!process.env.MONGODB_URI,
      envKeys: Object.keys(process.env).filter(key => key.includes('MONGO')),
    });
    throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다. Vercel 대시보드에서 환경변수를 확인해주세요.');
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('📡 MongoDB 연결됨 (Next.js API)');
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error('❌ MongoDB 연결 실패:', e);
    throw new Error('MongoDB 연결에 실패했습니다. 연결 정보를 확인해주세요.');
  }

  return cached!.conn;
}

export default connectDB;
