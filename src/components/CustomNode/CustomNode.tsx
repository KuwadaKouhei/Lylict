
import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useDispatch, useSelector } from 'react-redux';
import { setNodes } from '../../lib/features/mindmap/mindmapSlice';
import { RootState } from '../../lib/store';
import { styled, keyframes } from '@mui/material/styles';

// ノード生成時のアニメーション
const nodeAppear = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.7);
    filter: blur(5px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
    filter: blur(1px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  }
`;

// ノードホバー時のエフェクト
const nodeHover = keyframes`
  0%, 100% {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  50% {
    box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3);
  }
`;

const StyledNodeContainer = styled('div')<{ isNew?: boolean }>(({ theme, isNew }) => ({
  width: 150,
  padding: 10,
  border: '1px solid #ddd',
  borderRadius: 5,
  background: '#fff',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  
  ...(isNew && {
    animation: `${nodeAppear} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
  }),
  
  '&:hover': {
    borderColor: '#1976d2',
    animation: `${nodeHover} 1.5s ease-in-out infinite`,
    transform: 'translateY(-2px)',
  },
}));

const CustomNode: React.FC<NodeProps<{ label: string; isNew?: boolean }>> = ({ data, id }) => {
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
    >
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Bottom} id="bottom" />
      
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      
      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="nodrag"
          style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
        />
      ) : (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>{data.label}</div>
      )}
    </StyledNodeContainer>
  );
};

export default CustomNode;
