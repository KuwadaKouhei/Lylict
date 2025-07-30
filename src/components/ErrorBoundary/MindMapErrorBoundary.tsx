"use client";

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class MindMapErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MindMap Error Boundary caught an error:', error, errorInfo);
    
    // エラー報告サービスにログを送信（本番環境）
    if (process.env.NODE_ENV === 'production') {
      // TODO: エラー報告サービス（Sentry等）への送信
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: 3,
            textAlign: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          <ErrorOutlineIcon 
            sx={{ 
              fontSize: 80, 
              color: 'error.main', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h4" gutterBottom color="error">
            エラーが発生しました
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600 }}>
            マインドマップの読み込み中に問題が発生しました。
            ページを再読み込みして再度お試しください。
          </Typography>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                maxWidth: 800,
                width: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                開発者向け情報:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem', overflow: 'auto' }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </Typography>
            </Box>
          )}
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{ mt: 3 }}
          >
            ページを再読み込み
          </Button>
          
          <Button
            variant="text"
            onClick={this.resetError}
            sx={{ mt: 1 }}
          >
            エラーをリセット
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default MindMapErrorBoundary;