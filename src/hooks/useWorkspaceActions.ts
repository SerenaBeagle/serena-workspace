import { useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import apiService from '../services/api';
import socketService from '../services/socket';

export function useWorkspaceActions() {
  const { state, dispatch } = useWorkspace();

  // Project actions
  const createProject = useCallback(async (title: string, description?: string) => {
    try {
      const projectData = await apiService.createProject({ title, description });
      dispatch({ type: 'CREATE_PROJECT', payload: projectData });
      return projectData;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [dispatch]);

  const selectProject = useCallback((projectId: string) => {
    dispatch({ type: 'SELECT_PROJECT', payload: { projectId } });
    // Join project room for real-time collaboration
    socketService.joinProject(projectId);
  }, [dispatch]);

  // Page actions
  const createPage = useCallback(async (projectId: string, title: string, parentPageId?: string) => {
    try {
      console.log('Creating page with data:', { projectId, title, parentPageId });
      console.log('Current token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
      
      const pageData = await apiService.createPage({ 
        projectId, 
        title, 
        parentPageId 
      });
      
      console.log('Page created successfully:', pageData);
      dispatch({ type: 'CREATE_PAGE', payload: pageData });
      return pageData;
    } catch (error) {
      console.error('Failed to create page:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        projectId,
        title
      });
      throw error;
    }
  }, [dispatch]);

  const selectPage = useCallback((pageId: string) => {
    dispatch({ type: 'SELECT_PAGE', payload: { pageId } });
    // Start editing for real-time collaboration
    socketService.startEditing(pageId);
  }, [dispatch]);

  const updatePageContent = useCallback(async (pageId: string, content: string, changeDescription?: string) => {
    try {
      await apiService.updatePageContent(pageId, content, changeDescription);
      dispatch({ type: 'UPDATE_PAGE_CONTENT', payload: { pageId, content, changeDescription } });
      
      // Broadcast change to other users
      socketService.updatePageContent(pageId, content);
    } catch (error) {
      console.error('Failed to update page content:', error);
      throw error;
    }
  }, [dispatch]);

  const updatePageTitle = useCallback(async (pageId: string, title: string, changeDescription?: string) => {
    try {
      await apiService.updatePageTitle(pageId, title, changeDescription);
      dispatch({ type: 'UPDATE_PAGE_TITLE', payload: { pageId, title, changeDescription } });
      
      // Broadcast change to other users
      socketService.updatePageTitle(pageId, title);
    } catch (error) {
      console.error('Failed to update page title:', error);
      throw error;
    }
  }, [dispatch]);

  // Auth actions
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      apiService.setToken(response.token);
      dispatch({ type: 'SET_CURRENT_USER', payload: { user: response.user } });
      
      // Connect to socket
      socketService.connect(response.token);
      
      // Load projects
      const projects = await apiService.getProjects();
      dispatch({ type: 'LOAD_WORKSPACE', payload: { ...state, projects, currentUser: response.user } });
      
      return response;
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  }, [dispatch, state]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await apiService.register({ name, email, password });
      apiService.setToken(response.token);
      dispatch({ type: 'SET_CURRENT_USER', payload: { user: response.user } });
      
      // Connect to socket
      socketService.connect(response.token);
      
      return response;
    } catch (error) {
      console.error('Failed to register:', error);
      throw error;
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    apiService.clearToken();
    socketService.disconnect();
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]);

  // Page link actions
  const createPageLink = useCallback(async (sourcePageId: string, targetPageId: string, linkText: string) => {
    try {
      const linkData = await apiService.createPageLink(sourcePageId, { 
        targetPageId, 
        linkText 
      });
      dispatch({ type: 'CREATE_PAGE_LINK', payload: linkData });
      return linkData;
    } catch (error) {
      console.error('Failed to create page link:', error);
      throw error;
    }
  }, [dispatch]);

  // Version history actions
  const getPageVersions = useCallback(async (pageId: string) => {
    try {
      const versions = await apiService.getPageVersions(pageId);
      return versions;
    } catch (error) {
      console.error('Failed to get page versions:', error);
      throw error;
    }
  }, []);

  const restorePageVersion = useCallback(async (pageId: string, versionId: string) => {
    try {
      const version = await apiService.restorePageVersion(pageId, versionId);
      dispatch({ type: 'RESTORE_PAGE_VERSION', payload: { pageId, version } });
      return version;
    } catch (error) {
      console.error('Failed to restore page version:', error);
      throw error;
    }
  }, [dispatch]);

  // Collaboration actions
  const addCollaborator = useCallback(async (projectId: string, email: string, role: 'editor' | 'viewer') => {
    try {
      const collaborator = await apiService.addCollaborator(projectId, { email, role });
      dispatch({ type: 'ADD_COLLABORATOR', payload: { projectId, userId: collaborator.userId, role } });
      return collaborator;
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      throw error;
    }
  }, [dispatch]);

  const removeCollaborator = useCallback(async (projectId: string, userId: string) => {
    try {
      await apiService.removeCollaborator(projectId, userId);
      dispatch({ type: 'REMOVE_COLLABORATOR', payload: { projectId, userId } });
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      throw error;
    }
  }, [dispatch]);

  return {
    // Project actions
    createProject,
    selectProject,
    
    // Page actions
    createPage,
    selectPage,
    updatePageContent,
    updatePageTitle,
    
    // Auth actions
    login,
    register,
    logout,
    
    // Page link actions
    createPageLink,
    
    // Version history actions
    getPageVersions,
    restorePageVersion,
    
    // Collaboration actions
    addCollaborator,
    removeCollaborator,
  };
}
