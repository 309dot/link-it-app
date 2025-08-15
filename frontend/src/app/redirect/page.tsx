'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// 기본 목업 링크들
const mockLinks: Record<string, string> = {
  'demo1': 'https://www.coupang.com/example1',
  'demo2': 'https://shopping.naver.com/example2',
  'test123': 'https://example.com'
}

export default function RedirectPage() {
  const searchParams = useSearchParams()
  const shortCode = searchParams.get('code') || ''
  const [status, setStatus] = useState('🔍 링크 확인 중...')

  useEffect(() => {
    if (!shortCode) {
      setStatus('❌ 잘못된 링크')
      window.location.href = 'https://www.coupang.com'
      return
    }

    console.log('🔗 Query Parameter 리디렉션:', shortCode)

    let redirectUrl = mockLinks[shortCode]

    if (redirectUrl) {
      // 목업 링크 즉시 리디렉션
      setStatus(`🚀 ${redirectUrl}로 이동 중...`)
      setTimeout(() => {
        window.location.href = redirectUrl!
      }, 500)
      return
    }

    // API에서 생성된 링크 확인
    setStatus('📋 생성된 링크 확인 중...')
    
    fetch('/api/links')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const foundLink = data.data.find((link: any) => link.shortCode === shortCode)
          if (foundLink) {
            redirectUrl = foundLink.originalUrl
            console.log(`✅ API에서 링크 발견: ${shortCode} → ${redirectUrl}`)
            setStatus(`🚀 ${redirectUrl}로 이동 중...`)
            setTimeout(() => {
              window.location.href = redirectUrl!
            }, 500)
            return
          }
        }
        
        // 간단한 매칭 규칙
        if (/^[a-z0-9]{6}$/.test(shortCode)) {
          const defaultSites = [
            'https://www.coupang.com',
            'https://shopping.naver.com', 
            'https://www.11st.co.kr'
          ]
          const hash = shortCode.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
          redirectUrl = defaultSites[hash % defaultSites.length]
          console.log(`🎲 해시 매핑: ${shortCode} → ${redirectUrl}`)
        }

        // shortCode가 인코딩된 URL인지 확인
        if (!redirectUrl) {
          try {
            const decodedUrl = decodeURIComponent(shortCode)
            if (decodedUrl.startsWith('http')) {
              redirectUrl = decodedUrl
            }
          } catch (e) {
            // 디코딩 실패시 무시
          }
        }

        // 기본 URL로 폴백
        if (!redirectUrl) {
          redirectUrl = 'https://www.coupang.com'
          console.log(`ℹ️ 기본 URL로 리디렉션: ${shortCode}`)
        }

        setStatus(`🚀 ${redirectUrl}로 이동 중...`)
        setTimeout(() => {
          window.location.href = redirectUrl!
        }, 800)
      })
      .catch(error => {
        console.error('API 호출 실패:', error)
        redirectUrl = 'https://www.coupang.com'
        setStatus(`🚀 기본 사이트로 이동 중...`)
        setTimeout(() => {
          window.location.href = redirectUrl!
        }, 500)
      })
  }, [shortCode])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          marginBottom: '20px',
          color: '#333'
        }}>
          Link-It 🔗
        </h1>
        
        <div style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '10px'
        }}>
          {status}
        </div>
        
        <div style={{
          fontSize: '14px',
          color: '#999',
          marginTop: '20px'
        }}>
          Short Code: <code style={{backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px'}}>{shortCode}</code>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: '#ccc',
          marginTop: '15px'
        }}>
          ⚡ 즉시 리디렉션 중...
        </div>
      </div>
    </div>
  )
}
