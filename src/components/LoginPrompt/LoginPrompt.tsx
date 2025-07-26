'use client';

import { useState, useEffect } from 'react';
import { signInWithGoogle, handleRedirectResult } from '@/lib/auth';
import { User } from 'firebase/auth';
import styles from './LoginPrompt.module.css';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  message?: string;
}

export default function LoginPrompt({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  message = 'マインドマップを保存するにはログインが必要です。' 
}: LoginPromptProps) {
  const [loading, setLoading] = useState(false);

  // リダイレクト認証の結果をチェック
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const user = await handleRedirectResult();
        if (user) {
          onLoginSuccess(user);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    // コンポーネントがマウントされた時にリダイレクト結果をチェック
    checkRedirectResult();
  }, [onLoginSuccess]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLoginSuccess(user);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'ログインに失敗しました。再度お試しください。';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>ログインが必要です</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.icon}>🔐</div>
          <p className={styles.message}>{message}</p>
          
          <div className={styles.actions}>
            <button 
              onClick={handleLogin}
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'Googleでログイン'}
            </button>
            <button 
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}