# Lylict

Lylictは、アイデアを可視化し、創造性を解き放つマインドマップアプリです。

## 主な機能

- **インタラクティブなマインドマップ作成**: ドラッグアンドドロップでノードを配置・編集
- **自動生成機能**: キーワードから連想語を自動生成してマインドマップを作成
- **Googleログイン**: 安全な認証システムによるデータ管理
- **クラウド保存**: Firebaseを使用したデータの永続化
- **レスポンシブデザイン**: デスクトップ・モバイル対応

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **UI/UX**: Material-UI, React Flow, カスタムCSS
- **状態管理**: Redux Toolkit
- **認証**: Firebase Auth (Google OAuth)
- **データベース**: Firebase Firestore
- **開発環境**: Turbopack

## 開発環境のセットアップ

1. リポジトリをクローン:
```bash
git clone <repository-url>
cd lylict
```

2. 依存関係をインストール:
```bash
npm install
```

3. 環境変数を設定:
`.env.local`ファイルを作成し、Firebase設定を追加:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. 開発サーバーを起動:
```bash
npm run dev
```

5. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## ビルドとデプロイ

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# Lint実行
npm run lint
```

## 連想語API

マインドマップの自動生成機能には、別途連想語APIサーバーが必要です。
`http://localhost:5001`で動作するAPIサーバーを準備してください。

## ライセンス

MIT License