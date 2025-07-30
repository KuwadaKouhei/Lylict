import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { User } from 'firebase/auth';
import { AppDispatch } from '../lib/store';
import { 
  setNodes, 
  setEdges, 
  setCurrentMindMapTitle, 
  createNewMindMap 
} from '../lib/features/mindmap/mindmapSlice';
import { getMindMap } from '../lib/mindmapService';

interface UseMindMapInitializationProps {
  authInitialized: boolean;
  user: User | null;
  nodes: any[];
  edges: any[];
  currentMindMapTitle: string;
  onSetEditingId: (id: string | null) => void;
  onSetInitialized: (initialized: boolean) => void;
}

export const useMindMapInitialization = ({
  authInitialized,
  user,
  nodes,
  edges,
  currentMindMapTitle,
  onSetEditingId,
  onSetInitialized
}: UseMindMapInitializationProps) => {
  const dispatch: AppDispatch = useDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();

  const loadExistingMindMap = async (id: string) => {
    try {
      const mindMap = await getMindMap(id);
      if (mindMap) {
        dispatch(setNodes(mindMap.nodes));
        dispatch(setEdges(mindMap.edges));
        dispatch(setCurrentMindMapTitle(mindMap.title));
      }
    } catch (error) {
      console.error('マインドマップの読み込みエラー:', error);
    }
  };

  useEffect(() => {
    if (!authInitialized) return;
    
    const id = searchParams.get('id');
    const title = searchParams.get('title');
    const firstWord = searchParams.get('firstWord');
    const autoGenerate = searchParams.get('autoGenerate');
    
    if (id && user) {
      onSetEditingId(id);
      loadExistingMindMap(id);
    } else if (id && !user) {
      router.push('/');
    } else {
      onSetEditingId(null);
      
      if (autoGenerate === 'true') {
        // 自動生成の場合は状態をリセットしない
        console.log('🚀 自動生成モード検出 - Redux状態確認:', {
          nodesCount: nodes.length,
          edgesCount: edges.length,
          currentTitle: currentMindMapTitle,
          nodes: nodes,
          edges: edges
        });
      } else {
        dispatch(createNewMindMap());
        
        if (title) {
          dispatch(setCurrentMindMapTitle(decodeURIComponent(title)));
        }
      }
      
      if (firstWord) {
        const initialNode = {
          id: '1',
          type: 'customNode',
          data: { label: decodeURIComponent(firstWord), isNew: false },
          position: { x: 0, y: 0 },
        };
        dispatch(setNodes([initialNode]));
        dispatch(setEdges([]));
      }
    }
    onSetInitialized(true);
  }, [searchParams, dispatch, authInitialized, user, router, nodes, edges, currentMindMapTitle, onSetEditingId, onSetInitialized]);
};