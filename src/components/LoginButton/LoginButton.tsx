'use client';

import { useState, useEffect } from 'react';
import { signInWithGoogle, logout, handleRedirectResult } from '@/lib/auth';
import { User } from 'firebase/auth';
import styles from './LoginButton.module.css';

interface LoginButtonProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
}

export default function LoginButton({ user, onUserChange }: LoginButtonProps) {
  const [loading, setLoading] = useState(false);

  // リダイレクト認証の結果をチェック
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const user = await handleRedirectResult();
        if (user) {
          onUserChange(user);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    // コンポーネントがマウントされた時にリダイレクト結果をチェック
    checkRedirectResult();
  }, [onUserChange]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onUserChange(user);
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'ログインに失敗しました。再度お試しください。';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      onUserChange(null);
    } catch (error) {
      console.error('Logout failed:', error);
      alert('ログアウトに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className={styles.userInfo}>
        <img 
          src={user.photoURL || '/default-avatar.png'} 
          alt={user.displayName || 'ユーザー'}
          className={styles.avatar}
        />
        <span className={styles.userName}>{user.displayName || 'ユーザー'}</span>
        <button 
          onClick={handleLogout}
          className={styles.logoutButton}
          disabled={loading}
        >
          {loading ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className={styles.loginButton}
      disabled={loading}
    >
      {loading ? 'ログイン中...' : 'Googleでログイン'}
    </button>
  );
}