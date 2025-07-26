# Firebase Authentication 設定ガイド

## 現在のエラーについて
`Firebase: Error (auth/configuration-not-found)` エラーが発生している原因は、Firebase Authentication が正しく設定されていないか、Google ログインプロバイダーが有効化されていない可能性があります。

## 修正手順

### 1. Firebase Console にアクセス
1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト `ideaweaver-app` を選択

### 2. Authentication の設定
1. 左サイドバーから「Authentication」をクリック
2. 「Get started」ボタンが表示されている場合はクリック
3. 「Sign-in method」タブをクリック

### 3. Google プロバイダーの有効化
1. プロバイダー一覧から「Google」を選択
2. 「Enable」トグルをオンにする
3. 「Project support email」を設定（あなたのGmailアドレス）
4. 「Save」をクリック

### 4. 承認済みドメインの確認
1. 「Settings」タブをクリック
2. 「Authorized domains」セクションで以下が含まれているか確認：
   - `localhost` (開発環境用)
   - `ideaweaver-app.firebaseapp.com`
   
   含まれていない場合は「Add domain」で追加

### 5. OAuth 同意画面の設定（Google Cloud Console）
Google プロバイダーを使用する場合、Google Cloud Console での設定も必要です：

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト `ideaweaver-app` を選択
3. 「APIs & Services」→「OAuth consent screen」
4. アプリケーション名に「Lylict」を設定
5. ユーザーサポートメールを設定
6. 開発者連絡先情報を設定
7. 「Save and Continue」

### 再起動とテスト
設定完了後：
1. 開発サーバーを再起動: `npm run dev`
2. ブラウザのキャッシュをクリア
3. 再度ログインを試行

## トラブルシューティング

### 他の可能な原因
1. **プロジェクトIDの不一致**: `.env.local` のプロジェクトIDが実際のFirebaseプロジェクトと一致しているか確認
2. **APIキーの権限**: Firebase API キーに適切な権限が設定されているか
3. **ブラウザの設定**: ポップアップブロッカーが無効になっているか

### 確認方法
1. ブラウザの開発者ツール（F12）を開く
2. Console タブでエラーの詳細を確認
3. Network タブでFirebase APIへのリクエストが正常に送信されているか確認