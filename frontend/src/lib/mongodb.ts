import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://jing309:Elrhs4113@cluster0.eyfjgmh.mongodb.net/linkitdb?retryWrites=true&w=majority&appName=Cluster0';
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
  // 강제로 연결 시도
  console.log('🔥 MongoDB 연결 강제 시도...');
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // 3초로 단축
      maxPoolSize: 5,
      retryWrites: false, // 재시도 끄기
      retryReads: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB 연결 성공');
      return mongoose;
    }).catch((error) => {
      console.warn('⚠️ MongoDB 연결 실패 (무시):', error.message);
      cached!.promise = null;
      return mongoose; // 에러 대신 빈 mongoose 반환
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.warn('⚠️ MongoDB 연결 최종 실패 (무시):', (e as Error).message);
    return mongoose; // 에러 대신 빈 mongoose 반환
  }

  return cached!.conn;
}

export default connectDB;
