import { Suspense } from 'react';
import { Typography } from '@mui/material';
import MindMapPageClient from './MindMapPageClient';
import MindMapErrorBoundary from '@/components/ErrorBoundary/MindMapErrorBoundary';

// Server Component - SEO最適化とSSR対応
export default function MindMapPage() {
  return (
    <MindMapErrorBoundary>
      <Suspense fallback={
        <div style={{ 
          height: '100vh', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#f5f5f5' 
        }}>
          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            読み込み中...
          </Typography>
        </div>
      }>
        <MindMapPageClient />
      </Suspense>
    </MindMapErrorBoundary>
  );
}
