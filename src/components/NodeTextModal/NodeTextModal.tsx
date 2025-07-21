'use client';

import { useState, useEffect } from 'react';
import styles from './NodeTextModal.module.css';

interface NodeTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  initialText?: string;
  title?: string;
}

export default function NodeTextModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialText = '',
  title = '新しいノードを追加'
}: NodeTextModalProps) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onConfirm(text.trim());
      setText('');
    }
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="node-text" className={styles.label}>
              ノードのテキスト
            </label>
            <input
              id="node-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ノードに表示するテキストを入力してください"
              className={styles.input}
              autoFocus
              maxLength={50}
            />
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
              disabled={!text.trim()}
              className={styles.confirmButton}
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}