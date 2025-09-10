import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, Page, WorkspaceState, PageLink, User, PageVersion, ProjectCollaborator } from '../types';
import apiService from '../services/api';
import socketService from '../services/socket';

type WorkspaceAction =
  | { type: 'CREATE_PROJECT'; payload: { title: string; description?: string } }
  | { type: 'SELECT_PROJECT'; payload: { projectId: string } }
  | { type: 'CREATE_PAGE'; payload: { projectId: string; title: string; parentPageId?: string } }
  | { type: 'SELECT_PAGE'; payload: { pageId: string } }
  | { type: 'UPDATE_PAGE_CONTENT'; payload: { pageId: string; content: string; changeDescription?: string } }
  | { type: 'UPDATE_PAGE_TITLE'; payload: { pageId: string; title: string; changeDescription?: string } }
  | { type: 'TOGGLE_SPLIT_VIEW' }
  | { type: 'CREATE_PAGE_LINK'; payload: { sourcePageId: string; targetPageId: string; linkText: string } }
  | { type: 'SET_CURRENT_USER'; payload: { user: User } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_COLLABORATOR'; payload: { projectId: string; userId: string; role: 'editor' | 'viewer' } }
  | { type: 'REMOVE_COLLABORATOR'; payload: { projectId: string; userId: string } }
  | { type: 'SET_ONLINE_STATUS'; payload: { isOnline: boolean } }
  | { type: 'UPDATE_COLLABORATORS'; payload: { collaborators: User[] } }
  | { type: 'RESTORE_PAGE_VERSION'; payload: { pageId: string; version: PageVersion } }
  | { type: 'LOAD_WORKSPACE'; payload: WorkspaceState };

const initialState: WorkspaceState = {
  projects: [],
  currentProject: null,
  currentPage: null,
  isSplitView: false,
  pageLinks: [],
  users: [],
  currentUser: null,
  pageVersions: [],
  isOnline: navigator.onLine,
  collaborators: [],
};

// Helper function to create page versions
const createPageVersion = (
  pageId: string,
  title: string,
  content: string,
  changeType: 'create' | 'edit' | 'rename' | 'delete',
  createdBy: string,
  changeDescription?: string
): PageVersion => {
  return {
    id: uuidv4(),
    pageId,
    version: 1, // This would be calculated based on existing versions
    title,
    content,
    createdAt: new Date(),
    createdBy,
    changeType,
    changeDescription,
  };
};

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'CREATE_PROJECT': {
      if (!state.currentUser) return state;
      
      const newProject: Project = {
        id: uuidv4(),
        title: action.payload.title,
        description: action.payload.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: state.currentUser.id,
        pages: [],
        collaborators: [{
          userId: state.currentUser.id,
          role: 'owner',
          addedAt: new Date(),
          addedBy: state.currentUser.id,
        }],
        isPublic: false,
      };
      return {
        ...state,
        projects: [...state.projects, newProject],
        currentProject: newProject,
        currentPage: null,
      };
    }

    case 'SELECT_PROJECT': {
      const project = state.projects.find(p => p.id === action.payload.projectId);
      return {
        ...state,
        currentProject: project || null,
        currentPage: null,
        isSplitView: false,
      };
    }

    case 'CREATE_PAGE': {
      const newPage: Page = {
        id: uuidv4(),
        title: action.payload.title,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: action.payload.projectId,
        parentPageId: action.payload.parentPageId,
        childPages: [],
        linkedPages: [],
        createdBy: state.currentUser?.id || 'anonymous',
        lastModifiedBy: state.currentUser?.id || 'anonymous',
      };

      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.projectId
          ? {
              ...project,
              pages: [...(project.pages || []), newPage],
              updatedAt: new Date(),
            }
          : project
      );

      // If this is a sub-page, update the parent page's childPages array
      if (action.payload.parentPageId) {
        const projectsWithUpdatedParent = updatedProjects.map(project => ({
          ...project,
          pages: (project.pages || []).map(page =>
            page.id === action.payload.parentPageId
              ? { ...page, childPages: [...page.childPages, newPage.id] }
              : page
          ),
        }));
        return {
          ...state,
          projects: projectsWithUpdatedParent,
          currentProject: projectsWithUpdatedParent.find(p => p.id === action.payload.projectId) || null,
          currentPage: newPage,
          // Clear editor content for new page
          editorContent: '',
        };
      }

      return {
        ...state,
        projects: updatedProjects,
        currentProject: updatedProjects.find(p => p.id === action.payload.projectId) || null,
        currentPage: newPage,
        // Clear editor content for new page
        editorContent: '',
      };
    }

    case 'SELECT_PAGE': {
      const page = state.projects
        .flatMap(p => p.pages)
        .find(p => p.id === action.payload.pageId);
      return {
        ...state,
        currentPage: page || null,
      };
    }

    case 'UPDATE_PAGE_CONTENT': {
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: project.pages.map(page =>
          page.id === action.payload.pageId
            ? { ...page, content: action.payload.content, updatedAt: new Date() }
            : page
        ),
      }));

      const updatedPage = updatedProjects
        .flatMap(p => p.pages)
        .find(p => p.id === action.payload.pageId);

      return {
        ...state,
        projects: updatedProjects,
        currentPage: updatedPage || state.currentPage,
      };
    }

    case 'UPDATE_PAGE_TITLE': {
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: project.pages.map(page =>
          page.id === action.payload.pageId
            ? { ...page, title: action.payload.title, updatedAt: new Date() }
            : page
        ),
      }));

      const updatedPage = updatedProjects
        .flatMap(p => p.pages)
        .find(p => p.id === action.payload.pageId);

      return {
        ...state,
        projects: updatedProjects,
        currentPage: updatedPage || state.currentPage,
      };
    }

    case 'TOGGLE_SPLIT_VIEW': {
      return {
        ...state,
        isSplitView: !state.isSplitView,
      };
    }

    case 'CREATE_PAGE_LINK': {
      const newLink: PageLink = {
        id: uuidv4(),
        sourcePageId: action.payload.sourcePageId,
        targetPageId: action.payload.targetPageId,
        linkText: action.payload.linkText,
        createdAt: new Date(),
        createdBy: state.currentUser?.id || 'anonymous',
      };

      // Update the source page's linkedPages array
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: project.pages.map(page =>
          page.id === action.payload.sourcePageId
            ? { ...page, linkedPages: [...page.linkedPages, action.payload.targetPageId] }
            : page
        ),
      }));

      return {
        ...state,
        projects: updatedProjects,
        pageLinks: [...state.pageLinks, newLink],
      };
    }

    case 'SET_CURRENT_USER': {
      const updatedUsers = state.users.find(u => u.id === action.payload.user.id)
        ? state.users
        : [...state.users, action.payload.user];
      
      return {
        ...state,
        currentUser: action.payload.user,
        users: updatedUsers,
      };
    }

    case 'LOGOUT': {
      return {
        ...state,
        currentUser: null,
        currentProject: null,
        currentPage: null,
      };
    }

    case 'ADD_COLLABORATOR': {
      const newCollaborator: ProjectCollaborator = {
        userId: action.payload.userId,
        role: action.payload.role,
        addedAt: new Date(),
        addedBy: state.currentUser?.id || '',
      };

      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.projectId
          ? {
              ...project,
              collaborators: [...project.collaborators, newCollaborator],
            }
          : project
      );

      return {
        ...state,
        projects: updatedProjects,
      };
    }

    case 'REMOVE_COLLABORATOR': {
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.projectId
          ? {
              ...project,
              collaborators: project.collaborators.filter(
                c => c.userId !== action.payload.userId
              ),
            }
          : project
      );

      return {
        ...state,
        projects: updatedProjects,
      };
    }

    case 'SET_ONLINE_STATUS': {
      return {
        ...state,
        isOnline: action.payload.isOnline,
      };
    }

    case 'UPDATE_COLLABORATORS': {
      return {
        ...state,
        collaborators: action.payload.collaborators,
      };
    }

    case 'RESTORE_PAGE_VERSION': {
      const { pageId, version } = action.payload;
      
      // Update the page with the restored version
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: project.pages.map(page =>
          page.id === pageId
            ? {
                ...page,
                title: version.title,
                content: version.content,
                updatedAt: new Date(),
                lastModifiedBy: state.currentUser?.id || '',
              }
            : page
        ),
      }));

      // Create a new version for the restore action
      const restoreVersion = createPageVersion(
        pageId,
        version.title,
        version.content,
        'edit',
        state.currentUser?.id || '',
        `Restored from version ${version.version}`
      );

      return {
        ...state,
        projects: updatedProjects,
        pageVersions: [...state.pageVersions, restoreVersion],
      };
    }

    case 'LOAD_WORKSPACE': {
      return action.payload;
    }

    default:
      return state;
  }
}

