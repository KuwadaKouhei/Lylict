# Lylict

Lylictは、アイデアを可視化し、創造性を解き放つマインドマップアプリです。

## 主な機能

- **インタラクティブなマインドマップ作成**: ドラッグアンドドロップでノードを配置・編集
- **AI自動生成機能**: Word2Vec APIを使用してキーワードから連想語を自動生成
- **Googleログイン**: 安全な認証システムによるデータ管理
- **クラウド保存**: Firebaseを使用したデータの永続化
- **レスポンシブデザイン**: デスクトップ・モバイル対応

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **UI/UX**: Material-UI, React Flow, カスタムCSS
- **状態管理**: Redux Toolkit
- **認証**: Firebase Auth (Google OAuth)
- **データベース**: Firebase Firestore
- **AI API**: Word2Vec Association API (D:\training\w2v_associateAPI)
- **開発環境**: Turbopack

## 開発環境のセットアップ

### 1. リポジトリをクローン:
```bash
git clone <repository-url>
cd lylict
```

### 2. 依存関係をインストール:
```bash
npm install
```

### 3. 環境変数を設定:
`.env.local`ファイルを作成し、Firebase設定とAI API設定を追加:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# AI API Configuration (swagger.yaml仕様に準拠)
NEXT_PUBLIC_W2V_API_BASE_URL=http://localhost:8080

# AWS ECS Configuration (自動パブリックIP検出用)
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_ECS_CLUSTER_NAME=w2v-cluster
NEXT_PUBLIC_ECS_SERVICE_NAME=w2v-api-service
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key_id
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

### 4. Word2Vec API サーバーを起動:
AI自動生成機能を使用するために、Word2Vec APIサーバーをポート8080で起動します:

```bash
# Windows
npm run start-w2v-api

# Linux/Mac  
npm run start-w2v-api-linux
```

または手動で起動:
```bash
cd D:\training\w2v_associateAPI
# 環境変数を設定
set PORT=8080  # Windows
export PORT=8080  # Linux/Mac
python app.py  # または main.py, server.py, api.py
```

**注意**: swagger.yamlの仕様により、APIサーバーはポート8080で動作し、エンドポイントは `/api/v1/associate` です。

### 5. 開発サーバーを起動:
```bash
npm run dev
```

### 6. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## ビルドとデプロイ

### ローカルビルド
```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# Lint実行
npm run lint
```

### Vercelデプロイ

#### 1. GitHubリポジトリと連携
1. [Vercel](https://vercel.com)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリ `KuwadaKouhei/ideaweaver` を選択
4. 「Import」をクリック

#### 2. 環境変数の設定
Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：
- すべての `NEXT_PUBLIC_*` 変数を実際の値で設定
- セキュリティ上の理由により、実际の認証情報はリポジトリには含まれていません

#### 3. デプロイ実行
- 環境変数設定後、「Deploy」をクリック
- 初回デプロイ完了後、カスタムドメイン設定可能

## 連想語API

マインドマップの自動生成機能には、別途連想語APIサーバーが必要です。

### AWS ECS自動検出機能
アプリケーションは起動時に自動的にAWS ECSサービスから最新のパブリックIPアドレスを取得し、API接続を確立します。

### 対応環境
- **AWS ECS Fargate**: 自動パブリックIP検出
- **ローカル開発**: localhost:8080
- **手動設定**: 環境変数による固定IP指定

**注意**: AWS認証情報が正しく設定されている場合、ECSタスクの再起動やIPアドレス変更時も自動的に新しいエンドポイントに接続されます。

## ライセンス

MIT License