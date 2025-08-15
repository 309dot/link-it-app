import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: '✅ API 라우트 테스트 성공!',
    timestamp: new Date().toISOString()
  })
}
