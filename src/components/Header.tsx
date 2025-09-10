import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceActions } from '../hooks/useWorkspaceActions';
import { Split, History, Link, Users } from 'lucide-react';

export default function Header() {
  const { state } = useWorkspace();
  const { toggleSplitView } = useWorkspaceActions();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="workspace-title">
          Collaborative Workspace
        </h1>
        {state.currentProject && (
          <span className="project-title">
            / {state.currentProject.title}
          </span>
        )}
      </div>
      
      <div className="header-right">
        <div className="header-actions">
          <button
            className={`action-button ${state.isSplitView ? 'active' : ''}`}
            onClick={toggleSplitView}
            title="Toggle Split View"
          >
            <Split size={20} />
          </button>
          
          <div className="status-indicators">
            <div className="status-item">
              <Users size={16} />
              <span>Public</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}