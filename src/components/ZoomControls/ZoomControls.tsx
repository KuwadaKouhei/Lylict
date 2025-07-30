import React from 'react';
import { IconButton, ButtonGroup, Paper, Tooltip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { useReactFlow } from '@xyflow/react';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 24,
  left: 24,
  zIndex: 1500,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  
  // レスポンシブ対応
  [theme.breakpoints.down('md')]: {
    bottom: 20,
    left: 20,
  },
  
  [theme.breakpoints.down('sm')]: {
    bottom: 20,
    left: 16,
    transform: 'scale(1.0)',
  },
}));

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  '& .MuiIconButton-root': {
    border: 'none',
    borderRadius: 0,
    transition: 'all 0.2s ease',
    
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      transform: 'scale(1.05)',
    },
    
    '&:active': {
      transform: 'scale(0.95)',
    },
    
    '&:first-of-type': {
      borderTopLeftRadius: theme.shape.borderRadius,
      borderBottomLeftRadius: theme.shape.borderRadius,
    },
    
    '&:last-of-type': {
      borderTopRightRadius: theme.shape.borderRadius,
      borderBottomRightRadius: theme.shape.borderRadius,
    },
  },
}));

const ZoomControls: React.FC = () => {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  const handleZoomIn = () => {
    const currentZoom = getZoom();
    const newZoom = Math.min(currentZoom * 1.5, 3); // 最大ズーム3まで
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    const currentZoom = getZoom();
    const newZoom = Math.max(currentZoom / 1.5, 0.05); // 最小ズーム0.05まで
    zoomOut({ duration: 300 });
  };

  const handleFitView = () => {
    fitView({ 
      duration: 500,
      padding: 0.1,
      minZoom: 0.05,
      maxZoom: 1
    });
  };

  return (
    <StyledPaper elevation={3}>
      <StyledButtonGroup
        orientation="vertical"
        variant="text"
        size="medium"
      >
        <Tooltip title="ズームイン" placement="right">
          <IconButton onClick={handleZoomIn} size="medium">
            <ZoomInIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="ズームアウト" placement="right">
          <IconButton onClick={handleZoomOut} size="medium">
            <ZoomOutIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="全体表示" placement="right">
          <IconButton onClick={handleFitView} size="medium">
            <CenterFocusStrongIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
      </StyledButtonGroup>
    </StyledPaper>
  );
};

export default ZoomControls;