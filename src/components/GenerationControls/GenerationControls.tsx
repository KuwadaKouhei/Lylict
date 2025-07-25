import React, { useState, useMemo } from 'react';
import { 
  Paper, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Box,
  Chip,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { styled } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../lib/store';
import { 
  setGenerationVisibility, 
  setAllGenerationsVisibility, 
  setHighlightedGeneration 
} from '../../lib/features/mindmap/mindmapSlice';

const StyledPaper = styled(Paper)(() => ({
  position: 'absolute',
  top: 24,
  right: 24,
  zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 16,
  padding: 16,
  minWidth: 280,
  maxWidth: 320,
}));

const GenerationChip = styled(Chip)<{ generation: number; visible: boolean }>(({ generation, visible }) => ({
  margin: '4px 2px',
  backgroundColor: visible ? getGenerationColor(generation) : '#e0e0e0',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
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

const GenerationControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const dispatch = useDispatch();
  
  const { nodes, visibleGenerations, highlightedGeneration } = useSelector((state: RootState) => state.mindmap);

  // 現在のマインドマップから世代情報を抽出
  const generationInfo = useMemo(() => {
    const generations = new Map<number, number>();
    
    nodes.forEach(node => {
      const generation = node.data?.generation;
      if (typeof generation === 'number') {
        generations.set(generation, (generations.get(generation) || 0) + 1);
      }
    });

    return Array.from(generations.entries())
      .sort(([a], [b]) => a - b)
      .map(([generation, count]) => ({ generation, count }));
  }, [nodes]);

  // 全世代を表示/非表示
  const handleToggleAll = (visible: boolean) => {
    const generations = generationInfo.map(info => info.generation);
    dispatch(setAllGenerationsVisibility({ generations, visible }));
  };

  // 特定世代の表示/非表示を切り替え
  const handleToggleGeneration = (generation: number) => {
    const isVisible = !visibleGenerations.includes(generation);
    dispatch(setGenerationVisibility({ generation, visible: isVisible }));
  };

  // 世代ハイライト
  const handleGenerationHighlight = (generation: number) => {
    const newHighlight = highlightedGeneration === generation ? null : generation;
    dispatch(setHighlightedGeneration(newHighlight));
  };

  if (generationInfo.length === 0) {
    return null; // 世代情報がない場合は非表示
  }

  return (
    <StyledPaper elevation={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          世代コントロール
        </Typography>
        <IconButton 
          onClick={() => setIsExpanded(!isExpanded)}
          size="small"
          sx={{ transition: 'transform 0.2s ease' }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box>
          {/* 全世代コントロール */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={visibleGenerations.length === generationInfo.length}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                  size="small"
                />
              }
              label="全世代表示"
              sx={{ margin: 0 }}
            />
            <Typography variant="caption" color="textSecondary">
              {nodes.length}ノード
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* 世代別コントロール */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            世代別表示:
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
            {generationInfo.map(({ generation, count }) => (
              <GenerationChip
                key={generation}
                generation={generation}
                visible={visibleGenerations.includes(generation)}
                label={`第${generation}世代 (${count})`}
                size="small"
                onClick={() => handleToggleGeneration(generation)}
                variant={highlightedGeneration === generation ? "filled" : "outlined"}
                onDoubleClick={() => handleGenerationHighlight(generation)}
              />
            ))}
          </Box>

          <Typography variant="caption" color="textSecondary" display="block">
            クリック: 表示/非表示 | ダブルクリック: ハイライト
          </Typography>
        </Box>
      </Collapse>
    </StyledPaper>
  );
};

export default GenerationControls;