// Word2Vec API用のHTTPS→HTTPプロキシエンドポイント
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // AWS ECS動的IP検出機能付きのAPI URL取得
    const apiUrl = await getApiUrl();
    const endpoint = `${apiUrl}/api/v1/associate`;
    
    console.log('🔄 プロキシ経由でAPI呼び出し:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Lylict-HTTPS-Proxy/1.0'
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // CORSヘッダーを追加
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
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
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const count = searchParams.get('count') || '8';
  const mode = searchParams.get('mode') || 'noun';
  const generation = searchParams.get('generation') || '1';

  if (!word) {
    return NextResponse.json({ error: 'word parameter is required' }, { status: 400 });
  }

  try {
    // AWS ECS動的IP検出機能付きのAPI URL取得
    const apiUrl = await getApiUrl();
    const endpoint = `${apiUrl}/api/v1/associate?word=${encodeURIComponent(word)}&count=${count}&mode=${mode}&generation=${generation}`;
    
    console.log('🔄 プロキシ経由でGETリクエスト:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Lylict-HTTPS-Proxy/1.0'
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // CORSヘッダーを追加してレスポンス
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ プロキシGETエラー:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'プロキシ経由のGETリクエストに失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// AWS ECS動的IP検出機能
async function getApiUrl(): Promise<string> {
  // フォールバック用のデフォルトURL
  let apiUrl = process.env.NEXT_PUBLIC_W2V_API_BASE_URL || 'http://57.182.235.147:8080';
  
  // AWS認証情報が設定されている場合のみ動的検出を実行
  if (process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID && process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
    try {
      const { ECSClient, ListTasksCommand, DescribeTasksCommand } = await import('@aws-sdk/client-ecs');
      const { EC2Client, DescribeNetworkInterfacesCommand } = await import('@aws-sdk/client-ec2');
      
      const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1';
      const CLUSTER_NAME = process.env.NEXT_PUBLIC_ECS_CLUSTER_NAME || 'w2v-cluster';
      const SERVICE_NAME = process.env.NEXT_PUBLIC_ECS_SERVICE_NAME || 'w2v-api-service';
      
      const ecsClient = new ECSClient({
        region: AWS_REGION,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
        }
      });

      const ec2Client = new EC2Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
        }
      });

      // ECSタスク一覧を取得
      const listTasksResponse = await ecsClient.send(new ListTasksCommand({
        cluster: CLUSTER_NAME,
        serviceName: SERVICE_NAME,
        desiredStatus: 'RUNNING'
      }));
      
      if (listTasksResponse.taskArns && listTasksResponse.taskArns.length > 0) {
        // タスクの詳細を取得
        const taskDetailsResponse = await ecsClient.send(new DescribeTasksCommand({
          cluster: CLUSTER_NAME,
          tasks: listTasksResponse.taskArns
        }));
        
        if (taskDetailsResponse.tasks && taskDetailsResponse.tasks.length > 0) {
          const task = taskDetailsResponse.tasks[0];
          const networkInterface = task.attachments?.[0]?.details?.find(
            detail => detail.name === 'networkInterfaceId'
          );
          
          if (networkInterface?.value) {
            // ネットワークインターフェースのパブリックIPを取得
            const networkResponse = await ec2Client.send(new DescribeNetworkInterfacesCommand({
              NetworkInterfaceIds: [networkInterface.value]
            }));
            
            const publicIp = networkResponse.NetworkInterfaces?.[0]?.Association?.PublicIp;
            
            if (publicIp) {
              apiUrl = `http://${publicIp}:8080`;
              console.log(`✅ AWS ECS動的IP検出成功: ${apiUrl}`);
            }
          }
        }
      }
    } catch (awsError) {
      console.warn('⚠️ AWS ECS動的IP検出失敗、フォールバックを使用:', awsError);
    }
  }
  
  return apiUrl;
}

// OPTIONSメソッドの処理（CORS preflight）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
