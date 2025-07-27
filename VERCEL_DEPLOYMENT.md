# Vercel デプロイメント設定

このプロジェクトはVercelでの自動デプロイ用に最適化されています。

## デプロイメント手順

1. **GitHubリポジトリとの連携**
   - Vercelダッシュボードで新しいプロジェクトを作成
   - `KuwadaKouhei/ideaweaver` リポジトリを選択
   - フレームワークプリセット: `Next.js`

2. **必要な設定**
   - Node.js バージョン: `18.x` または `20.x`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **環境変数設定**
   - Vercelダッシュボードの「Settings」→「Environment Variables」で設定
   - 実際の値は `.env.local` ファイルまたは管理者から取得してください
   - セキュリティ上の理由により、認証情報はリポジトリには含まれていません

4. **ドメイン設定**
   - デフォルト: `https://lylict.vercel.app`
   - カスタムドメイン設定可能

## セキュリティ注意事項

- **AWS認証情報**: リポジトリには含まれていません
- **Firebase設定**: 実際の値をVercelで個別設定してください
- **API endpoints**: 本番環境に応じて設定してください

## 注意事項

- AWS ECS動的IP検出機能により、APIエンドポイントは自動で更新されます
- Firebase認証とFirestore接続が正常に動作します
- 初回デプロイ時間: 約2-3分
- 以降のデプロイ: 約30秒-1分

## トラブルシューティング

- ビルドエラーの場合: 型エラーの修正が必要
- 環境変数エラー: Vercelダッシュボードで設定を確認
- AWS接続エラー: 認証情報とリージョン設定を確認
