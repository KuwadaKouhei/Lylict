'use client';

import { useState } from 'react';
import styles from './TitleInputModal.module.css';

interface TitleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, firstWord: string) => void;
  onAutoGenerate: (title: string, keyword: string, mode: 'noun' | 'poetic', generations: number) => void;
  initialTitle?: string;
  initialFirstWord?: string;
}

export default function TitleInputModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  onAutoGenerate,
  initialTitle = '',
  initialFirstWord = ''
}: TitleInputModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [firstWord, setFirstWord] = useState(initialFirstWord);
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [keyword, setKeyword] = useState('');
  const [autoTitle, setAutoTitle] = useState('');
  const [mode, setMode] = useState<'noun' | 'poetic'>('noun');
  const [generations, setGenerations] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && firstWord.trim()) {
      onConfirm(title.trim(), firstWord.trim());
      resetForm();
    }
  };

  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !autoTitle.trim()) return;
    
    setIsGenerating(true);
    try {
      await onAutoGenerate(autoTitle.trim(), keyword.trim(), mode, generations);
      resetForm();
    } catch (error) {
      console.error('自動生成エラー:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setFirstWord('');
    setKeyword('');
    setAutoTitle('');
    setGenerations(2);
    setActiveTab('manual');
    setIsGenerating(false);
  };

  const handleClose = () => {
    resetForm();
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

        {/* タブナビゲーション */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'manual' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('manual')}
            type="button"
          >
            🖊️ 手動入力
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'auto' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('auto')}
            type="button"
          >
            🤖 AI自動生成
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className={styles.tabContent}>
          {activeTab === 'manual' ? (
            <form onSubmit={handleManualSubmit} className={styles.form}>
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
          ) : (
            <form onSubmit={handleAutoGenerate} className={styles.form}>
              <div className={styles.autoGenerateInfo}>
                <p className={styles.description}>
                  AIがキーワードから関連する言葉を自動生成し、マインドマップを作成します
                </p>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="auto-title" className={styles.label}>
                  タイトル
                </label>
                <input
                  id="auto-title"
                  type="text"
                  value={autoTitle}
                  onChange={(e) => setAutoTitle(e.target.value)}
                  placeholder="マインドマップのタイトルを入力してください"
                  className={styles.input}
                  maxLength={100}
                  disabled={isGenerating}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="keyword" className={styles.label}>
                  キーワード
                </label>
                <input
                  id="keyword"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="例: 海、愛、夢、仕事"
                  className={styles.input}
                  maxLength={50}
                  disabled={isGenerating}
                />
                <p className={styles.hint}>
                  このキーワードを中心に関連する言葉が自動生成されます
                </p>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="mode" className={styles.label}>
                  生成モード
                </label>
                <select
                  id="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'noun' | 'poetic')}
                  className={styles.select}
                  disabled={isGenerating}
                >
                  <option value="noun">名詞モード（具体的な言葉）</option>
                  <option value="poetic" disabled>詩的モード（美しい表現）※現在利用不可</option>
                </select>
                <p className={styles.hint}>
                  {mode === 'noun' 
                    ? '具体的で実用的な関連語を生成します' 
                    : '詩的で美しい表現を生成します（現在利用不可）'
                  }
                </p>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="generations" className={styles.label}>
                  世代数
                </label>
                <select
                  id="generations"
                  value={generations}
                  onChange={(e) => setGenerations(parseInt(e.target.value))}
                  className={styles.select}
                  disabled={isGenerating}
                >
                  <option value={2}>2世代（キーワード + 連想語）</option>
                  <option value={3}>3世代（階層的な連想）</option>
                </select>
                <p className={styles.hint}>
                  世代数が多いほど詳細な連想マップになります。世代数3の場合、第1世代（キーワード）→第2世代（6つの連想語）→第3世代（各3つの連想語）が生成されます
                </p>
              </div>
              
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.cancelButton}
                  disabled={isGenerating}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!keyword.trim() || !autoTitle.trim() || isGenerating}
                  className={styles.confirmButton}
                >
                  {isGenerating ? '生成中...' : '🚀 自動生成開始'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}