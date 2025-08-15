import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://jing309:Elrhs4113@cluster0.eyfjgmh.mongodb.net/sample_mflix?retryWrites=true&w=majority&appName=Cluster0';
console.log('🔥 MONGODB_URI 강제 설정:', !!MONGODB_URI);

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
    throw new Error('데이터베이스 연결 실패');
  }
}

export default connectDB;
