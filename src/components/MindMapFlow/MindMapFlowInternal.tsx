"use client";

import { useCallback, useState, useEffect, memo } from 'react';
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
import { RootState, AppDispatch } from '@/lib/store';
import { 
  setNodes, 
  setEdges, 
  addNode, 
  removeNode, 
  addEdge as mindmapAddEdge, 
  updateNodeColor 
} from '@/lib/features/mindmap/mindmapSlice';
import ContextMenu from '../ContextMenu/ContextMenu';
import CustomNode from '../CustomNode/CustomNode';
import FloatingEdge from '../CustomNode/FloatingEdge';
import CustomConnectionLine from '../CustomConnectionLine';
import MindMapFlow from './MindMapFlow';
import NodeTextModal from '../NodeTextModal/NodeTextModal';

const nodeTypes = {
  customNode: CustomNode as any,
};

const edgeTypes = {
  floating: FloatingEdge,
};

interface PendingNodeData {
  targetNodeId: string;
  position: { x: number; y: number };
}

const MindMapFlowInternalComponent = memo(() => {
  const dispatch: AppDispatch = useDispatch();
  const mindmapState = useSelector((state: RootState) => state.mindmap);
  const { nodes, edges: originalEdges } = mindmapState;
  
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number; nodeId: string } | null>(null);
  const [showNodeTextModal, setShowNodeTextModal] = useState(false);
  const [pendingNodeData, setPendingNodeData] = useState<PendingNodeData | null>(null);
  const { fitView } = useReactFlow();

  // エッジにfloatingタイプを適用
  const edges = originalEdges.map(edge => ({
    ...edge,
    type: edge.type || 'floating',
  }));

  // 最も近いハンドルを計算する関数
  const getClosestHandle = useCallback((sourceNode: Node, targetNode: Node) => {
    const sourceWidth = sourceNode.width || (sourceNode as any).computed?.width || 150;
    const sourceHeight = sourceNode.height || (sourceNode as any).computed?.height || 40;
    const targetWidth = targetNode.width || (targetNode as any).computed?.width || 150;
    const targetHeight = targetNode.height || (targetNode as any).computed?.height || 40;

    const getHandlePositions = (node: Node, width: number, height: number) => {
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
  }, []);

  // エッジのハンドルを更新する関数
  const updateEdgeHandles = useCallback(() => {
    const updatedEdges = originalEdges.map(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (sourceNode && targetNode) {
        const { sourceHandle, targetHandle } = getClosestHandle(sourceNode, targetNode);
        
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
    
    setTimeout(() => {
      dispatch(setEdges(updatedEdges));
    }, 10);
  }, [nodes, originalEdges, dispatch, getClosestHandle]);

  // 既存エッジのハンドル最適化を実行
  useEffect(() => {
    if (nodes.length > 0 && originalEdges.length > 0) {
      let needsOptimization = false;
      
      for (const edge of originalEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
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
  }, [nodes.length, originalEdges.length, getClosestHandle, updateEdgeHandles]);

  // ノードが変更された時にfitViewを実行
  useEffect(() => {
    if (nodes.length === 1 && edges.length === 0) {
      setTimeout(() => {
        fitView({ 
          duration: 500,
          padding: 0.2,
          minZoom: 1,
          maxZoom: 1.5
        });
      }, 100);
    } else if (nodes.length > 1 && edges.length > 0) {
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
  const isPositionOccupied = useCallback((x: number, y: number, threshold: number = 100) => {
    return nodes.some(node => {
      const distance = Math.sqrt(Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2));
      return distance < threshold;
    });
  }, [nodes]);

  // 時計回りで空いている位置を見つける関数
  const findAvailablePosition = useCallback((centerNode: Node, distance: number = 200): { x: number; y: number } => {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    
    for (const angle of angles) {
      const angleRad = angle * (Math.PI / 180);
      const newX = centerNode.position.x + Math.sin(angleRad) * distance;
      const newY = centerNode.position.y - Math.cos(angleRad) * distance;
      
      if (!isPositionOccupied(newX, newY)) {
        return { x: newX, y: newY };
      }
    }
    
    return findAvailablePosition(centerNode, distance + 50);
  }, [isPositionOccupied]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const mutableNodes = JSON.parse(JSON.stringify(nodes));
      const newNodes = applyNodeChanges(changes, mutableNodes);
      dispatch(setNodes(newNodes));
      
      const hasPositionChangeComplete = changes.some(change => 
        change.type === 'position' && change.dragging === false
      );
      if (hasPositionChangeComplete) {
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
      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);
      
      let finalConnection = { ...connection };
      
      if (sourceNode && targetNode) {
        const { sourceHandle, targetHandle } = getClosestHandle(sourceNode, targetNode);
        finalConnection = {
          ...connection,
          sourceHandle,
          targetHandle,
        };
      } else {
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

  const handleAddFromContextMenu = useCallback(() => {
    if (!contextMenu) return;
    const targetNodeId = contextMenu.nodeId;
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return;

    const availablePosition = findAvailablePosition(targetNode);

    setPendingNodeData({
      targetNodeId,
      position: availablePosition
    });
    setShowNodeTextModal(true);
    setContextMenu(null);
  }, [contextMenu, nodes, findAvailablePosition]);

  const handleNodeTextConfirm = useCallback((text: string) => {
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
  }, [pendingNodeData, nodes, dispatch, getClosestHandle, fitView]);

  const handleNodeTextClose = useCallback(() => {
    setShowNodeTextModal(false);
    setPendingNodeData(null);
  }, []);

  const handleDeleteFromContextMenu = useCallback(() => {
    if (!contextMenu) return;
    dispatch(removeNode(contextMenu.nodeId));
    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleColorSelectFromContextMenu = useCallback((color: string) => {
    if (!contextMenu) return;
    dispatch(updateNodeColor({ nodeId: contextMenu.nodeId, color }));
    setContextMenu(null);
  }, [contextMenu, dispatch]);

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
});

MindMapFlowInternalComponent.displayName = 'MindMapFlowInternal';

// ReactFlowProviderでラップしたコンポーネント
export const MindMapFlowInternal = () => (
  <ReactFlowProvider>
    <MindMapFlowInternalComponent />
  </ReactFlowProvider>
);