'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

interface TitleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, firstWord: string) => void;
  onAutoGenerate: (title: string, keyword: string, mode: 'noun' | 'poetic', generations: number) => void;
  initialTitle?: string;
  initialFirstWord?: string;
}

export default function TitleInputModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  onAutoGenerate,
  initialTitle = '',
  initialFirstWord = ''
}: TitleInputModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [firstWord, setFirstWord] = useState(initialFirstWord);
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [keyword, setKeyword] = useState('');
  const [autoTitle, setAutoTitle] = useState('');
  const [mode, setMode] = useState<'noun' | 'poetic'>('noun');
  const [generations, setGenerations] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && firstWord.trim()) {
      onConfirm(title.trim(), firstWord.trim());
      resetForm();
    }
  };

  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !autoTitle.trim()) return;
    
    setIsGenerating(true);
    try {
      await onAutoGenerate(autoTitle.trim(), keyword.trim(), mode, generations);
      resetForm();
    } catch (error) {
      console.error('自動生成エラー:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setFirstWord('');
    setKeyword('');
    setAutoTitle('');
    setGenerations(2);
    setActiveTab('manual');
    setIsGenerating(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 400,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            zIndex: 0,
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        pb: 1,
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        color: 'white',
        margin: -4,
        marginBottom: 0,

      }}>
        <Typography variant="h6" component="div" sx={{ pl: 3, pt: 3, fontWeight: 600 }}>
          ✨ 新しいマインドマップを作成
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ 
            mt: 3,
            mr: 3,
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        pt: 3, 
        px: 4,
        pb: 2,
        position: 'relative', 
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '0 0 12px 12px'
      }}>
        {/* タブナビゲーション */}
        <Box sx={{ borderBottom: 1, borderColor: '#E3F2FD', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="creation mode tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 56,
                fontWeight: 600,
                '&.Mui-selected': {
                  color: '#1976D2',
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)'
                }
              },
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                height: 3,
                borderRadius: '2px 2px 0 0'
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon fontSize="small" />
                  手動入力
                </Box>
              } 
              value="manual" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToyIcon fontSize="small" />
                  AI自動生成
                </Box>
              } 
              value="auto" 
            />
          </Tabs>
        </Box>

        {/* タブコンテンツ */}
        <Box component="form" onSubmit={activeTab === 'manual' ? handleManualSubmit : handleAutoGenerate}>
          {activeTab === 'manual' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="📝 タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="マインドマップのタイトルを入力してください"
                fullWidth
                autoFocus
                inputProps={{ maxLength: 100 }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: 2,
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976D2',
                    fontWeight: 600
                  }
                }}
              />

              <TextField
                label="🎯 最初のワード（中心テーマ）"
                value={firstWord}
                onChange={(e) => setFirstWord(e.target.value)}
                placeholder="マインドマップの中心となるワードを入力してください"
                fullWidth
                inputProps={{ maxLength: 50 }}
                variant="outlined"
                helperText="このワードがマインドマップの中心ノードとして表示されます"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: 2,
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976D2',
                    fontWeight: 600
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#1976D2',
                    fontSize: '0.8rem'
                  }
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)',
                padding: 2,
                borderRadius: 2,
                border: '1px solid #E3F2FD'
              }}>
                <Typography variant="body2" sx={{ color: '#1976D2', fontWeight: 500 }}>
                  🚀 AIがキーワードから関連する言葉を自動生成し、マインドマップを作成します
                </Typography>
              </Box>

              <TextField
                label="📝 タイトル"
                value={autoTitle}
                onChange={(e) => setAutoTitle(e.target.value)}
                placeholder="マインドマップのタイトルを入力してください"
                fullWidth
                inputProps={{ maxLength: 100 }}
                disabled={isGenerating}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: 2,
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976D2',
                    fontWeight: 600
                  }
                }}
              />

              <TextField
                label="🔑 キーワード"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="例: 海、愛、夢、仕事"
                fullWidth
                inputProps={{ maxLength: 50 }}
                disabled={isGenerating}
                variant="outlined"
                helperText="このキーワードを中心に関連する言葉が自動生成されます"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                      borderWidth: 2,
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976D2',
                    fontWeight: 600
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#1976D2',
                    fontSize: '0.8rem'
                  }
                }}
              />

              <FormControl fullWidth disabled={isGenerating}>
                <InputLabel sx={{ '&.Mui-focused': { color: '#1976D2', fontWeight: 600 } }}>
                  ⚙️ 生成モード
                </InputLabel>
                <Select
                  value={mode}
                  label="⚙️ 生成モード"
                  onChange={(e) => setMode(e.target.value as 'noun' | 'poetic')}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196F3',
                      borderWidth: 2,
                    }
                  }}
                >
                  <MenuItem value="noun">📚 名詞モード（具体的な言葉）</MenuItem>
                  <MenuItem value="poetic" disabled>🎨 詩的モード（美しい表現）※現在利用不可</MenuItem>
                </Select>
                <FormHelperText sx={{ color: '#1976D2', fontSize: '0.8rem' }}>
                  {mode === 'noun' 
                    ? '具体的で実用的な関連語を生成します' 
                    : '詩的で美しい表現を生成します（現在利用不可）'
                  }
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth disabled={isGenerating}>
                <InputLabel sx={{ '&.Mui-focused': { color: '#1976D2', fontWeight: 600 } }}>
                  🌱 世代数
                </InputLabel>
                <Select
                  value={generations}
                  label="🌱 世代数"
                  onChange={(e) => setGenerations(typeof e.target.value === 'string' ? parseInt(e.target.value) : e.target.value as number)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196F3',
                      borderWidth: 2,
                    }
                  }}
                >
                  <MenuItem value={2}>🌿 2世代（キーワード + 連想語）</MenuItem>
                  <MenuItem value={3}>🌳 3世代（階層的な連想）</MenuItem>
                </Select>
                <FormHelperText sx={{ color: '#1976D2', fontSize: '0.8rem' }}>
                  世代数が多いほど詳細な連想マップになります。世代数3の場合、第1世代（キーワード）→第2世代（6つの連想語）→第3世代（各3つの連想語）が生成されます
                </FormHelperText>
              </FormControl>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: 4, 
        pb: 4, 
        pt: 2,
        position: 'relative', 
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.98)',
        gap: 2
      }}>
        <Button 
          onClick={handleClose}
          disabled={isGenerating}
          color="inherit"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          キャンセル
        </Button>
        <Button
          onClick={activeTab === 'manual' ? handleManualSubmit : handleAutoGenerate}
          disabled={
            activeTab === 'manual' 
              ? !title.trim() || !firstWord.trim()
              : !keyword.trim() || !autoTitle.trim() || isGenerating
          }
          variant="contained"
          startIcon={
            isGenerating ? <CircularProgress size={20} color="inherit" /> : 
            activeTab === 'auto' ? <RocketLaunchIcon /> : null
          }
          sx={{
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            borderRadius: 2,
            fontWeight: 600,
            px: 4,
            py: 1.5,
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
              boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
              transform: 'translateY(-1px)'
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)'
            }
          }}
        >
          {isGenerating ? '生成中...' : activeTab === 'manual' ? '作成' : '自動生成開始'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}