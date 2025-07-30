import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { AppDispatch } from '../lib/store';
import { saveCurrentMindMap } from '../lib/features/mindmap/mindmapSlice';
import { updateMindMap } from '../lib/mindmapService';

interface UseMindMapActionsProps {
  user: User | null;
  editingId: string | null;
  currentMindMapTitle: string;
  nodes: any[];
  edges: any[];
  onShowLoginPrompt: () => void;
}

export const useMindMapActions = ({
  user,
  editingId,
  currentMindMapTitle,
  nodes,
  edges,
  onShowLoginPrompt
}: UseMindMapActionsProps) => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();

  const handleSave = useCallback(async () => {
    if (!user) {
      onShowLoginPrompt();
      return;
    }

    try {
      if (editingId) {
        await updateMindMap(editingId, {
          title: currentMindMapTitle,
          nodes,
          edges,
        });
        alert('マインドマップが更新されました');
      } else {
        await dispatch(saveCurrentMindMap()).unwrap();
        alert('マインドマップが保存されました');
      }
    } catch (error: any) {
      console.error('マインドマップの保存エラー:', error);
      if (error.message === 'AUTHENTICATION_REQUIRED') {
        onShowLoginPrompt();
      } else {
        alert('保存中にエラーが発生しました');
      }
    }
  }, [user, editingId, currentMindMapTitle, nodes, edges, dispatch, onShowLoginPrompt]);

  const handleGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  return {
    handleSave,
    handleGoHome
  };
};