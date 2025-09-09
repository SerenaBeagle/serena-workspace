import { Users, Wifi, WifiOff } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export default function CollaborationStatus() {
  const { state } = useWorkspace();

  const getOnlineCollaborators = () => {
    if (!state.currentProject) return [];
    
    const collaboratorIds = state.currentProject.collaborators.map(c => c.userId);
    return state.collaborators.filter(user => 
      collaboratorIds.includes(user.id) && user.id !== state.currentUser?.id
    );
  };

  const onlineCollaborators = getOnlineCollaborators();

  return (
    <div className="collaboration-status">
      <div className="connection-status">
        {state.isOnline ? (
          <Wifi size={14} className="online" />
        ) : (
          <WifiOff size={14} className="offline" />
        )}
        <span className="status-text">
          {state.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {onlineCollaborators.length > 0 && (
        <div className="collaborators-list">
          <Users size={14} />
          <span className="collaborators-count">
            {onlineCollaborators.length} collaborator{onlineCollaborators.length !== 1 ? 's' : ''}
          </span>
          
          <div className="collaborators-avatars">
            {onlineCollaborators.slice(0, 3).map(collaborator => (
              <div
                key={collaborator.id}
                className="collaborator-avatar"
                title={collaborator.name || 'Unknown'}
              >
                {collaborator.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            ))}
            {onlineCollaborators.length > 3 && (
              <div className="more-collaborators">
                +{onlineCollaborators.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
