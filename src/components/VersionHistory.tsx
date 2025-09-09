import React, { useState } from 'react';
import { Clock, User, ArrowLeft, Eye, RotateCcw } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { PageVersion } from '../types';

interface VersionHistoryProps {
  pageId: string;
  onClose: () => void;
  onRestore?: (version: PageVersion) => void;
}

export default function VersionHistory({ pageId, onClose, onRestore }: VersionHistoryProps) {
  const { state, dispatch } = useWorkspace();
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);

  // Get versions for the current page
  const pageVersions = state.pageVersions
    .filter(version => version.pageId === pageId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Get user info
  const getUserInfo = (userId: string) => {
    return state.users.find(user => user.id === userId) || {
      id: userId,
      name: 'Unknown User',
      email: '',
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'create': return '#10b981';
      case 'edit': return '#3b82f6';
      case 'rename': return '#f59e0b';
      case 'delete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'create': return 'Created';
      case 'edit': return 'Edited';
      case 'rename': return 'Renamed';
      case 'delete': return 'Deleted';
      default: return 'Modified';
    }
  };

  const handleRestore = (version: PageVersion) => {
    if (onRestore) {
      onRestore(version);
    }
    onClose();
  };

  return (
    <div className="version-history-modal">
      <div className="version-history-content">
        <div className="version-history-header">
          <div className="header-left">
            <button className="back-button" onClick={onClose}>
              <ArrowLeft size={16} />
            </button>
            <h2>Version History</h2>
          </div>
        </div>

        <div className="version-history-body">
          <div className="versions-list">
            {pageVersions.map((version, index) => {
              const user = getUserInfo(version.createdBy);
              const isLatest = index === 0;
              
              return (
                <div
                  key={version.id}
                  className={`version-item ${selectedVersion?.id === version.id ? 'selected' : ''} ${isLatest ? 'latest' : ''}`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="version-header">
                    <div className="version-info">
                      <div className="version-number">
                        v{version.version}
                        {isLatest && <span className="latest-badge">Latest</span>}
                      </div>
                      <div className="version-meta">
                        <span className="change-type" style={{ color: getChangeTypeColor(version.changeType) }}>
                          {getChangeTypeLabel(version.changeType)}
                        </span>
                        <span className="version-date">{formatDate(version.createdAt)}</span>
                      </div>
                    </div>
                    <div className="version-actions">
                      <button
                        className="view-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVersion(version);
                        }}
                        title="View changes"
                      >
                        <Eye size={14} />
                      </button>
                      {!isLatest && onRestore && (
                        <button
                          className="restore-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version);
                          }}
                          title="Restore this version"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="version-author">
                    <div className="author-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="author-name">{user.name}</span>
                  </div>

                  {version.changeDescription && (
                    <div className="version-description">
                      {version.changeDescription}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedVersion && (
            <div className="version-details">
              <div className="version-details-header">
                <h3>Version {selectedVersion.version} Details</h3>
                <div className="version-details-meta">
                  <span className="change-type" style={{ color: getChangeTypeColor(selectedVersion.changeType) }}>
                    {getChangeTypeLabel(selectedVersion.changeType)}
                  </span>
                  <span className="version-date">{formatDate(selectedVersion.createdAt)}</span>
                </div>
              </div>
              
              <div className="version-content">
                <div className="content-section">
                  <h4>Title</h4>
                  <div className="content-preview">{selectedVersion.title}</div>
                </div>
                
                <div className="content-section">
                  <h4>Content</h4>
                  <div className="content-preview markdown-content">
                    {selectedVersion.content || <em>No content</em>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
