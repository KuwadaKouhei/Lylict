"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { User } from 'firebase/auth';
import { Typography } from '@mui/material';
import { RootState } from '../../lib/store';
import { onAuthStateChange, handleRedirectResult } from '../../lib/auth';
import { useMindMapActions } from '../../hooks/useMindMapActions';
import { useMindMapInitialization } from '../../hooks/useMindMapInitialization';
import MindMapLayout from '../../components/MindMapLayout/MindMapLayout';
import MindMapHeader from '../../components/MindMapHeader/MindMapHeader';
import MindMapFlowDynamic from '../../components/MindMapFlow/MindMapFlowDynamic';
import Sidebar from '../../components/Sidebar/Sidebar';
import LoginPrompt from '../../components/LoginPrompt';

export default function MindMapPageClient() {
  const { currentMindMapTitle, isLoading, nodes, edges } = useSelector((state: RootState) => state.mindmap);
  
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Custom hooks
  const { handleSave, handleGoHome } = useMindMapActions({
    user,
    editingId,
    currentMindMapTitle,
    nodes,
    edges,
    onShowLoginPrompt: () => setShowLoginPrompt(true)
  });

  useMindMapInitialization({
    authInitialized,
    user,
    nodes,
    edges,
    currentMindMapTitle,
    onSetEditingId: setEditingId,
    onSetInitialized: setInitialized
  });

  // Authentication handling
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setAuthInitialized(true);
    });
    
    const checkRedirectResult = async () => {
      try {
        const user = await handleRedirectResult();
        if (user) {
          setUser(user);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        setAuthInitialized(true);
      }
    };

    checkRedirectResult();
    
    return () => unsubscribe();
  }, []);

  // Event handlers
  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleLoginSuccess = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setShowLoginPrompt(false);
    setTimeout(() => {
      handleSave();
    }, 100);
  }, [handleSave]);

  const handleCloseLoginPrompt = useCallback(() => {
    setShowLoginPrompt(false);
  }, []);

  // Loading state
  if (!initialized) {
    return (
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
    );
  }

  const header = (
    <MindMapHeader
      title={currentMindMapTitle}
      isEditing={Boolean(editingId)}
      isLoading={isLoading}
      onSave={handleSave}
      onGoHome={handleGoHome}
      onOpenSidebar={handleOpenSidebar}
    />
  );

  return (
    <>
      <MindMapLayout header={header}>
        <MindMapFlowDynamic />
      </MindMapLayout>
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
      />
      
      <LoginPrompt 
        isOpen={showLoginPrompt}
        onClose={handleCloseLoginPrompt}
        onLoginSuccess={handleLoginSuccess}
        message="マインドマップを保存するにはログインが必要です。"
      />
    </>
  );
}