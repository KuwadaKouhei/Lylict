"use client";

import { IconButton, Typography, Button, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import { useCallback } from 'react';

interface MindMapHeaderProps {
  title: string;
  isEditing: boolean;
  isLoading: boolean;
  onSave: () => void;
  onGoHome: () => void;
  onOpenSidebar: () => void;
}

export default function MindMapHeader({
  title,
  isEditing,
  isLoading,
  onSave,
  onGoHome,
  onOpenSidebar
}: MindMapHeaderProps) {
  const handleSave = useCallback(() => {
    onSave();
  }, [onSave]);

  const handleGoHome = useCallback(() => {
    onGoHome();
  }, [onGoHome]);

  const handleOpenSidebar = useCallback(() => {
    onOpenSidebar();
  }, [onOpenSidebar]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: { xs: '4px 8px', sm: 1 },
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        height: { xs: '48px', sm: '60px' },
        minHeight: { xs: '48px', sm: '60px' }
      }}
    >
      <IconButton 
        onClick={handleGoHome} 
        size="medium" 
        title="ホームに戻る"
        sx={{ fontSize: { xs: '20px', sm: '24px' } }}
      >
        <HomeIcon />
      </IconButton>
      
      <IconButton 
        onClick={handleOpenSidebar} 
        size="medium"
        sx={{ fontSize: { xs: '20px', sm: '24px' } }}
      >
        <MenuIcon />
      </IconButton>
      
      <Typography 
        variant="h6" 
        sx={{ 
          flexGrow: 1, 
          fontSize: { xs: '14px', sm: '18px' },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {title} {isEditing && <span style={{ fontSize: '0.8em', color: '#666' }}>(編集中)</span>}
      </Typography>
      
      <Button
        variant="contained"
        startIcon={<SaveIcon sx={{ fontSize: { xs: '16px', sm: '20px' } }} />}
        onClick={handleSave}
        disabled={isLoading}
        size="small"
        sx={{ 
          fontSize: { xs: '12px', sm: '14px' },
          padding: { xs: '4px 8px', sm: '6px 16px' },
          minWidth: { xs: '60px', sm: 'auto' }
        }}
      >
        {isEditing ? '更新' : '保存'}
      </Button>
    </Box>
  );
}