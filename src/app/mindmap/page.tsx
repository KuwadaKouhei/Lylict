"use client";
import { useCallback, useState, useEffect } from 'react';
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
import { setNodes, setEdges, addNode, removeNode, addEdge as mindmapAddEdge, saveCurrentMindMap, setCurrentMindMapTitle, createNewMindMap } from '../../lib/features/mindmap/mindmapSlice';
import { Button, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import ContextMenu from '../../components/ContextMenu/ContextMenu';
import CustomNode from '../../components/CustomNode/CustomNode';
import Sidebar from '../../components/Sidebar/Sidebar';
import MindMapFlow from '../../components/MindMapFlow/MindMapFlow';
import NodeTextModal from '../../components/NodeTextModal/NodeTextModal';
import { getMindMap, updateMindMap } from '../../lib/mindmapService';

const nodeTypes = {
  customNode: CustomNode,
};

const MindMapFlowInternal = () => {
  const dispatch: AppDispatch = useDispatch();
  const { nodes, edges } = useSelector((state: RootState) => state.mindmap);
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number; nodeId: string } | null>(null);
  const [showNodeTextModal, setShowNodeTextModal] = useState(false);
  const [pendingNodeData, setPendingNodeData] = useState<{ targetNodeId: string; position: { x: number; y: number } } | null>(null);
  const { fitView } = useReactFlow();

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
    }
  }, [nodes, edges, fitView]);

  // 最も近いハンドルを計算する関数
  const getClosestHandle = (sourceNode: Node, targetNode: Node) => {
    const sourcePos = sourceNode.position;
    const targetPos = targetNode.position;
    
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    
    let sourceHandle, targetHandle;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平方向の距離が大きい場合
      if (dx > 0) {
        sourceHandle = 'right';
        targetHandle = 'left';
      } else {
        sourceHandle = 'left';
        targetHandle = 'right';
      }
    } else {
      // 垂直方向の距離が大きい場合
      if (dy > 0) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else {
        sourceHandle = 'top';
        targetHandle = 'bottom';
      }
    }
    
    return { sourceHandle, targetHandle };
  };

  // エッジのハンドルを更新する関数
  const updateEdgeHandles = useCallback(() => {
    const updatedEdges = edges.map(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (sourceNode && targetNode) {
        const { sourceHandle, targetHandle } = getClosestHandle(sourceNode, targetNode);
        return {
          ...edge,
          sourceHandle,
          targetHandle,
        };
      }
      return edge;
    });
    
    dispatch(setEdges(updatedEdges));
  }, [nodes, edges, dispatch]);

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
      
      // ノードが移動した場合、エッジのハンドルを更新
      const hasPositionChange = changes.some(change => change.type === 'position');
      if (hasPositionChange) {
        // 次のレンダリングサイクルでエッジを更新
        setTimeout(() => updateEdgeHandles(), 0);
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
      // 接続時に最適なハンドルを自動選択
      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);
      
      if (sourceNode && targetNode) {
        const { sourceHandle, targetHandle } = getClosestHandle(sourceNode, targetNode);
        const optimizedConnection = {
          ...connection,
          sourceHandle,
          targetHandle,
        };
        const newEdge = addEdge(optimizedConnection, edges);
        dispatch(setEdges(newEdge));
      } else {
        const newEdge = addEdge(connection, edges);
        dispatch(setEdges(newEdge));
      }
    },
    [dispatch, edges, nodes]
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
        defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
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

  // URLパラメータから編集モードを検出し、既存データを読み込み
  useEffect(() => {
    const id = searchParams.get('id');
    const title = searchParams.get('title');
    const firstWord = searchParams.get('firstWord');
    
    if (id) {
      // 編集モード
      setEditingId(id);
      loadExistingMindMap(id);
    } else {
      // 新規作成の場合は状態をリセット
      setEditingId(null);
      dispatch(createNewMindMap());
      
      // タイトルが指定されている場合は設定
      if (title) {
        dispatch(setCurrentMindMapTitle(decodeURIComponent(title)));
      }
      
      // 最初のワードが指定されている場合は初期ノードを作成
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
  }, [searchParams, dispatch]);

  // 初期化が完了していない場合はローディング表示
  if (!initialized) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6">読み込み中...</Typography>
      </div>
    );
  }

  const handleSave = async () => {
    if (editingId) {
      // 編集モード: 上書き保存
      try {
        await updateMindMap(editingId, {
          title: currentMindMapTitle,
          nodes,
          edges,
        });
        alert('マインドマップが更新されました');
      } catch (error) {
        console.error('マインドマップの更新エラー:', error);
        alert('保存中にエラーが発生しました');
      }
    } else {
      // 新規作成モード: 新規保存
      dispatch(saveCurrentMindMap());
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
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
          padding: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton onClick={handleGoHome} size="large" title="ホームに戻る">
          <HomeIcon />
        </IconButton>
        
        <IconButton onClick={() => setSidebarOpen(true)} size="large">
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {currentMindMapTitle} {editingId && <span style={{ fontSize: '0.8em', color: '#666' }}>(編集中)</span>}
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isLoading}
          size="small"
        >
          {editingId ? '更新' : '保存'}
        </Button>
      </Box>
      
      <div style={{ paddingTop: '60px', height: 'calc(100vh - 60px)', position: 'relative' }}>
        <ReactFlowProvider>
          <MindMapFlowInternal />
        </ReactFlowProvider>
      </div>
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};


export default MindMapPage;
