'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllMindMaps, deleteMindMap, MindMap } from '@/lib/mindmapService';
import TitleInputModal from '@/components/TitleInputModal';
import styles from './page.module.css';

export default function Home() {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadMindMaps();
  }, []);

  const loadMindMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const maps = await getAllMindMaps();
      setMindMaps(maps);
    } catch (err) {
      console.error('マインドマップの読み込みエラー:', err);
      setError('マインドマップの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このマインドマップを削除しますか？')) return;
    
    try {
      await deleteMindMap(id);
      setMindMaps(mindMaps.filter(map => map.id !== id));
    } catch (err) {
      console.error('マインドマップの削除エラー:', err);
      setError('マインドマップの削除中にエラーが発生しました');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCreateNew = () => {
    setShowTitleModal(true);
  };

  const handleTitleConfirm = (title: string, firstWord: string) => {
    setShowTitleModal(false);
    // タイトルと最初のワードをURLパラメータとして渡してマインドマップ画面に遷移
    router.push(`/mindmap?title=${encodeURIComponent(title)}&firstWord=${encodeURIComponent(firstWord)}`);
  };

  const handleTitleModalClose = () => {
    setShowTitleModal(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>IdeaWeaver</h1>
        <p className={styles.subtitle}>アイデアを可視化し、創造性を解き放とう</p>
        <button onClick={handleCreateNew} className={styles.createButton}>
          新しいマインドマップを作成
        </button>
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button onClick={loadMindMaps} className={styles.retryButton}>
              再試行
            </button>
          </div>
        )}

        {mindMaps.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🧠</div>
            <h2>まだマインドマップがありません</h2>
            <p>最初のマインドマップを作成して、アイデアの整理を始めましょう</p>
            <button onClick={handleCreateNew} className={styles.createButton}>
              最初のマインドマップを作成
            </button>
          </div>
        ) : (
          <>
            <div className={styles.stats}>
              <span className={styles.count}>合計 {mindMaps.length} 個のマインドマップ</span>
            </div>
            <div className={styles.grid}>
              {mindMaps.map((mindMap) => (
                <div key={mindMap.id} className={styles.card}>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{mindMap.title}</h3>
                    <div className={styles.cardMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>ノード数:</span>
                        <span className={styles.metaValue}>{mindMap.nodes.length}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>作成日:</span>
                        <span className={styles.metaValue}>{formatDate(mindMap.createdAt)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>更新日:</span>
                        <span className={styles.metaValue}>{formatDate(mindMap.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Link 
                      href={`/mindmap?id=${mindMap.id}`} 
                      className={styles.editButton}
                    >
                      編集
                    </Link>
                    <button 
                      onClick={() => mindMap.id && handleDelete(mindMap.id)}
                      className={styles.deleteButton}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <TitleInputModal
        isOpen={showTitleModal}
        onClose={handleTitleModalClose}
        onConfirm={handleTitleConfirm}
      />
    </div>
  );
}
