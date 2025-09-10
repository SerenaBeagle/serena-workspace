import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, Page, WorkspaceState, PageLink, PageVersion } from '../types';
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
  | { type: 'RESTORE_PAGE_VERSION'; payload: { pageId: string; version: PageVersion } }
  | { type: 'LOAD_WORKSPACE'; payload: WorkspaceState };

const initialState: WorkspaceState = {
  projects: [],
  currentProject: null,
  currentPage: null,
  isSplitView: false,
  pageLinks: [],
  pageVersions: [],
  actionLogs: [],
  editorContent: '',
  isInitializing: true,
};

// Helper function to create page versions
const createPageVersion = (
  pageId: string,
  title: string,
  content: string,
  changeType: 'create' | 'edit' | 'rename' | 'delete',
  changeDescription?: string
): PageVersion => {
  return {
    id: uuidv4(),
    pageId,
    version: 1,
    title,
    content,
    changeType,
    changeDescription: changeDescription || `Page ${changeType}`,
    createdAt: new Date(),
    createdBy: 'anonymous',
  };
};

const workspaceReducer = (state: WorkspaceState, action: WorkspaceAction): WorkspaceState => {
  switch (action.type) {
    case 'CREATE_PROJECT': {
      const newProject: Project = {
        id: uuidv4(),
        title: action.payload.title,
        description: action.payload.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: [],
        createdBy: 'anonymous',
        lastModifiedBy: 'anonymous',
        isPublic: true,
        isGlobal: true,
        collaborators: [],
        settings: {
          allowComments: true,
          allowVersionHistory: true,
        },
      };

      return {
        ...state,
        projects: [...state.projects, newProject],
        currentProject: newProject,
      };
    }

    case 'SELECT_PROJECT': {
      const project = state.projects.find(p => p.id === action.payload.projectId);
      return {
        ...state,
        currentProject: project || null,
        currentPage: null,
        editorContent: '',
      };
    }

    case 'CREATE_PAGE': {
      // Use the page data from backend instead of creating new object
      const newPage: Page = {
        id: action.payload.id,
        title: action.payload.title,
        content: action.payload.content || '',
        createdAt: new Date(action.payload.createdAt),
        updatedAt: new Date(action.payload.updatedAt),
        projectId: action.payload.projectId,
        parentPageId: action.payload.parentPageId,
        childPages: action.payload.childPages || [],
        linkedPages: action.payload.linkedPages || [],
        createdBy: action.payload.createdBy || 'anonymous',
        lastModifiedBy: action.payload.lastModifiedBy || 'anonymous',
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

      console.log('CREATE_PAGE: Setting currentPage to new page:', newPage.id);
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
      console.log('SELECT_PAGE: Selecting page:', action.payload.pageId, 'Found:', !!page);
      return {
        ...state,
        currentPage: page || null,
        editorContent: page?.content || '',
      };
    }

    case 'UPDATE_PAGE_CONTENT': {
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: (project.pages || []).map(page =>
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
        editorContent: action.payload.content,
      };
    }

    case 'UPDATE_PAGE_TITLE': {
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: (project.pages || []).map(page =>
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
        createdBy: 'anonymous',
      };

      // Update the source page's linkedPages array
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: (project.pages || []).map(page =>
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

    case 'RESTORE_PAGE_VERSION': {
      const { pageId, version } = action.payload;
      
      // Update the page with the restored version
      const updatedProjects = state.projects.map(project => ({
        ...project,
        pages: (project.pages || []).map(page =>
          page.id === pageId
            ? {
                ...page,
                title: version.title,
                content: version.content,
                updatedAt: new Date(),
                lastModifiedBy: 'anonymous',
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
        `Restored from version ${version.version}`
      );

      return {
        ...state,
        projects: updatedProjects,
        currentPage: updatedProjects
          .flatMap(p => p.pages)
          .find(p => p.id === pageId) || state.currentPage,
        pageVersions: [...state.pageVersions, restoreVersion],
      };
    }

    case 'LOAD_WORKSPACE': {
      return {
        ...action.payload,
        isInitializing: false,
      };
    }

    default:
      return state;
  }
};

interface WorkspaceContextType {
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  // Initialize workspace
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // Load projects from API
        const projects = await apiService.getProjects();
        
        // Create default project if none exist
        let defaultProject;
        if (projects.length === 0) {
          const newProject = await apiService.createProject({
            title: 'Welcome',
            description: 'Your collaborative workspace',
            isPublic: true,
            isGlobal: true
          });
          defaultProject = newProject;
        } else {
          defaultProject = projects[0];
        }

        dispatch({
          type: 'LOAD_WORKSPACE',
          payload: {
            ...state,
            projects: projects.length > 0 ? projects : [defaultProject],
            currentProject: defaultProject,
            isInitializing: false,
          }
        });

        // Join the default project room for real-time collaboration
        if (defaultProject) {
          socketService.joinProject(defaultProject.id);
        }
      } catch (error) {
        console.error('Failed to initialize workspace:', error);
        dispatch({
          type: 'LOAD_WORKSPACE',
          payload: {
            ...state,
            isInitializing: false,
          }
        });
      }
    };

    initializeWorkspace();
  }, []);

  // Socket event handlers
  useEffect(() => {
    const handlePageContentUpdated = (data: any) => {
      console.log('Page content updated event received:', data);
      dispatch({
        type: 'UPDATE_PAGE_CONTENT',
        payload: {
          pageId: data.pageId,
          content: data.content,
          changeDescription: `Updated by ${data.user?.name || 'Unknown'}`
        }
      });
    };

    const handlePageTitleUpdated = (data: any) => {
      console.log('Page title updated event received:', data);
      dispatch({
        type: 'UPDATE_PAGE_TITLE',
        payload: {
          pageId: data.pageId,
          title: data.title,
          changeDescription: `Updated by ${data.user?.name || 'Unknown'}`
        }
      });
    };

    const handlePageCreated = (data: any) => {
      console.log('Page created event received:', data);
      // Only add page if it doesn't already exist (for other users)
      const existingPage = state.projects
        .flatMap(p => p.pages)
        .find(p => p.id === data.pageId);
      
      if (!existingPage) {
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
          linkedPages: [],
          lastModifiedBy: data.createdBy
        }});
      } else {
        console.log('Page already exists, skipping creation');
      }
    };

    socketService.on('page_content_updated', handlePageContentUpdated);
    socketService.on('page_title_updated', handlePageTitleUpdated);
    socketService.on('page_created', handlePageCreated);

    return () => {
      socketService.off('page_content_updated', handlePageContentUpdated);
      socketService.off('page_title_updated', handlePageTitleUpdated);
      socketService.off('page_created', handlePageCreated);
    };
  }, [state.projects]);

  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
};