import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
const USE_MEMORY_STORE = process.env.USE_MEMORY_STORE === 'true' || process.env.NODE_ENV === 'development';

console.log('🔥 MongoDB 설정:', { 
  hasURI: !!MONGODB_URI, 
  useMemoryStore: USE_MEMORY_STORE,
  nodeEnv: process.env.NODE_ENV 
});

if (!MONGODB_URI && !USE_MEMORY_STORE) {
  console.warn('⚠️ MONGODB_URI 환경변수가 설정되지 않았고 메모리 모드도 비활성화되어 있습니다.');
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

async function connectDB(): Promise<typeof mongoose | null> {
  // 메모리 모드이거나 MongoDB URI가 없으면 null 반환
  if (USE_MEMORY_STORE || !MONGODB_URI) {
    console.log('📝 인메모리 모드 사용 - MongoDB 연결 스킵');
    return null;
  }

  console.log('🔥 MongoDB 연결 시도...');

  if (cached!.conn) {
    console.log('✅ 기존 연결 재사용');
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: true, // 연결 완료까지 기다리기
      serverSelectionTimeoutMS: 10000, // 10초로 충분히
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB 연결 성공');
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
    console.log('🎉 MongoDB 연결 완료!');
    return cached!.conn;
  } catch (e) {
    cached!.promise = null;
    console.error('❌ MongoDB 연결 실패:', (e as Error).message);
    console.log('📝 인메모리 모드로 폴백');
    return null; // MongoDB 실패 시 null 반환
  }
}

export default connectDB;
