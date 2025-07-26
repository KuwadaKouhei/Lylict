import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// ポップアップ認証（デスクトップ推奨）
export const signInWithGooglePopup = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google popup sign in error:', error);
    
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      // ポップアップがブロックされた場合はリダイレクト認証を試行
      console.log('Popup blocked, falling back to redirect...');
      throw new Error('POPUP_BLOCKED');
    }
    
    // Firebase設定エラーの場合は特別なメッセージを表示
    if (error.code === 'auth/configuration-not-found') {
      throw new Error('Firebase設定が正しく設定されていません。.env.localファイルを確認してください。');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('ログインがキャンセルされました。');
    }
    
    throw error;
  }
};

// リダイレクト認証（モバイル・ポップアップブロック時）
export const signInWithGoogleRedirect = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error('Google redirect sign in error:', error);
    throw error;
  }
};

// リダイレクト結果の処理
export const handleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error: any) {
    console.error('Redirect result error:', error);
    throw error;
  }
};

// メイン認証関数（自動フォールバック付き）
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    // まずポップアップ認証を試行
    return await signInWithGooglePopup();
  } catch (error: any) {
    if (error.message === 'POPUP_BLOCKED') {
      // ポップアップがブロックされた場合はリダイレクト認証にフォールバック
      await signInWithGoogleRedirect();
      return null; // リダイレクト後は別ページで処理される
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const isUserAuthenticated = (): boolean => {
  return !!auth.currentUser;
};