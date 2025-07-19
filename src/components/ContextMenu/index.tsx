import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './ContextMenu.css'; // Assuming you have a CSS file for styling
import Button from '@mui/material/Button';

type ContextMenuProps = {
  id: string
  top?: number
  left?: number
  right?: number
  bottom?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
};

export default function ContextMenu({
  id,
  top,
  left,
  right,
  bottom,
  ...props
}: ContextMenuProps) {
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();
  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;

    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    addNodes({
      ...node,
      selected: false,
      dragging: false,
      id: `${node.id}-copy`,
      position,
      data: node.data ?? {}, // Ensure data is always present
    });
  }, [id, getNode, addNodes]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
  }, [id, setNodes, setEdges]);

  return (
    <div
      style={{ top, left, right, bottom }}
      className="context-menu"
      {...props}
    >
      <p style={{ margin: '0.5em' }}>
        <small>node: {id}</small>
      </p>
      <Button onClick={duplicateNode}>追加</Button>
      <Button onClick={deleteNode}>削除</Button>
    </div>
  );
}