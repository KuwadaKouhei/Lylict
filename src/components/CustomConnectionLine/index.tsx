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
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  const defaultStyle = {
    stroke: 'url(#edge-gradient-connecting)',
    strokeWidth: 3,
    strokeDasharray: '8,4',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
    filter: 'drop-shadow(0 2px 6px rgba(99, 102, 241, 0.4))',
    animation: 'dash 1s linear infinite',
    ...connectionLineStyle,
  };

  return (
    <g>
      <defs>
        <linearGradient id="edge-gradient-connecting" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path style={defaultStyle} d={edgePath} />
    </g>
  );
}

export default CustomConnectionLine;