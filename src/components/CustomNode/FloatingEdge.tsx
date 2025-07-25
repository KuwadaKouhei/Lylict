import { BaseEdge, getStraightPath, useInternalNode, getNodesBounds, Position } from '@xyflow/react';

type FloatingEdgeProps = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  markerEnd?: string;
  style?: React.CSSProperties;
  [key: string]: any; // 追加のpropsを受け入れる
};

function FloatingEdge(props: FloatingEdgeProps) {
  const { id, source, target, sourceHandle, targetHandle, markerEnd, style } = props;
  
  // ReactFlowは sourceHandleId/targetHandleId として値を渡すため、それを使用
  const actualSourceHandle = sourceHandle || props.sourceHandleId;
  const actualTargetHandle = targetHandle || props.targetHandleId;
  
  // デバッグログを削除してパフォーマンスを改善
  
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // ハンドル位置を計算する関数
  const getHandlePosition = (node: any, handleId?: string) => {
    // ノードの実際のサイズを取得（実測値を優先）
    const nodeWidth = node.measured?.width || node.width || node.computed?.width || 150;
    const nodeHeight = node.measured?.height || node.height || node.computed?.height || 40;
    
    // ノードの絶対位置を取得
    const nodeX = node.internals?.positionAbsolute?.x || node.position.x;
    const nodeY = node.internals?.positionAbsolute?.y || node.position.y;
    
    const centerX = nodeX + nodeWidth / 2;
    const centerY = nodeY + nodeHeight / 2;

    // ハンドルIDを正規化
    const normalizedHandleId = handleId?.replace(/^(source-|target-)/, '') || 'right';
    
    switch (normalizedHandleId) {
      case 'top':
        return { x: centerX, y: nodeY };
      case 'bottom':
        return { x: centerX, y: nodeY + nodeHeight };
      case 'left':
        return { x: nodeX, y: centerY };
      case 'right':
        return { x: nodeX + nodeWidth, y: centerY };
      default:
        return { x: nodeX + nodeWidth, y: centerY }; // デフォルトは右
    }
  };

  const sourcePos = getHandlePosition(sourceNode, actualSourceHandle);
  const targetPos = getHandlePosition(targetNode, actualTargetHandle);
  
  // デバッグログを削除してパフォーマンスを改善

  const [path] = getStraightPath({
    sourceX: sourcePos.x,
    sourceY: sourcePos.y,
    targetX: targetPos.x,
    targetY: targetPos.y,
  });

  const defaultStyle = {
    stroke: 'url(#edge-gradient)',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...style,
  };

  return (
    <>
      {/* SVGグラデーション定義 */}
      <defs>
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
        </linearGradient>
        
        <linearGradient id="edge-gradient-hover" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
        </linearGradient>
        
        <linearGradient id="edge-gradient-selected" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
          <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
        </linearGradient>
        
        <linearGradient id="edge-gradient-connecting" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
        </linearGradient>
        
        <filter id="edge-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <BaseEdge
        id={id}
        className="react-flow__edge-path"
        path={path}
        markerEnd={markerEnd}
        style={defaultStyle}
      />
    </>
  );
}

export default FloatingEdge;