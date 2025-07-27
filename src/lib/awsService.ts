// AWS ECS サービスのパブリックIP取得ユーティリティ

import { ECSClient, ListTasksCommand, DescribeTasksCommand } from '@aws-sdk/client-ecs';
import { EC2Client, DescribeNetworkInterfacesCommand } from '@aws-sdk/client-ec2';

// AWS設定
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1';
const CLUSTER_NAME = process.env.NEXT_PUBLIC_ECS_CLUSTER_NAME || 'w2v-cluster';
const SERVICE_NAME = process.env.NEXT_PUBLIC_ECS_SERVICE_NAME || 'w2v-api-service';

// AWS クライアントの初期化
const ecsClient = new ECSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
  }
});

const ec2Client = new EC2Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
  }
});

/**
 * ECSサービスからパブリックIPアドレスを取得
 */
export const getECSServicePublicIP = async (): Promise<string | null> => {
  try {
    console.log('🔍 ECSサービスのパブリックIP取得を開始...');
    
    // 1. 起動中のタスク一覧を取得
    const listTasksCommand = new ListTasksCommand({
      cluster: CLUSTER_NAME,
      serviceName: SERVICE_NAME,
      desiredStatus: 'RUNNING'
    });
    
    const tasksResponse = await ecsClient.send(listTasksCommand);
    
    if (!tasksResponse.taskArns || tasksResponse.taskArns.length === 0) {
      console.warn('⚠️ 起動中のタスクが見つかりません');
      return null;
    }
    
    // 最新のタスクを取得
    const latestTaskArn = tasksResponse.taskArns[0];
    const taskId = latestTaskArn.split('/').pop();
    
    console.log(`📋 タスクID: ${taskId}`);
    
    // 2. タスクの詳細情報を取得
    const describeTasksCommand = new DescribeTasksCommand({
      cluster: CLUSTER_NAME,
      tasks: [latestTaskArn]
    });
    
    const taskDetails = await ecsClient.send(describeTasksCommand);
    
    if (!taskDetails.tasks || taskDetails.tasks.length === 0) {
      console.warn('⚠️ タスク詳細が取得できません');
      return null;
    }
    
    const task = taskDetails.tasks[0];
    
    // 3. ネットワークインターフェースIDを取得
    const networkInterfaceId = task.attachments
      ?.find(attachment => attachment.type === 'ElasticNetworkInterface')
      ?.details?.find(detail => detail.name === 'networkInterfaceId')
      ?.value;
    
    if (!networkInterfaceId) {
      console.warn('⚠️ ネットワークインターフェースIDが見つかりません');
      return null;
    }
    
    console.log(`🔌 ネットワークインターフェースID: ${networkInterfaceId}`);
    
    // 4. ネットワークインターフェースからパブリックIPを取得
    const describeNetworkInterfacesCommand = new DescribeNetworkInterfacesCommand({
      NetworkInterfaceIds: [networkInterfaceId]
    });
    
    const networkResponse = await ec2Client.send(describeNetworkInterfacesCommand);
    
    if (!networkResponse.NetworkInterfaces || networkResponse.NetworkInterfaces.length === 0) {
      console.warn('⚠️ ネットワークインターフェース情報が取得できません');
      return null;
    }
    
    const publicIp = networkResponse.NetworkInterfaces[0].Association?.PublicIp;
    
    if (publicIp) {
      console.log(`✅ パブリックIP取得成功: ${publicIp}`);
      return publicIp;
    } else {
      console.warn('⚠️ パブリックIPが見つかりません');
      return null;
    }
    
  } catch (error) {
    console.error('❌ ECSパブリックIP取得エラー:', error);
    return null;
  }
};

/**
 * 取得したパブリックIPでAPIの接続テスト
 */
export const testAPIConnection = async (publicIp: string): Promise<boolean> => {
  try {
    console.log(`🧪 APIテスト開始: http://${publicIp}:8080`);
    
    const response = await fetch(`http://${publicIp}:8080/api/v1/associate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: 'テスト',
        generation: 2
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      console.log('✅ API接続テスト成功');
      return true;
    } else {
      console.warn(`⚠️ API接続テスト失敗 (HTTP ${response.status})`);
      return false;
    }
  } catch (error) {
    console.error('❌ API接続テストエラー:', error);
    return false;
  }
};

/**
 * 自動IP取得とAPI接続テスト
 */
export const autoDiscoverAPIEndpoint = async (): Promise<{
  success: boolean;
  publicIp: string | null;
  apiUrl: string | null;
  error?: string;
}> => {
  try {
    const publicIp = await getECSServicePublicIP();
    
    if (!publicIp) {
      return {
        success: false,
        publicIp: null,
        apiUrl: null,
        error: 'ECSサービスのパブリックIPが取得できませんでした'
      };
    }
    
    const isApiWorking = await testAPIConnection(publicIp);
    
    if (isApiWorking) {
      const apiUrl = `http://${publicIp}:8080`;
      return {
        success: true,
        publicIp,
        apiUrl
      };
    } else {
      return {
        success: false,
        publicIp,
        apiUrl: null,
        error: 'API接続テストに失敗しました'
      };
    }
  } catch (error) {
    return {
      success: false,
      publicIp: null,
      apiUrl: null,
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
};
