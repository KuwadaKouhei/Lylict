
import React, { useState } from 'react';
import { Button, Paper, Divider, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PaletteIcon from '@mui/icons-material/Palette';

interface ContextMenuProps {
  top: number;
  left: number;
  onAdd: () => void;
  onDelete: () => void;
  onColorSelect?: (color: string) => void;
}

const ColorGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '6px',
  padding: '8px',
  maxWidth: '140px',
});

const ColorButton = styled('button')<{ color: string }>(({ color }) => ({
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  background: color,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

// HSV色相環に基づくグラデーション配置（6行4列）
const colors = [
  // 第1行: 赤系統 (0°-30°)
  '#ff4757', '#ff6b6b', '#ff7675', '#ff9ff3',
  // 第2行: オレンジ・黄色系統 (30°-90°)
  '#ff6348', '#feca57', '#f7b731', '#fdcb6e',
  // 第3行: 黄緑・緑系統 (90°-150°)
  '#7bed9f', '#2ed573', '#26de81', '#55efc4',
  // 第4行: 青緑・青系統 (150°-240°)
  '#00d2d3', '#0abde3', '#45b7d1', '#74b9ff',
  // 第5行: 青・紫系統 (240°-300°)
  '#70a1ff', '#5352ed', '#667eea', '#6c5ce7',
  // 第6行: 紫・マゼンタ系統 (300°-360°)
  '#5f27cd', '#a55eea', '#764ba2', '#e84393'
];

const ContextMenu: React.FC<ContextMenuProps> = ({ top, left, onAdd, onDelete, onColorSelect }) => {
  const [showColorPalette, setShowColorPalette] = useState(false);

  const handleColorSelect = (color: string) => {
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  return (
    <Paper 
      elevation={3}
      style={{ 
        position: 'absolute', 
        top, 
        left, 
        padding: 0,
        zIndex: 1000,
        minWidth: '160px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* 基本アクション */}
      <Box sx={{ p: 1 }}>
        <Button 
          onClick={onAdd} 
          fullWidth
          variant="text"
          size="small"
          startIcon={<AddIcon />}
          sx={{ 
            justifyContent: 'flex-start', 
            textTransform: 'none',
            color: 'text.primary',
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          ノードを追加
        </Button>
        <Button 
          onClick={onDelete} 
          fullWidth
          variant="text"
          size="small"
          startIcon={<DeleteIcon />}
          sx={{ 
            justifyContent: 'flex-start', 
            textTransform: 'none',
            color: 'error.main',
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          ノードを削除
        </Button>
        
        {onColorSelect && (
          <Button 
            onClick={() => setShowColorPalette(!showColorPalette)} 
            fullWidth
            variant="text"
            size="small"
            startIcon={<PaletteIcon />}
            sx={{ 
              justifyContent: 'flex-start', 
              textTransform: 'none',
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            色を変更
          </Button>
        )}
      </Box>

      {/* カラーパレット */}
      {showColorPalette && onColorSelect && (
        <>
          <Divider />
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              色を選択してください
            </Typography>
            <ColorGrid>
              {colors.map((color, index) => (
                <ColorButton
                  key={index}
                  color={color}
                  onClick={() => handleColorSelect(color)}
                  title={`色を変更: ${color}`}
                />
              ))}
            </ColorGrid>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ContextMenu;
