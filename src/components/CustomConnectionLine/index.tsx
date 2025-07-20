import React from 'react';
import { getStraightPath } from '@xyflow/react';

interface CustomConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  connectionLineStyle?: React.CSSProperties;
}
function CustomConnectionLine({ fromX, fromY, toX, toY, connectionLineStyle }: CustomConnectionLineProps) {
  console.log('CustomConnectionLine', { fromX, fromY, toX, toY, connectionLineStyle });
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });
  console.log('edgePath', edgePath);

  return (
    <g>
      <path style={connectionLineStyle} fill="none" d={edgePath} />
    </g>
  );
}

export default CustomConnectionLine;