const WorkspaceContext = createContext<{
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
} | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize workspace data from backend
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            // Verify token with backend
            apiService.setToken(token);
            const user = await apiService.getCurrentUser();
            dispatch({ type: 'SET_CURRENT_USER', payload: { user } });
            
            // Connect to socket
            socketService.connect(token);
            
            // Load projects
            const projects = await apiService.getProjects();
            dispatch({ type: 'LOAD_WORKSPACE', payload: { ...state, projects, currentUser: user } });
          } catch (error) {
            console.error('Token validation failed:', error);
            // Clear invalid token
            localStorage.removeItem('authToken');
            apiService.clearToken();
            socketService.disconnect();
          }
        }
      } catch (error) {
        console.error('Failed to initialize workspace:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeWorkspace();
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: { isOnline: true } });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: { isOnline: false } });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    const handleUserJoined = (data: any) => {
      dispatch({ type: 'UPDATE_COLLABORATORS', payload: { collaborators: data.collaborators } });
    };

    const handleUserLeft = (data: any) => {
      dispatch({ type: 'UPDATE_COLLABORATORS', payload: { collaborators: data.collaborators } });
    };

    const handlePageContentUpdated = (data: any) => {
      dispatch({ type: 'UPDATE_PAGE_CONTENT', payload: { 
        pageId: data.pageId, 
        content: data.content,
        changeDescription: `Updated by ${data.user?.name || 'Unknown'}`
      }});
    };

    const handlePageTitleUpdated = (data: any) => {
      dispatch({ type: 'UPDATE_PAGE_TITLE', payload: { 
        pageId: data.pageId, 
        title: data.title,
        changeDescription: `Updated by ${data.user?.name || 'Unknown'}`
      }});
    };

    const handlePageCreated = (data: any) => {
      console.log('Page created event received:', data);
      dispatch({ type: 'CREATE_PAGE', payload: {
        id: data.pageId,
        title: data.title,
        content: '',
        projectId: data.projectId,
        createdBy: data.createdBy,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.createdAt),
        parentPageId: undefined,
        childPages: [],
        linkedPages: []
      }});
    };

    socketService.on('user_joined', handleUserJoined);
    socketService.on('user_left', handleUserLeft);
    socketService.on('page_content_updated', handlePageContentUpdated);
    socketService.on('page_title_updated', handlePageTitleUpdated);
    socketService.on('page_created', handlePageCreated);

    return () => {
      socketService.off('user_joined', handleUserJoined);
      socketService.off('user_left', handleUserLeft);
      socketService.off('page_content_updated', handlePageContentUpdated);
      socketService.off('page_title_updated', handlePageTitleUpdated);
      socketService.off('page_created', handlePageCreated);
    };
  }, []);

  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      {isInitializing ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
