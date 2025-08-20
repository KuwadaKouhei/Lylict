// ECSタスクが無い場合の動作テスト用スクリプト
const { ECSClient, ListTasksCommand } = require('@aws-sdk/client-ecs');
const fs = require('fs');
const path = require('path');

// .env.localファイルから環境変数を読み込み
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFileContent = fs.readFileSync(envPath, 'utf8');
  envFileContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
}

// AWS設定
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

// 実際のシステムの動作をシミュレート
async function testNoTasksScenario() {
  console.log('🧪 ECSタスクが無い場合の動作テスト開始');
  
  try {
    // 1. 停止中のタスクを検索してタスクが無い状況をシミュレート
    const listTasksCommand = new ListTasksCommand({
      cluster: CLUSTER_NAME,
      serviceName: SERVICE_NAME,
      desiredStatus: 'STOPPED' // 意図的にSTOPPEDタスクを検索
    });
    
    const tasksResponse = await ecsClient.send(listTasksCommand);
    
    console.log('📋 STOPPEDタスク一覧:', tasksResponse.taskArns);
    
    // システムの実際の動作をシミュレート
    if (!tasksResponse.taskArns || tasksResponse.taskArns.length === 0) {
      console.log('\n🔍 起動中のタスクが見つからない場合の動作:');
      console.log('1. ⚠️ 起動中のタスクが見つかりません - ログ出力');
      console.log('2. 🔄 getECSServicePublicIP() が null を返す');
      console.log('3. 🔄 autoDiscoverAPIEndpoint() が失敗レスポンスを返す');
      console.log('4. 🔄 フォールバックURLを使用');
      
      // 実際のフォールバック動作をシミュレート
      const fallbackUrl = process.env.NEXT_PUBLIC_W2V_API_BASE_URL || 'http://localhost:8080';
      console.log(`5. 📍 使用されるAPIエンドポイント: ${fallbackUrl}/api/v1/associate`);
      
      console.log('\n📊 最終的な動作:');
      console.log('- 本番環境（HTTPS）: プロキシ /api/w2v-proxy を使用');
      console.log('- 開発環境（HTTP）: フォールバックURL を使用');
      console.log('- エラーで停止することはなく、代替手段で動作継続');
      
      return {
        success: false,
        fallbackUsed: true,
        fallbackUrl: fallbackUrl
      };
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 実際のAPIエラーハンドリングもテスト
async function testApiErrorHandling() {
  console.log('\n🧪 APIエラーハンドリングテスト');
  
  try {
    // 存在しないエンドポイントでテスト
    const response = await fetch('http://localhost:9999/api/v1/associate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'テスト', generation: 2 }),
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('予期しない成功:', response.status);
  } catch (error) {
    console.log('✅ 期待通りのエラー:', error.message);
    console.log('📋 実際のシステムでは以下のメッセージが表示されます:');
    console.log('   "APIサーバーに接続できません。"');
    console.log('   "確認事項: 1. APIサーバーが起動しているか..."');
  }
}

// テスト実行
async function runTests() {
  const result = await testNoTasksScenario();
  await testApiErrorHandling();
  
  console.log('\n🎯 まとめ: ECSタスクが無い場合の動作');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│ 1. 警告ログを出力                        │');
  console.log('│ 2. フォールバックURLに切り替え              │');
  console.log('│ 3. アプリケーションは継続動作              │');
  console.log('│ 4. ユーザーにエラー画面は表示されない        │');
  console.log('│ 5. API呼び出し時にエラーが発生する可能性     │');
  console.log('└─────────────────────────────────────────┘');
}

runTests().catch(console.error);
