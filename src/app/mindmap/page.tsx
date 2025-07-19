"use client"
import Box from '@mui/system/Box'
import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  ReactFlow, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  NodeChange, 
  EdgeChange,
  Background,
  Connection,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import ContextMenu from '@/components/ContextMenu'
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../lib/store';
import { 
  setMMapId,
  setMMapData,
  insertNode,
  removeNode,
  insertEdge,
  removeEdge,
  changeNodePosition,
} from '../../lib/features/mmapSlice';
import { Button } from '@mui/material'
import TextNode from '@/components/CustomNode';

export default function MindMapPage() {
  // 型宣言
  interface MindMapNodeData {
    text: string;
  }

  interface MindMapNode {
    id: string;
    position: { x: number; y: number };
    data: MindMapNodeData;
    type: string;
  }

  interface MindMapEdge {
    id: string;
    source: string;
    target: string;
  }

  // 変数宣言
  const dispatch = useDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const nodeTypes = {
    text: TextNode,
  }

  const mmap = useSelector((state: RootState) => state.mmap);
  console.log("mmap", mmap);

  const [nodes, setNodes] = useNodesState(
    (mmap.nodes as MindMapNode[]).map(node => ({
      ...node,
      data: { ...node.data }
    }))
  );

  const [edges, setEdges] = useEdgesState(
    (mmap.edges as MindMapEdge[]).map(edge => ({
      ...edge,
    }))
  );
  const [menu, setMenu] = useState<{
    id: string;
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  } | null>(null);

  useEffect(() => {
    console.log("useEffect: nodes", nodes);
  }, [nodes]);
  useEffect(() => {
    console.log("useEffect: edges", edges);
  }, [edges]);

  // 関数宣言
  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, [setMenu]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot))
      dispatch(insertEdge({
        id: `${params.source}->${params.target}`,
        source: params.source,
        target: params.target,
      }));
    },
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<{ id: string; source: string; target: string }>[]) => {
      setEdges((oldEdges) => applyEdgeChanges(changes, oldEdges));
      changes.forEach(change => {
        if (change.type === 'remove') {
          dispatch(removeEdge(change.id));
        } else if (change.type === 'add') {
          dispatch(insertEdge(change.item));
        }
      });
    },
    [setEdges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<{ data: { text: string }; id: string; position: { x: number; y: number }; type: string }>[]) => {
      setNodes((oldNodes) => applyNodeChanges(changes, oldNodes));
      changes.forEach(change => {
        if (change.type === 'remove') {
          dispatch(removeNode(change.id));
        } else if (change.type === 'add') {
          dispatch(insertNode(change.item));
        } else if (change.type === 'position') {
          dispatch(changeNodePosition({ id: change.id, position: change.position }));
        }
      });
    },
    [setNodes],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: MindMapNode) => {
      event.preventDefault();
      const pane = ref.current?.getBoundingClientRect();

      if (pane) {
        const x = event.clientX - pane.left;
        const y = event.clientY - pane.top;
        setMenu({
          id: node.id,
          top: event.clientY < pane.height - 200 ? y : undefined,
          left: event.clientX < pane.width - 200 ? x : undefined,
          right: event.clientX >= pane.width - 200 ? pane.width - x : undefined,
          bottom: event.clientY >= pane.height - 200 ? pane.height - y : undefined,
        });
      }
    },
    [setMenu],
  )

  return (
    <div>
      <Box sx={{ p: 3, fontSize: '30px' }}>Mind Map</Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ width: '80vw', height: '80vh',border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', borderRadius: '20px' }}>
          <ReactFlow
            ref={ref}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onContextMenu={e => e.preventDefault()}
            onNodeContextMenu={onNodeContextMenu}
            fitView
          >
            <Background />
            {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
          </ReactFlow>
          </div>
      </Box>
    </div>
  );
}