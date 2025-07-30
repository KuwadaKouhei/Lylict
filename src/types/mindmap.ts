import { Node, Edge } from '@xyflow/react';

export interface MindMapNode extends Node {
  data: {
    label: string;
    isNew?: boolean;
    color?: string;
  };
}

export interface MindMapEdge extends Edge {
  type: 'floating';
  sourceHandle?: string;
  targetHandle?: string;
}

export interface MindMapData {
  id?: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  currentMindMapTitle: string;
  isLoading: boolean;
  error: string | null;
}

export interface ContextMenuData {
  top: number;
  left: number;
  nodeId: string;
}

export interface PendingNodeData {
  targetNodeId: string;
  position: { x: number; y: number };
}

export interface HandlePosition {
  x: number;
  y: number;
}

export interface HandlePositions {
  top: HandlePosition;
  bottom: HandlePosition;
  left: HandlePosition;
  right: HandlePosition;
}

export type HandleId = 'top' | 'bottom' | 'left' | 'right';

export interface BestHandleCombination {
  sourceHandle: HandleId;
  targetHandle: HandleId;
}