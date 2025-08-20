// Firebase セキュリティルール デバッグ用設定

// 現在のエラーを解決するため、一時的に使用できるルール
// Firebase Console > Firestore Database > ルール にコピーして使用

// === デバッグ用ルール（一時的）===
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 一時的に全ての認証済みユーザーにアクセス許可（デバッグ用）
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/

// === 本番用ルール（最終版）===
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // マインドマップのコレクションのルール
    match /mindmaps/{document} {
      // 作成: 認証済みユーザーが自分のuserIdで作成する場合のみ
      allow create: if request.auth != null 
                    && request.auth.uid == request.resource.data.userId;
      
      // 読み取り, 更新, 削除: 認証済みユーザーで、自分が作成したドキュメントのみ
      allow read, update, delete: if request.auth != null 
                                  && request.auth.uid == resource.data.userId;
    }
  }
}

// === トラブルシューティング手順 ===
/*
1. Firebase Console にアクセス
   https://console.firebase.google.com/

2. プロジェクト "ideaweaver-app" を選択

3. Firestore Database > ルール をクリック

4. まず "デバッグ用ルール" を試してください:
   - 上記のデバッグ用ルールをコピー
   - 「公開」をクリック
   - アプリをテストして権限エラーが解決するか確認

5. デバッグ用ルールで動作する場合:
   - 本番用ルールに切り替え
   - エラーが再発する場合、認証状態に問題があります

6. まだエラーが発生する場合:
   - ブラウザのコンソールで詳細なログを確認
   - 認証状態とuserIdを確認
*/
