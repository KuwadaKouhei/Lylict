// AI APIサービスのヘルパー関数

import { autoDiscoverAPIEndpoint } from './awsService';

// 本番環境ではHTTPSプロキシを使用
const PRIMARY_API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/w2v-proxy'  // Vercel本番環境ではプロキシ経由
  : process.env.NEXT_PUBLIC_W2V_API_BASE_URL || 'http://localhost:8080/api/v1/associate';

const FALLBACK_API_URL = process.env.NEXT_PUBLIC_W2V_API_LOCAL_URL || 'http://localhost:8080';

// 動的に取得されたAPIのURL（キャッシュ用）
let dynamicApiUrl: string | null = null;

/**
 * APIエンドポイントの自動選択（本番環境ではプロキシ優先）
 */
const getAvailableApiUrl = async (): Promise<string> => {
  // 本番環境では常にプロキシを使用
  if (process.env.NODE_ENV === 'production') {
    return '/api/w2v-proxy';
  }
  
  // 開発環境のみAWS ECS動的検出を実行
  if (!dynamicApiUrl) {
    try {
      console.log('🔍 AWS ECSからパブリックIP自動検出を開始...');
      const discoveryResult = await autoDiscoverAPIEndpoint();
      
      if (discoveryResult.success && discoveryResult.apiUrl) {
        dynamicApiUrl = discoveryResult.apiUrl;
        console.log('✅ AWS ECS動的IP検出成功:', dynamicApiUrl);
        return dynamicApiUrl;
      } else {
        console.warn('⚠️ AWS ECS動的IP検出失敗:', discoveryResult.error);
      }
    } catch (error) {
      console.warn('⚠️ AWS ECS動的IP検出エラー:', error);
    }
  } else {
    // キャッシュされた動的URLがある場合は先にテスト
    try {
      const response = await fetch(`${dynamicApiUrl}/api/v1/associate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: "テスト", generation: 2 }),
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        console.log('✅ 動的取得APIサーバーに接続成功:', dynamicApiUrl);
        return dynamicApiUrl;
      } else {
        console.warn('⚠️ 動的取得APIサーバーが応答しません。キャッシュをクリア');
        dynamicApiUrl = null;
      }
    } catch {
      console.warn('⚠️ 動的取得APIサーバーに接続できません。キャッシュをクリア');
      dynamicApiUrl = null;
    }
  }
  
  // 2. 設定された本番環境を試行
  try {
    const apiUrl = PRIMARY_API_URL.includes('/api/w2v-proxy') 
      ? PRIMARY_API_URL  // プロキシの場合はそのまま
      : `${PRIMARY_API_URL}/api/v1/associate`;  // 直接APIの場合はパスを追加
      
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: "テスト", generation: 2 }),
      signal: AbortSignal.timeout(5000) // 5秒でタイムアウト
    });
    
    if (response.ok) {
      console.log('✅ APIサーバーに接続成功:', apiUrl);
      return PRIMARY_API_URL;
    }
  } catch {
    console.warn('⚠️ APIサーバーに接続できません:', PRIMARY_API_URL);
  }
  
  // 3. 本番がダメならローカル環境を試行
  try {
    const response = await fetch(`${FALLBACK_API_URL}/api/v1/associate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: "テスト", generation: 2 }),
      signal: AbortSignal.timeout(2000) // 2秒でタイムアウト
    });
    
    if (response.ok) {
      console.log('✅ ローカルAPIサーバーに接続成功:', FALLBACK_API_URL);
      return FALLBACK_API_URL;
    }
  } catch {
    console.warn('⚠️ ローカルAPIサーバーに接続できません:', FALLBACK_API_URL);
  }
  
  // どちらも接続できない場合は動的取得を再試行、それでもダメなら本番URLを返す
  console.error('❌ すべてのAPIサーバーが利用できません');
  return dynamicApiUrl || PRIMARY_API_URL;
};

export interface AssociationWord {
  word: string;
  similarity: number;
}

export interface GenerationResult {
  generation_number: number;
  parent_word: string;
  results: AssociationWord[];
  count: number;
}

