import React, { useEffect, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import {
  fetchAllMindMaps,
  loadMindMap,
  saveCurrentMindMap,
  deleteSelectedMindMap,
  createNewMindMap,
  setCurrentMindMapTitle,
  clearError,
} from '../../lib/features/mindmap/mindmapSlice';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    savedMindMaps, 
    currentMindMapId, 
    currentMindMapTitle, 
    isLoading, 
    error 
  } = useSelector((state: RootState) => state.mindmap);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllMindMaps());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleLoadMindMap = (id: string) => {
    dispatch(loadMindMap(id));
    onClose();
  };

  const handleSaveMindMap = () => {
    if (currentMindMapTitle.trim() === '' || currentMindMapTitle === 'Untitled MindMap') {
      setSaveDialogOpen(true);
      setTitleInput(currentMindMapTitle);
    } else {
      dispatch(saveCurrentMindMap()).then(() => {
        dispatch(fetchAllMindMaps());
      });
    }
  };

  const handleSaveWithTitle = () => {
    if (titleInput.trim()) {
      dispatch(setCurrentMindMapTitle(titleInput.trim()));
      dispatch(saveCurrentMindMap()).then(() => {
        dispatch(fetchAllMindMaps());
        setSaveDialogOpen(false);
      });
    }
  };

  const handleDeleteMindMap = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('このマインドマップを削除しますか？')) {
      dispatch(deleteSelectedMindMap(id));
    }
  };

  const handleNewMindMap = () => {
    dispatch(createNewMindMap());
    onClose();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <Drawer anchor="left" open={isOpen} onClose={onClose}>
        <Box sx={{ 
          width: { xs: '90vw', sm: 400, md: 350 }, 
          maxWidth: '100vw',
          p: { xs: 1, sm: 2 } 
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            マインドマップ
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ 
            mb: 2, 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewMindMap}
              fullWidth
              size={{ xs: 'small', sm: 'medium' }}
            >
              新規作成
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveMindMap}
              disabled={isLoading}
              fullWidth={{ xs: true, sm: false }}
              size={{ xs: 'small', sm: 'medium' }}
            >
              保存
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" sx={{ 
            mb: 1,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            保存済みマインドマップ
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {savedMindMaps.map((mindMap) => (
                <ListItem
                  key={mindMap.id}
                  sx={{
                    border: currentMindMapId === mindMap.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.5, sm: 1 }
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={(e) => handleDeleteMindMap(mindMap.id!, e)}
                      size={{ xs: 'small', sm: 'medium' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => handleLoadMindMap(mindMap.id!)}>
                    <ListItemText
                      primary={mindMap.title}
                      secondary={`更新: ${formatDate(mindMap.updatedAt)}`}
                      primaryTypographyProps={{
                        fontSize: { xs: '0.85rem', sm: '1rem' },
                        fontWeight: 500
                      }}
                      secondaryTypographyProps={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {savedMindMaps.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ 
                  textAlign: 'center', 
                  p: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  保存済みのマインドマップがありません
                </Typography>
              )}
            </List>
          )}
        </Box>
      </Drawer>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>マインドマップを保存</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="タイトル"
            fullWidth
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveWithTitle();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSaveWithTitle} disabled={!titleInput.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;