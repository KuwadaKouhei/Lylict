"use client";
import { useCallback, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  addEdge,
  Node,
  Edge,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import { setNodes, setEdges, addNode, removeNode, addEdge as mindmapAddEdge, saveCurrentMindMap, setCurrentMindMapTitle, createNewMindMap, updateNodeColor } from '../../lib/features/mindmap/mindmapSlice';
import { Button, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import ContextMenu from '../../components/ContextMenu/ContextMenu';
import CustomNode from '../../components/CustomNode/CustomNode';
import FloatingEdge from '../../components/CustomNode/FloatingEdge';
import CustomConnectionLine from '../../components/CustomConnectionLine';
import Sidebar from '../../components/Sidebar/Sidebar';
import MindMapFlow from '../../components/MindMapFlow/MindMapFlow';
import NodeTextModal from '../../components/NodeTextModal/NodeTextModal';
import { getMindMap, updateMindMap } from '../../lib/mindmapService';
import { onAuthStateChange, handleRedirectResult } from '../../lib/auth';
import { User } from 'firebase/auth';
import LoginPrompt from '../../components/LoginPrompt';

const nodeTypes = {
  customNode: CustomNode as any,
};

const edgeTypes = {
  floating: FloatingEdge,
};


const MindMapFlowInternal = () => {
  const dispatch: AppDispatch = useDispatch();
  const mindmapState = useSelector((state: RootState) => state.mindmap);
  const { 
    nodes, 
    edges: originalEdges
  } = mindmapState;
  
  // デバッグログ: Redux storeからのデータを確認
  console.log('🔍 MindMapFlowInternal - Redux State:', {
    nodesCount: nodes.length,
    edgesCount: originalEdges.length,
    nodes: nodes,
    edges: originalEdges,
    mindmapState
  });
  
  // エッジにfloatingタイプを適用
  const edges = originalEdges.map(edge => ({
    ...edge,
    type: edge.type || 'floating',
  }));

  // デバッグログを削除してパフォーマンスを改善
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number; nodeId: string } | null>(null);
  const [showNodeTextModal, setShowNodeTextModal] = useState(false);
  const [pendingNodeData, setPendingNodeData] = useState<{ targetNodeId: string; position: { x: number; y: number } } | null>(null);
  const { fitView } = useReactFlow();

  // 最も近いハンドルを計算する関数
  const getClosestHandle = (sourceNode: Node, targetNode: Node) => {
    // ノードの実際のサイズを取得（デフォルト値を使用）
    const sourceWidth = sourceNode.width || (sourceNode as any).computed?.width || 150;
    const sourceHeight = sourceNode.height || (sourceNode as any).computed?.height || 40;
    const targetWidth = targetNode.width || (targetNode as any).computed?.width || 150;
    const targetHeight = targetNode.height || (targetNode as any).computed?.height || 40;

    // 各ハンドル位置を計算（実測値を優先）
    const getHandlePositions = (node: Node, width: number, height: number) => {
      // ノードの絶対位置を取得（Reactフローが計算した位置を使用）
      const nodeX = (node as any)?.internals?.positionAbsolute?.x || node.position.x;
      const nodeY = (node as any)?.internals?.positionAbsolute?.y || node.position.y;
      
      return {
        top: { x: nodeX + width / 2, y: nodeY },
        bottom: { x: nodeX + width / 2, y: nodeY + height },
        left: { x: nodeX, y: nodeY + height / 2 },
        right: { x: nodeX + width, y: nodeY + height / 2 }
      };
    };

    const sourceHandles = getHandlePositions(sourceNode, sourceWidth, sourceHeight);
    const targetHandles = getHandlePositions(targetNode, targetWidth, targetHeight);

    // 全てのハンドル組み合わせの距離を計算
    let minDistance = Infinity;
    let bestCombination = { sourceHandle: 'right', targetHandle: 'left' };

    Object.entries(sourceHandles).forEach(([sourceHandleId, sourcePos]) => {
      Object.entries(targetHandles).forEach(([targetHandleId, targetPos]) => {
        const distance = Math.sqrt(
          Math.pow(targetPos.x - sourcePos.x, 2) + 
          Math.pow(targetPos.y - sourcePos.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          bestCombination = { 
            sourceHandle: sourceHandleId, 
            targetHandle: targetHandleId 
          };
        }
      });
    });

    
    return bestCombination;
  };

  // エッジのハンドルを更新する関数
  const updateEdgeHandles = useCallback(() => {
    // 最も近いハンドルを計算する関数をここで定義
    const getClosestHandleLocal = (sourceNode: Node, targetNode: Node) => {
      const sourceWidth = sourceNode.width || (sourceNode as any).computed?.width || 150;
      const sourceHeight = sourceNode.height || (sourceNode as any).computed?.height || 40;
      const targetWidth = targetNode.width || (targetNode as any).computed?.width || 150;
      const targetHeight = targetNode.height || (targetNode as any).computed?.height || 40;

      const getHandlePositions = (node: Node, width: number, height: number) => {
        // ノードの絶対位置を取得（Reactフローが計算した位置を使用）
        const nodeX = (node as any)?.internals?.positionAbsolute?.x || node.position.x;
        const nodeY = (node as any)?.internals?.positionAbsolute?.y || node.position.y;
        
        return {
          top: { x: nodeX + width / 2, y: nodeY },
          bottom: { x: nodeX + width / 2, y: nodeY + height },
          left: { x: nodeX, y: nodeY + height / 2 },
          right: { x: nodeX + width, y: nodeY + height / 2 }
        };
      };

      const sourceHandles = getHandlePositions(sourceNode, sourceWidth, sourceHeight);
      const targetHandles = getHandlePositions(targetNode, targetWidth, targetHeight);

      let minDistance = Infinity;
      let bestCombination = { sourceHandle: 'right', targetHandle: 'left' };
      
      Object.entries(sourceHandles).forEach(([sourceHandleId, sourcePos]) => {
        Object.entries(targetHandles).forEach(([targetHandleId, targetPos]) => {
          const distance = Math.sqrt(
            Math.pow(targetPos.x - sourcePos.x, 2) + 
            Math.pow(targetPos.y - sourcePos.y, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            bestCombination = { 
              sourceHandle: sourceHandleId, 
              targetHandle: targetHandleId 
            };
          }
        });
      });
      return bestCombination;
    };

    const updatedEdges = originalEdges.map(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (sourceNode && targetNode) {
        const { sourceHandle, targetHandle } = getClosestHandleLocal(sourceNode, targetNode);
        
        const changed = edge.sourceHandle !== sourceHandle || edge.targetHandle !== targetHandle;
        if (changed) {
        }
        
        return {
          ...edge,
          type: edge.type || 'floating',
          sourceHandle,
          targetHandle,
        };
      }
      return {
        ...edge,
        type: edge.type || 'floating',
      };
    });
    
    // Redux状態を更新
    setTimeout(() => {
      dispatch(setEdges(updatedEdges));
    }, 10);
  }, [nodes, originalEdges, dispatch]);

  // 既存エッジのハンドル最適化を実行（ノード移動時のみ）
  useEffect(() => {
    
    // 初期読み込み時や自動生成時のみ実行（無限ループ防止）
    if (nodes.length > 0 && originalEdges.length > 0) {
      
      // エッジの最適化が必要かどうかをチェック
      let needsOptimization = false;
      
      for (const edge of originalEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          // 現在のハンドルが最適かどうかを確認
          const { sourceHandle: optimalSource, targetHandle: optimalTarget } = getClosestHandle(sourceNode, targetNode);
          
          if (edge.sourceHandle !== optimalSource || edge.targetHandle !== optimalTarget) {
            needsOptimization = true;
            break;
          }
        }
      }
      
      if (needsOptimization) {
        updateEdgeHandles();
      }
    }
  }, [nodes.length, originalEdges.length]); // updateEdgeHandlesを依存関係から除去
  
  // デバッグログを削除してパフォーマンスを改善

  // ノードが変更された時にfitViewを実行（初期ノード作成時用）
  useEffect(() => {
    if (nodes.length === 1 && edges.length === 0) {
      // 初期ノードが1つだけの場合は中央にフィット
      setTimeout(() => {
        fitView({ 
          duration: 500,
          padding: 0.2,
          minZoom: 1,
          maxZoom: 1.5
        });
      }, 100);
    } else if (nodes.length > 1 && edges.length > 0) {
      // AI自動生成や複数ノードがある場合は全体を表示
      setTimeout(() => {
        fitView({ 
          duration: 800,
          padding: 0.15,
          minZoom: 0.1,
          maxZoom: 1.5
        });
      }, 200);
    }
  }, [nodes, edges, fitView]);

  // 既存ノードとの重複をチェックする関数
  const isPositionOccupied = (x: number, y: number, threshold: number = 100) => {
    return nodes.some(node => {
      const distance = Math.sqrt(Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2));
      return distance < threshold;
    });
  };

  // 時計回りで空いている位置を見つける関数
  const findAvailablePosition = (centerNode: Node, distance: number = 200) => {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315]; // 8方向（0度は真上から開始）
    
    for (const angle of angles) {
      const angleRad = angle * (Math.PI / 180);
      const newX = centerNode.position.x + Math.sin(angleRad) * distance;
      const newY = centerNode.position.y - Math.cos(angleRad) * distance;
      
      if (!isPositionOccupied(newX, newY)) {
        return { x: newX, y: newY };
      }
    }
    
    // すべての基本位置が埋まっている場合、距離を増やして再試行
    return findAvailablePosition(centerNode, distance + 50);
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Reduxからのイミュータブルな状態をディープコピーしてミュータブルにする
      const mutableNodes = JSON.parse(JSON.stringify(nodes));
      const newNodes = applyNodeChanges(changes, mutableNodes);
      dispatch(setNodes(newNodes));
      
      // ドラッグ終了時のみエッジのハンドルを更新
      const hasPositionChangeComplete = changes.some(change => 
        change.type === 'position' && change.dragging === false
      );
      if (hasPositionChangeComplete) {
        // ドラッグ完了時のみエッジを再計算（パフォーマンス改善）
        setTimeout(() => updateEdgeHandles(), 50);
      }
    },
    [dispatch, nodes, updateEdgeHandles]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges);
      dispatch(setEdges(newEdges));
    },
    [dispatch, edges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // 接続されるノードを取得
      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);
      
      let finalConnection = { ...connection };
      
      if (sourceNode && targetNode) {
        // 最適なハンドルを自動選択
        const { sourceHandle, targetHandle } = getClosestHandle(sourceNode, targetNode);
        finalConnection = {
          ...connection,
          sourceHandle,
          targetHandle,
        };
      } else {
        // フォールバック: ユーザーが指定したハンドルを正規化
        const normalizeHandleId = (handleId: string | null | undefined) => {
          if (!handleId) return 'right';
          const validHandleIds = ['top', 'bottom', 'left', 'right'];
          const cleanId = handleId.replace(/^(source-|target-)/, '');
          return validHandleIds.includes(cleanId) ? cleanId : 'right';
        };
        
        finalConnection = {
          ...connection,
          sourceHandle: normalizeHandleId(connection.sourceHandle),
          targetHandle: normalizeHandleId(connection.targetHandle),
        };
      }

      const newEdge = addEdge({
        ...finalConnection,
        type: 'floating',
      }, edges);
      
      dispatch(setEdges(newEdge));
    },
    [dispatch, edges, nodes, getClosestHandle]
  );


  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({ top: event.clientY, left: event.clientX, nodeId: node.id });
    },
    []
  );

  const onPaneClick = useCallback(() => setContextMenu(null), []);

  const handleAddFromContextMenu = () => {
    if (!contextMenu) return;
    const targetNodeId = contextMenu.nodeId;
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return;

    // 空いている位置を時計回りで探す
    const availablePosition = findAvailablePosition(targetNode);

    // モーダル表示のための情報を保存
    setPendingNodeData({
      targetNodeId,
      position: availablePosition
    });
    setShowNodeTextModal(true);
    setContextMenu(null);
  };

  const handleNodeTextConfirm = (text: string) => {
    if (!pendingNodeData) return;

    const targetNode = nodes.find(n => n.id === pendingNodeData.targetNodeId);
    if (!targetNode) return;

    const newNode: Node = {
      id: (nodes.length + 1).toString(),
      type: 'customNode',
      data: { label: text, isNew: true },
      position: pendingNodeData.position,
    };
    dispatch(addNode(newNode));

    // 新しいエッジにも最適なハンドルを設定
    const { sourceHandle, targetHandle } = getClosestHandle(targetNode, newNode);
    const newEdge: Edge = {
      id: `e${pendingNodeData.targetNodeId}-${newNode.id}`,
      source: pendingNodeData.targetNodeId,
      target: newNode.id,
      type: 'floating',
      sourceHandle,
      targetHandle,
    };
    dispatch(mindmapAddEdge(newEdge));

    // 新しいノードを追加した後、全てのノードが見えるようにビューを調整
    setTimeout(() => {
      fitView({ 
        duration: 500,
        padding: 0.1,
        minZoom: 0.1,
        maxZoom: 1.5
      });
    }, 100);

    setShowNodeTextModal(false);
    setPendingNodeData(null);
  };

  const handleNodeTextClose = () => {
    setShowNodeTextModal(false);
    setPendingNodeData(null);
  };

  const handleDeleteFromContextMenu = () => {
    if (!contextMenu) return;
    dispatch(removeNode(contextMenu.nodeId));
    setContextMenu(null);
  };

  const handleColorSelectFromContextMenu = (color: string) => {
    if (!contextMenu) return;
    dispatch(updateNodeColor({ nodeId: contextMenu.nodeId, color }));
    setContextMenu(null);
  };

  // ReactFlowに渡すprops
  const reactFlowProps = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeContextMenu,
    onPaneClick,
    nodeTypes,
    edgeTypes,
    connectionLineComponent: CustomConnectionLine,
    defaultViewport: { x: 0, y: 0, zoom: 1.5 },
    minZoom: 0.05,
    maxZoom: 3,
  };

  // デバッグログを削除してパフォーマンスを改善

  // ReactFlowに渡すデータの最終確認
  console.log('⚡ ReactFlowに渡すデータ:', {
    nodesCount: nodes.length,
    edgesCount: edges.length,
    nodes: nodes,
    edges: edges
  });

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={CustomConnectionLine}
        connectOnClick={false}
        connectionMode={'loose' as any}
        connectionRadius={20}
        defaultViewport={{ 
          x: 0, 
          y: 0, 
          zoom: typeof window !== 'undefined' && window.innerWidth <= 768 ? 1.0 : 1.5 
        }}
        minZoom={0.05}
        maxZoom={3}
      >
        <Background />
        <MindMapFlow />
      </ReactFlow>
      
      {contextMenu && (
        <ContextMenu
          top={contextMenu.top}
          left={contextMenu.left}
          onAdd={handleAddFromContextMenu}
          onDelete={handleDeleteFromContextMenu}
          onColorSelect={handleColorSelectFromContextMenu}
        />
      )}
      
      <NodeTextModal
        isOpen={showNodeTextModal}
        onClose={handleNodeTextClose}
        onConfirm={handleNodeTextConfirm}
        title="新しいノードを追加"
      />
    </>
  );
};

