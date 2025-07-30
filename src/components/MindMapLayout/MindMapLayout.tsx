"use client";

import { ReactNode } from 'react';
import { Box } from '@mui/material';

interface MindMapLayoutProps {
  children: ReactNode;
  header: ReactNode;
}

export default function MindMapLayout({ children, header }: MindMapLayoutProps) {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {header}
      
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '48px', sm: '60px' },
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'visible',
          zIndex: 1
        }}
      >
        {children}
      </Box>
    </div>
  );
}