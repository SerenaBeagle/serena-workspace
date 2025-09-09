import React, { useState, useEffect } from 'react';
import { Clock, User, Activity, Filter, Calendar } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import apiService from '../services/api';

interface ActionLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  createdAt: string;
  metadata?: any;
}

interface ActionLogsProps {
  onClose?: () => void;
}

export default function ActionLogs({ onClose }: ActionLogsProps) {
  const { state } = useWorkspace();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    days: '7'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      // 暂时返回空数据，避免 API 调用错误
      setLogs([]);
      setPagination({ page: 1, total: 0, pages: 0 });
      
      // TODO: 实现真正的 API 调用
      // const params = new URLSearchParams({
      //   page: page.toString(),
      //   limit: '20',
      //   ...(filters.action && { action: filters.action }),
      //   ...(filters.days && { days: filters.days })
      // });

      // const response = await fetch(`https://serena-workspace-production.up.railway.app/api/logs?${params}`, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to load logs');
      // }

      // const data = await response.json();
      // setLogs(data.logs);
      // setPagination(data.pagination);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_registered':
      case 'user_logged_in':
        return <User size={16} className="text-green-500" />;
      case 'project_created':
      case 'page_created':
        return <Activity size={16} className="text-blue-500" />;
      case 'page_content_updated':
      case 'page_title_updated':
        return <Clock size={16} className="text-orange-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'user_registered':
      case 'user_logged_in':
        return 'bg-green-100 text-green-800';
      case 'project_created':
      case 'page_created':
        return 'bg-blue-100 text-blue-800';
      case 'page_content_updated':
      case 'page_title_updated':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number) => {
    loadLogs(page);
  };

  if (!state.currentUser) {
    return (
      <div className="action-logs-modal">
        <div className="action-logs-content">
          <div className="action-logs-header">
            <h3>Action Logs</h3>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="error-message">
            Please log in to view action logs.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="action-logs-modal">
      <div className="action-logs-content">
        <div className="action-logs-header">
          <h3>Action Logs</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="action-logs-filters">
          <div className="filter-group">
            <label>
              <Filter size={16} />
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="user_registered">User Registration</option>
              <option value="user_logged_in">User Login</option>
              <option value="project_created">Project Created</option>
              <option value="page_created">Page Created</option>
              <option value="page_content_updated">Content Updated</option>
              <option value="page_title_updated">Title Updated</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={16} />
              Time Period
            </label>
            <select
              value={filters.days}
              onChange={(e) => handleFilterChange('days', e.target.value)}
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="action-logs-list">
            {logs.length === 0 ? (
              <div className="empty-state">
                <Activity size={48} className="text-gray-400" />
                <p>No logs found for the selected period.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="log-item">
                  <div className="log-icon">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="log-content">
                    <div className="log-header">
                      <span className="log-user">{log.userName}</span>
                      <span className={`log-action ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="log-time">{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="log-description">{log.description}</div>
                    {log.targetName && (
                      <div className="log-target">
                        Target: {log.targetName}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
