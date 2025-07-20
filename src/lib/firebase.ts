
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration (デモ用設定 - 実際の環境では環境変数を使用してください)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "ideaweaver-demo.firebaseapp.com",
  projectId: "ideaweaver-demo",
  storageBucket: "ideaweaver-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
