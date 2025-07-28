// AI APIサービスのヘルパー関数

import { autoDiscoverAPIEndpoint } from './awsService';

// 本番環境ではHTTPSプロキシを使用、開発環境では直接アクセス
const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';

/**
 * APIエンドポイントの自動選択（本番環境ではプロキシ優先）
 */
const getAvailableApiUrl = async (): Promise<string> => {
  // 本番環境（HTTPS）では常にプロキシを使用
  if (isProduction) {
    return '/api/w2v-proxy';
  }
  
  // 開発環境では従来通りの動的検出を実行
  try {
    const discoveryResult = await autoDiscoverAPIEndpoint();
    
    if (discoveryResult.success && discoveryResult.apiUrl) {
      return `${discoveryResult.apiUrl}/api/v1/associate`;
    } else {
      console.warn('⚠️ AWS ECS動的IP検出失敗:', discoveryResult.error);
    }
  } catch (error) {
    console.warn('⚠️ AWS ECS動的IP検出エラー:', error);
  }
  
  // フォールバック
  const fallbackUrl = process.env.NEXT_PUBLIC_W2V_API_BASE_URL || 'http://localhost:8080';
  return `${fallbackUrl}/api/v1/associate`;
};

/**
 * 世代別連想語APIを呼び出す時のエラーハンドリング
 */
const handleApiError = (error: unknown, baseUrl: string): never => {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    throw new Error(`APIサーバーに接続できません。\n` +
      `サーバーURL: ${baseUrl}\n` +
      `確認事項:\n` +
      `1. APIサーバーが起動しているか\n` +
      `2. ネットワーク接続を確認\n` +
      `3. ファイアウォールの設定\n` +
      `元のエラー: ${error.message}`);
  }
  throw error;
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
    // プロキシ経由の場合は直接ヘルスチェック、直接APIの場合は軽量テスト
    const response = await fetch(baseUrl, {
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
  } catch (error) {
    console.warn('API接続エラー:', error);
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
        `詳細: APIサーバーに接続できません。サーバーが起動しているか確認してください。`);
    }

    const response = await fetch(baseUrl, {
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
      const secondGeneration = response.generations.find(gen => gen.generation_number === 2);
      if (secondGeneration) {
        return secondGeneration.results.map(item => item.word);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Word2Vec API呼び出しエラー:', error);
    return [];
  }
};
