"use client";
import { useCallback, useState } from 'react';
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
import { setNodes, setEdges, addNode, removeNode, addEdge as mindmapAddEdge, saveCurrentMindMap } from '../../lib/features/mindmap/mindmapSlice';
import { Button, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import ContextMenu from '../../components/ContextMenu/ContextMenu';
import CustomNode from '../../components/CustomNode/CustomNode';
import Sidebar from '../../components/Sidebar/Sidebar';
import MindMapFlow from '../../components/MindMapFlow/MindMapFlow';

const nodeTypes = {
  customNode: CustomNode,
};

const MindMapFlowInternal = () => {
  const dispatch: AppDispatch = useDispatch();
  const { nodes, edges } = useSelector((state: RootState) => state.mindmap);
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number; nodeId: string } | null>(null);
  const { fitView } = useReactFlow();

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

    const newNode: Node = {
      id: (nodes.length + 1).toString(),
      type: 'customNode',
      data: { label: `Node ${nodes.length + 1}`, isNew: true },
      position: availablePosition,
    };
    dispatch(addNode(newNode));

    // 新しいエッジにも最適なハンドルを設定
    const { sourceHandle, targetHandle } = getClosestHandle(targetNode, newNode);
    const newEdge: Edge = {
      id: `e${targetNodeId}-${newNode.id}`,
      source: targetNodeId,
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
    }, 100); // アニメーション完了後にfitViewを実行

    setContextMenu(null);
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
    </>
  );
};

const MindMapPage = () => {
  const { currentMindMapTitle, isLoading } = useSelector((state: RootState) => state.mindmap);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch: AppDispatch = useDispatch();

  const handleSave = () => {
    dispatch(saveCurrentMindMap());
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
        <IconButton onClick={() => setSidebarOpen(true)} size="large">
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {currentMindMapTitle}
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isLoading}
          size="small"
        >
          保存
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