const MindMapPage = () => {
  const { currentMindMapTitle, isLoading, nodes, edges } = useSelector((state: RootState) => state.mindmap);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
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

  // 認証状態の監視とリダイレクト結果の処理
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setAuthInitialized(true);
    });
    
    // リダイレクト認証の結果をチェック
    const checkRedirectResult = async () => {
      try {
        const user = await handleRedirectResult();
        if (user) {
          setUser(user);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        setAuthInitialized(true);
      }
    };

    checkRedirectResult();
    
    return () => unsubscribe();
  }, []);

  // URLパラメータから編集モードを検出し、既存データを読み込み
  useEffect(() => {
    // 認証状態の初期化を待つ
    if (!authInitialized) return;
    
    const id = searchParams.get('id');
    const title = searchParams.get('title');
    const firstWord = searchParams.get('firstWord');
    const autoGenerate = searchParams.get('autoGenerate');
    
    if (id && user) {
      // 編集モード（ユーザーがログインしている場合のみ）
      setEditingId(id);
      loadExistingMindMap(id);
    } else if (id && !user) {
      // ログインしていない場合は、ホームに戻る
      router.push('/');
    } else {
      // 新規作成の場合
      setEditingId(null);
      
      // 自動生成モードの場合（データは既にReduxストアにセット済み）
      if (autoGenerate === 'true') {
        // 自動生成の場合は状態をリセットしない（データは既にセット済み）
        console.log('🚀 自動生成モード検出 - Redux状態確認:', {
          nodesCount: nodes.length,
          edgesCount: edges.length,
          currentTitle: currentMindMapTitle,
          nodes: nodes,
          edges: edges
        });
      }
      // 手動作成モードの場合は状態をリセット
      else {
        dispatch(createNewMindMap());
        
        // タイトルが指定されている場合は設定
        if (title) {
          dispatch(setCurrentMindMapTitle(decodeURIComponent(title)));
        }
      }
      
      // 最初のワードが指定されている場合は初期ノードを作成（手動入力モード）
      if (firstWord) {
        const initialNode = {
          id: '1',
          type: 'customNode',
          data: { label: decodeURIComponent(firstWord), isNew: false },
          position: { x: 0, y: 0 }, // ReactFlowの座標系の中心
        };
        dispatch(setNodes([initialNode]));
        dispatch(setEdges([]));
      }
    }
    setInitialized(true);
  }, [searchParams, dispatch, authInitialized, user, router]);

  // 初期化が完了していない場合はローディング表示
  if (!initialized) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>読み込み中...</Typography>
      </div>
    );
  }

  const handleSave = async () => {
    // 認証チェック
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (editingId) {
      // 編集モード: 上書き保存
      try {
        await updateMindMap(editingId, {
          title: currentMindMapTitle,
          nodes,
          edges,
        });
        alert('マインドマップが更新されました');
      } catch (error: any) {
        console.error('マインドマップの更新エラー:', error);
        if (error.message === 'AUTHENTICATION_REQUIRED') {
          setShowLoginPrompt(true);
        } else {
          alert('保存中にエラーが発生しました');
        }
      }
    } else {
      // 新規作成モード: 新規保存
      try {
        await dispatch(saveCurrentMindMap()).unwrap();
        alert('マインドマップが保存されました');
      } catch (error: any) {
        console.error('マインドマップの保存エラー:', error);
        if (error.message === 'AUTHENTICATION_REQUIRED') {
          setShowLoginPrompt(true);
        } else {
          alert('保存中にエラーが発生しました');
        }
      }
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowLoginPrompt(false);
    // ログイン後に再度保存を試行
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  const handleGoHome = () => {
    router.push('/');
  };


  return (
    <div style={{ 
      height: '100vh', 
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* ヘッダー */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: { xs: '4px 8px', sm: 1 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          height: { xs: '48px', sm: '60px' },
          minHeight: { xs: '48px', sm: '60px' }
        }}
      >
        <IconButton 
          onClick={handleGoHome} 
          size="medium" 
          title="ホームに戻る"
          sx={{ fontSize: { xs: '20px', sm: '24px' } }}
        >
          <HomeIcon />
        </IconButton>
        
        <IconButton 
          onClick={() => setSidebarOpen(true)} 
          size="medium"
          sx={{ fontSize: { xs: '20px', sm: '24px' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          sx={{ 
            flexGrow: 1, 
            fontSize: { xs: '14px', sm: '18px' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {currentMindMapTitle} {editingId && <span style={{ fontSize: '0.8em', color: '#666' }}>(編集中)</span>}
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<SaveIcon sx={{ fontSize: { xs: '16px', sm: '20px' } }} />}
          onClick={handleSave}
          disabled={isLoading}
          size="small"
          sx={{ 
            fontSize: { xs: '12px', sm: '14px' },
            padding: { xs: '4px 8px', sm: '6px 16px' },
            minWidth: { xs: '60px', sm: 'auto' }
          }}
        >
          {editingId ? '更新' : '保存'}
        </Button>
      </Box>
      
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '48px', sm: '60px' },
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'visible',
          zIndex: 1
        }}
      >
        <ReactFlowProvider>
          <MindMapFlowInternal />
        </ReactFlowProvider>
      </Box>
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <LoginPrompt 
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLoginSuccess={handleLoginSuccess}
        message="マインドマップを保存するにはログインが必要です。"
      />
    </div>
  );
};

// Suspenseで囲んでuseSearchParamsの問題を解決
const MindMapPageWithSuspense = () => (
  <Suspense fallback={<div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>読み込み中...</Typography>
  </div>}>
    <MindMapPage />
  </Suspense>
);

export default MindMapPageWithSuspense;
