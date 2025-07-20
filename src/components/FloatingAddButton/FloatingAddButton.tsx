import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { styled, keyframes } from '@mui/material/styles';

interface FloatingAddButtonProps {
  onClick: () => void;
}

// パルスアニメーション
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

// ホバー時の回転アニメーション
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
`;

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  bottom: 24,
  right: 24,
  zIndex: 1000,
  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
  animation: `${pulse} 2s infinite`,
  transition: 'all 0.3s ease-in-out',
  
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
    boxShadow: '0 12px 20px rgba(25, 118, 210, 0.4)',
    transform: 'scale(1.1)',
    animation: 'none',
    
    '& .MuiSvgIcon-root': {
      animation: `${rotate} 0.3s ease-in-out`,
    },
  },
  
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <Tooltip title="新しいノードを追加" placement="left">
      <StyledFab
        color="primary"
        onClick={onClick}
        size="large"
        aria-label="add node"
      >
        <AddIcon fontSize="large" />
      </StyledFab>
    </Tooltip>
  );
};

export default FloatingAddButton;