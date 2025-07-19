"use client"
import Box from '@mui/system/Box'
import { useState, useCallback, useRef } from 'react'
import { 
  ReactFlow, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  NodeChange, 
  EdgeChange,
  Background,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import ContextMenu from '@/components/ContextMenu'

// type MindMapPageProps = {
//   params: {
//     nodes: [
//       {id: string, position: { x: number; y: number; }; data: { label: string; }}
//     ] ,
//     edges: [
//       {id: string, source: string, target: string; }
//     ]
//   };
// };

export default function MindMapPage() {
  const initialNodes = [
    { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  ];
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState<{ id: string; source: string; target: string; }[]>([]);
  const [menu, setMenu] = useState<{
    id: string;
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const onPaneClick = useCallback(() => {
    setMenu(null);
  }, [setMenu]);
    const onNodesChange = useCallback(
      (changes: NodeChange<{ id: string; position: { x: number; y: number; }; data: { label: string; }; }>[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
      [],
    );
    const onEdgesChange = useCallback(
      (changes: EdgeChange<{ id: string; source: string; target: string; }>[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
      [],
    );
    const onConnect = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
      [],
    );
    type CustomNode = {
      id: string;
      position: { x: number; y: number; };
      data: { label: string; };
    };

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: CustomNode) => {
      // Prevent native context menu from showing
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
      <div style={{ border: '1px solid #ccc'}} onContextMenu={e => e.preventDefault()}>Right click to open menu</div>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ width: '80vw', height: '80vh',border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <ReactFlow
            ref={ref}
            nodes={nodes}
            edges={edges}
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