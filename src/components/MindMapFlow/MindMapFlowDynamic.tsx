import dynamic from 'next/dynamic';
import { CircularProgress, Box } from '@mui/material';

const MindMapFlowInternal = dynamic(
  () => import('./MindMapFlowInternal').then(mod => ({ default: mod.MindMapFlowInternal })),
  {
    loading: () => (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <span style={{ color: '#1976d2', fontWeight: 'bold' }}>マインドマップを読み込み中...</span>
      </Box>
    ),
    ssr: false
  }
);

export default MindMapFlowInternal;