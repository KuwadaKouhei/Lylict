// ECS接続テスト用スクリプト
const { ECSClient, ListTasksCommand, DescribeTasksCommand } = require('@aws-sdk/client-ecs');
const { EC2Client, DescribeNetworkInterfacesCommand } = require('@aws-sdk/client-ec2');
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

console.log('🔧 ECS接続テスト開始');
console.log('設定情報:');
console.log('  リージョン:', AWS_REGION);
console.log('  クラスター名:', CLUSTER_NAME);
console.log('  サービス名:', SERVICE_NAME);
console.log('  アクセスキーID:', process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ? '設定済み' : '未設定');
console.log('  シークレットキー:', process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ? '設定済み' : '未設定');

// AWS認証情報チェック
if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS認証情報が設定されていません');
  console.log('以下の環境変数を .env.local に設定してください:');
  console.log('  NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key');
  console.log('  NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_key');
  process.exit(1);
}

// AWS クライアントの初期化
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

async function testECSConnection() {
  try {
    console.log('\n🔍 1. ECSクラスター内のタスク一覧を取得中...');
    
    // 1. 起動中のタスク一覧を取得
    const listTasksCommand = new ListTasksCommand({
      cluster: CLUSTER_NAME,
      serviceName: SERVICE_NAME,
      desiredStatus: 'RUNNING'
    });
    
    const tasksResponse = await ecsClient.send(listTasksCommand);
    
    console.log('✅ ECS接続成功！');
    console.log('タスク一覧:', tasksResponse.taskArns);
    
    if (!tasksResponse.taskArns || tasksResponse.taskArns.length === 0) {
      console.warn('⚠️ 起動中のタスクが見つかりません');
      console.log('ECSサービスが起動していない可能性があります');
      return false;
    }
    
    console.log(`📊 起動中のタスク数: ${tasksResponse.taskArns.length}`);
    
    // 最新のタスクを取得
    const latestTaskArn = tasksResponse.taskArns[0];
    const taskId = latestTaskArn.split('/').pop();
    console.log('🎯 最新タスクID:', taskId);
    
    console.log('\n🔍 2. タスクの詳細情報を取得中...');
    
    // 2. タスクの詳細情報を取得
    const describeTasksCommand = new DescribeTasksCommand({
      cluster: CLUSTER_NAME,
      tasks: [latestTaskArn]
    });
    
    const taskDetails = await ecsClient.send(describeTasksCommand);
    
    if (!taskDetails.tasks || taskDetails.tasks.length === 0) {
      console.warn('⚠️ タスク詳細が取得できません');
      return false;
    }
    
    const task = taskDetails.tasks[0];
    console.log('✅ タスク詳細取得成功');
    console.log('タスク状態:', task.lastStatus);
    console.log('タスクARN:', task.taskArn);
    
    // 3. ネットワークインターフェースIDを取得
    console.log('\n🔍 3. ネットワークインターフェース情報を取得中...');
    
    const networkInterfaceId = task.attachments
      ?.find(attachment => attachment.type === 'ElasticNetworkInterface')
      ?.details?.find(detail => detail.name === 'networkInterfaceId')
      ?.value;
    
    if (!networkInterfaceId) {
      console.warn('⚠️ ネットワークインターフェースIDが見つかりません');
      return false;
    }
    
    console.log('✅ ネットワークインターフェースID:', networkInterfaceId);
    
    // 4. ネットワークインターフェースからパブリックIPを取得
    console.log('\n🔍 4. パブリックIPアドレスを取得中...');
    
    const describeNetworkInterfacesCommand = new DescribeNetworkInterfacesCommand({
      NetworkInterfaceIds: [networkInterfaceId]
    });
    
    const networkResponse = await ec2Client.send(describeNetworkInterfacesCommand);
    
    if (!networkResponse.NetworkInterfaces || networkResponse.NetworkInterfaces.length === 0) {
      console.warn('⚠️ ネットワークインターフェース情報が取得できません');
      return false;
    }
    
    const networkInterface = networkResponse.NetworkInterfaces[0];
    const publicIp = networkInterface.Association?.PublicIp;
    const privateIp = networkInterface.PrivateIpAddress;
    
    console.log('✅ ネットワーク情報取得成功');
    console.log('プライベートIP:', privateIp);
    console.log('パブリックIP:', publicIp || '未割り当て');
    
    if (publicIp) {
      console.log('\n🧪 5. API接続テストを実行中...');
      
      try {
        // APIの接続テスト
        const testResponse = await fetch(`http://${publicIp}:8080/api/v1/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000) // 10秒タイムアウト
        });
        
        if (testResponse.ok) {
          console.log('✅ API接続テスト成功');
          console.log('APIエンドポイント:', `http://${publicIp}:8080`);
        } else {
          console.warn('⚠️ API接続テスト失敗 (HTTP', testResponse.status, ')');
        }
      } catch (apiError) {
        console.warn('⚠️ API接続テストエラー:', apiError.message);
        console.log('💡 APIサーバーが起動していない可能性があります');
      }
    }
    
    console.log('\n🎉 ECS接続テスト完了');
    return true;
    
  } catch (error) {
    console.error('❌ ECS接続エラー:', error);
    
    if (error.name === 'UnauthorizedOperation' || error.name === 'AccessDenied') {
      console.log('💡 認証エラー: AWS認証情報を確認してください');
    } else if (error.name === 'ClusterNotFoundException') {
      console.log('💡 クラスターが見つかりません: CLUSTER_NAME を確認してください');
    } else if (error.name === 'ServiceNotFoundException') {
      console.log('💡 サービスが見つかりません: SERVICE_NAME を確認してください');
    }
    
    return false;
  }
}

// テスト実行
testECSConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ 総合結果: ECS接続正常');
    } else {
      console.log('\n❌ 総合結果: ECS接続に問題があります');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
