// Word2Vec API用のプロキシエンドポイント
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 環境変数から実際のAPIエンドポイントを取得
    const apiBaseUrl = process.env.NEXT_PUBLIC_W2V_API_BASE_URL || 'http://52.195.15.235:8080';
    const apiUrl = `${apiBaseUrl}/api/v1/associate`;
    
    console.log('🔄 プロキシ経由でAPI呼び出し:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ プロキシAPIエラー:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'プロキシ経由のAPI呼び出しに失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // ヘルスチェック用
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Word2Vec API Proxy is running',
    timestamp: new Date().toISOString()
  });
}
