
import React from 'react';
import { Button, Paper } from '@mui/material';

interface ContextMenuProps {
  top: number;
  left: number;
  onAdd: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ top, left, onAdd, onDelete }) => {
  return (
    <Paper 
      elevation={3}
      style={{ 
        position: 'absolute', 
        top, 
        left, 
        padding: '8px', 
        zIndex: 1000,
        minWidth: '120px'
      }}
    >
      <Button 
        onClick={onAdd} 
        fullWidth
        variant="text"
        size="small"
        sx={{ 
          justifyContent: 'flex-start', 
          textTransform: 'none',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        追加
      </Button>
      <Button 
        onClick={onDelete} 
        fullWidth
        variant="text"
        size="small"
        sx={{ 
          justifyContent: 'flex-start', 
          textTransform: 'none',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        削除
      </Button>
    </Paper>
  );
};

export default ContextMenu;
