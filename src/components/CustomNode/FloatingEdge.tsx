import { BaseEdge, getStraightPath, useInternalNode } from '@xyflow/react';

import { getEdgeParams } from '@/lib/utils.js';

type FloatingEdgeProps = {
  id: string;
  source: string;
  target: string;
  markerEnd?: string;
  style?: React.CSSProperties;
};

function FloatingEdge({ id, source, target, markerEnd, style }: FloatingEdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  const [path] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  return (
    <BaseEdge
      id={id}
      className="react-flow__edge-path"
      path={path}
      markerEnd={markerEnd}
      style={style}
    />
  );
}

export default FloatingEdge;