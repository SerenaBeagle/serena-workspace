import React, { useState } from 'react';
import { Split, Edit3, History, User } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import PageLinkCreator from './PageLinkCreator';
import UserAuth from './UserAuth';
import VersionHistory from './VersionHistory';
import CollaborationStatus from './CollaborationStatus';

export default function Header() {
  const { state, dispatch } = useWorkspace();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const handleTitleEdit = () => {
    if (state.currentPage) {
      setEditTitle(state.currentPage.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (state.currentPage && editTitle.trim()) {
      dispatch({
        type: 'UPDATE_PAGE_TITLE',
        payload: { pageId: state.currentPage.id, title: editTitle.trim() },
      });
    }
    setIsEditingTitle(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditTitle('');
    }
  };

  const toggleSplitView = () => {
    dispatch({ type: 'TOGGLE_SPLIT_VIEW' });
  };

  const handleRestoreVersion = (version: any) => {
    if (state.currentPage) {
      dispatch({
        type: 'RESTORE_PAGE_VERSION',
        payload: { pageId: state.currentPage.id, version },
      });
    }
  };

  return (
    <div className="header">
      <div className="header-left">
        {state.currentPage ? (
          <div className="page-info">
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleTitleSave}
                className="title-input"
                autoFocus
              />
            ) : (
              <h1 className="page-title" onClick={handleTitleEdit}>
                {state.currentPage.title}
              </h1>
            )}
            <button
              className="edit-title-button"
              onClick={handleTitleEdit}
              title="Edit title"
            >
              <Edit3 size={16} />
            </button>
          </div>
        ) : (
          <div className="welcome-message">
            <h1>Welcome to your Workspace</h1>
            <p>Create a project to get started with your brainstorming</p>
          </div>
        )}
      </div>

      <div className="header-right">
        <CollaborationStatus />
        
        {state.currentPage && (
          <>
            <button
              className="history-button"
              onClick={() => setShowVersionHistory(true)}
              title="View version history"
            >
              <History size={16} />
              <span>History</span>
            </button>
            
            <PageLinkCreator currentPageId={state.currentPage.id} />
            
            <button
              className={`split-button ${state.isSplitView ? 'active' : ''}`}
              onClick={toggleSplitView}
              title={state.isSplitView ? 'Exit split view' : 'Enter split view'}
            >
              <Split size={16} />
              <span>{state.isSplitView ? 'Exit Split' : 'Split View'}</span>
            </button>
          </>
        )}
        
        <button
          className="user-button"
          onClick={() => setShowUserAuth(true)}
          title={state.currentUser ? 'User profile' : 'Sign in'}
        >
          <User size={16} />
          <span>{state.currentUser ? state.currentUser.name : 'Sign In'}</span>
        </button>
      </div>

      {showUserAuth && (
        <UserAuth onClose={() => setShowUserAuth(false)} />
      )}

      {showVersionHistory && state.currentPage && (
        <VersionHistory
          pageId={state.currentPage.id}
          onClose={() => setShowVersionHistory(false)}
          onRestore={handleRestoreVersion}
        />
      )}
    </div>
  );
}
