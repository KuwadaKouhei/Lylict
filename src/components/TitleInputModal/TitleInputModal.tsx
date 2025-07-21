'use client';

import { useState } from 'react';
import styles from './TitleInputModal.module.css';

interface TitleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, firstWord: string) => void;
  initialTitle?: string;
  initialFirstWord?: string;
}

export default function TitleInputModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialTitle = '',
  initialFirstWord = ''
}: TitleInputModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [firstWord, setFirstWord] = useState(initialFirstWord);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && firstWord.trim()) {
      onConfirm(title.trim(), firstWord.trim());
      setTitle('');
      setFirstWord('');
    }
  };

  const handleClose = () => {
    setTitle('');
    setFirstWord('');
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>新しいマインドマップを作成</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="mindmap-title" className={styles.label}>
              タイトル
            </label>
            <input
              id="mindmap-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="マインドマップのタイトルを入力してください"
              className={styles.input}
              autoFocus
              maxLength={100}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="first-word" className={styles.label}>
              最初のワード（中心テーマ）
            </label>
            <input
              id="first-word"
              type="text"
              value={firstWord}
              onChange={(e) => setFirstWord(e.target.value)}
              placeholder="マインドマップの中心となるワードを入力してください"
              className={styles.input}
              maxLength={50}
            />
            <p className={styles.hint}>
              このワードがマインドマップの中心ノードとして表示されます
            </p>
          </div>
          
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !firstWord.trim()}
              className={styles.confirmButton}
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}