export interface GenerationalResponse {
  status: 'success' | 'error';
  keyword?: string;
  generation?: number;
  generations?: GenerationResult[];
  total_count?: number;
  error_code?: string;
  message?: string;
  details?: string;
}

export interface AssociationResponse {
  status: 'success' | 'error';
  keyword?: string;
  generation?: number;
  generations?: GenerationResult[];
  total_count?: number;
  error_code?: string;
  message?: string;
  details?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  model_status: 'loaded' | 'loading' | 'error' | 'not_loaded';
  memory_usage?: string;
  uptime?: string;
}

/**
 * APIサーバーのヘルスチェック
 */
export const checkApiHealth = async (): Promise<HealthResponse> => {
  const baseUrl = await getAvailableApiUrl();
  
  try {
    // プロキシかどうかで呼び出し方法を分ける
    const apiUrl = baseUrl.includes('/api/w2v-proxy') 
      ? baseUrl  // プロキシの場合はそのまま
      : `${baseUrl}/api/v1/associate`;  // 直接APIの場合はパスを追加
      
    // ヘルスチェックエンドポイントが無いため、実際のAPIを軽量テスト
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: "テスト",
        generation: 2
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        model_status: 'loaded'
      };
    } else {
      throw new Error(`APIテストエラー (${response.status}): ${response.statusText}`);
    }
  } catch {
    // サーバーに接続できない場合
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      model_status: 'not_loaded'
    };
  }
};

/**
 * 世代別連想語APIを呼び出す
 */
export const fetchGenerationalAssociations = async (
  keyword: string, 
  generation: number,
  max_results: number = 10
): Promise<GenerationalResponse> => {
  const baseUrl = await getAvailableApiUrl();
  
  try {
    // まずヘルスチェックを実行
    const healthCheck = await checkApiHealth();
    if (healthCheck.status === 'unhealthy') {
      throw new Error(`APIサーバーが利用できません。サーバーの状態: ${healthCheck.model_status}\n` +
        `詳細: ${PRIMARY_API_URL} または ${FALLBACK_API_URL} に接続できません。APIサーバーが起動しているか確認してください。`);
    }

    // プロキシかどうかで呼び出し方法を分ける
    const apiUrl = baseUrl.includes('/api/w2v-proxy') 
      ? baseUrl  // プロキシの場合はそのまま
      : `${baseUrl}/api/v1/associate`;  // 直接APIの場合はパスを追加

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: keyword,
        generation: generation,
        max_results: max_results
      }),
    });

    if (!response.ok) {
      throw new Error(`APIエラー (${response.status}): ${response.statusText}`);
    }

    const data: GenerationalResponse = await response.json();

    // APIサーバーがエラーレスポンスを返した場合
    if (data.status === 'error') {
      throw new Error(`API内部エラー: ${data.message || data.error_code}\n詳細: ${data.details || 'エラーの詳細情報がありません'}`);
    }

    return data;
  } catch (fetchError) {
    // より詳細なエラー情報を提供
    if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
      throw new Error(`APIサーバーに接続できません。\n` +
        `サーバーURL: ${baseUrl}\n` +
        `確認事項:\n` +
        `1. APIサーバーが起動しているか\n` +
        `2. ポート8080が利用可能か\n` +
        `3. ファイアウォールの設定\n` +
        `元のエラー: ${fetchError.message}`);
    }
    throw fetchError;
  }
};

/**
 * 連想語APIを呼び出す（従来互換用）
 */
export const fetchAssociations = async (
  word: string, 
  count: number = 10
): Promise<string[]> => {
  try {
    // 新しいAPIを使用して2世代の連想語を取得
    const response = await fetchGenerationalAssociations(word, 2, count);
    
    if (response.status === 'error') {
      throw new Error(`API内部エラー: ${response.message || response.error_code}`);
    }

    // 第2世代の結果のみを文字列配列として返す
    if (response.generations && response.generations.length > 0) {
      const firstGeneration = response.generations.find(gen => gen.generation_number === 2);
      if (firstGeneration) {
        return firstGeneration.results.map(item => item.word);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Word2Vec API呼び出しエラー:', error);
    return [];
  }
};
