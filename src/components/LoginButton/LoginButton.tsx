'use client';

import { useState } from 'react';
import { signInWithGoogle, logout } from '@/lib/auth';
import { User } from 'firebase/auth';
import styles from './LoginButton.module.css';

interface LoginButtonProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
}

export default function LoginButton({ user, onUserChange }: LoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onUserChange(user);
    } catch (error) {
      console.error('Login failed:', error);
      alert('ログインに失敗しました。再度お試しください。');
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