
import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useDispatch, useSelector } from 'react-redux';
import { setNodes } from '../../lib/features/mindmap/mindmapSlice';
import { RootState } from '../../lib/store';
import { styled, keyframes } from '@mui/material/styles';

// 現代風ノード生成アニメーション
const nodeAppear = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-5deg);
    filter: blur(10px) brightness(0.5);
  }
  30% {
    opacity: 0.7;
    transform: scale(1.1) rotate(2deg);
    filter: blur(2px) brightness(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
    filter: blur(0px) brightness(1);
  }
`;

// 現代風パルスエフェクト
const nodePulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.7), 0 4px 16px rgba(0, 0, 0, 0.2);
    transform: scale(1.02);
  }
`;

const StyledNodeContainer = styled('div')<{ isNew?: boolean; isSelected?: boolean; generation?: number }>(({ theme, isNew, isSelected, generation }) => ({
  minWidth: 120,
  maxWidth: 200,
  padding: '12px 16px',
  border: 'none',
  borderRadius: 16,
  background: generation 
    ? getGenerationGradient(generation, isSelected || false)
    : (isSelected 
      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
  color: '#fff',
  textAlign: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  boxShadow: isSelected
    ? '0 6px 25px rgba(255, 107, 107, 0.5), 0 3px 12px rgba(0, 0, 0, 0.15)'
    : '0 4px 20px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '0.5px',
  wordBreak: 'break-word',
  
  // 現代的なグラスモーフィズム効果
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    padding: '1px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    WebkitMaskComposite: 'xor',
    pointerEvents: 'none',
  },
  
  ...(isNew && {
    animation: `${nodeAppear} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
  }),
  
  '&:hover': {
    background: generation 
      ? getGenerationGradient(generation, !isSelected)
      : (isSelected
        ? 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)'
        : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'),
    boxShadow: isSelected
      ? '0 10px 40px rgba(255, 107, 107, 0.7), 0 5px 20px rgba(0, 0, 0, 0.25)'
      : '0 8px 32px rgba(102, 126, 234, 0.6), 0 4px 16px rgba(0, 0, 0, 0.2)',
    transform: 'translateY(-6px) scale(1.03)',
    '&::before': {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))',
    },
  },
  
  '&:active': {
    transform: 'translateY(-2px) scale(0.98)',
    transition: 'all 0.1s ease',
  },
}));

const GenerationBadge = styled('div')<{ generation: number }>(({ generation }) => ({
  position: 'absolute',
  top: -8,
  right: -8,
  minWidth: 20,
  height: 20,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#fff',
  background: getGenerationColor(generation),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  zIndex: 1000,
}));

// 世代別の色を取得する関数
const getGenerationColor = (generation: number): string => {
  const colors = [
    '#ff6b6b', // 第1世代: 赤
    '#4ecdc4', // 第2世代: ティール
    '#45b7d1', // 第3世代: 青
    '#f7b731', // 第4世代: 黄
    '#5f27cd', // 第5世代: 紫
    '#00d2d3', // 第6世代: シアン
    '#ff9ff3', // 第7世代: ピンク
    '#54a0ff', // 第8世代: ライトブルー
  ];
  return colors[(generation - 1) % colors.length] || '#667eea';
};

// 世代別のグラデーション背景を取得する関数
const getGenerationGradient = (generation: number, isSelected: boolean): string => {
  const gradients = [
    isSelected 
      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' 
      : 'linear-gradient(135deg, #ff6b6b 0%, #ff5722 100%)', // 第1世代
    isSelected 
      ? 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' 
      : 'linear-gradient(135deg, #4ecdc4 0%, #0ba360 100%)', // 第2世代
    isSelected 
      ? 'linear-gradient(135deg, #45b7d1 0%, #3742fa 100%)' 
      : 'linear-gradient(135deg, #45b7d1 0%, #2f3542 100%)', // 第3世代
    isSelected 
      ? 'linear-gradient(135deg, #f7b731 0%, #fd9644 100%)' 
      : 'linear-gradient(135deg, #f7b731 0%, #fc427b 100%)', // 第4世代
    isSelected 
      ? 'linear-gradient(135deg, #5f27cd 0%, #341f97 100%)' 
      : 'linear-gradient(135deg, #5f27cd 0%, #00d2d3 100%)', // 第5世代以降
  ];
  return gradients[Math.min(generation - 1, gradients.length - 1)] || gradients[4];
};

const CustomNode: React.FC<NodeProps<any>> = ({ data, id, selected }) => {
  const dispatch = useDispatch();
  const { nodes } = useSelector((state: RootState) => state.mindmap);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [isNew, setIsNew] = useState(data.isNew || false);

  // アニメーション完了後にisNewフラグをクリア
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setIsNew(false);
      }, 800); // アニメーション時間と合わせる
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const newNodes = nodes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          data: {
            ...n.data,
            label: label,
          },
        };
      }
      return n;
    });
    dispatch(setNodes(newNodes));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  return (
    <StyledNodeContainer 
      onDoubleClick={handleDoubleClick} 
      isNew={isNew}
      isSelected={selected}
      generation={data.generation}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="right" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="bottom" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      
      <Handle 
        type="source" 
        position={Position.Top} 
        id="top" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom" 
        isConnectable={true}
        style={{ zIndex: 10 }}
      />
      
      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="nodrag"
          style={{ 
            width: '100%', 
            boxSizing: 'border-box', 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            outline: 'none',
            backdropFilter: 'blur(10px)',
          }}
        />
      ) : (
        <div style={{ 
          width: '100%', 
          boxSizing: 'border-box',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        }}>{data.label}</div>
      )}
      
      {/* 世代バッジ表示 */}
      {data.generation && (
        <GenerationBadge generation={data.generation}>
          {data.generation}
        </GenerationBadge>
      )}
    </StyledNodeContainer>
  );
};

export default CustomNode;
