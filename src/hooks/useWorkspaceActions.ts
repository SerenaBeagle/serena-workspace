import { useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import apiService from '../services/api';
import socketService from '../services/socket';

export const useWorkspaceActions = () => {
  const { state, dispatch } = useWorkspace();

  // Project actions
  const createProject = useCallback(async (title: string, description?: string) => {
    try {
      const projectData = await apiService.createProject({
        title,
        description,
        isPublic: true,
        isGlobal: true
      });
      
      dispatch({ type: 'CREATE_PROJECT', payload: { title, description } });
      
      // Join project room for real-time collaboration
      socketService.joinProject(projectData.id);
      
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

  // Page actions
  const createPage = useCallback(async (projectId: string, title: string, parentPageId?: string) => {
    try {
      console.log('Creating page with data:', { projectId, title, parentPageId });
      
      // Save current page content before creating new page
      if (state.currentPage) {
        try {
          await updatePageContent(state.currentPage.id, state.editorContent || state.currentPage.content, 'Auto-save before creating new page');
        } catch (error) {
          console.error('Failed to save current page content:', error);
        }
      }
      
      const requestData = { 
        projectId, 
        title, 
        parentPageId 
      };
      console.log('Request data being sent:', JSON.stringify(requestData, null, 2));
      
      const pageData = await apiService.createPage(requestData);
      
      console.log('Page created successfully:', pageData);
      console.log('Page ID from backend:', pageData.id);
      dispatch({ type: 'CREATE_PAGE', payload: pageData });
      
      // Join project room if not already joined
      socketService.joinProject(projectId);
      
      // Broadcast page creation to other users
      socketService.broadcastPageCreated(pageData);
      
      return pageData;
    } catch (error) {
      console.error('Failed to create page:', error);
      throw error;
    }
  }, [dispatch, state.currentPage, state.editorContent, updatePageContent]);

  const selectPage = useCallback(async (pageId: string) => {
    // Save current page content before switching
    if (state.currentPage && state.currentPage.id !== pageId) {
      try {
        await updatePageContent(state.currentPage.id, state.editorContent || state.currentPage.content, 'Auto-save before switching');
      } catch (error) {
        console.error('Failed to save current page content:', error);
      }
    }
    
    dispatch({ type: 'SELECT_PAGE', payload: { pageId } });
    // Start editing for real-time collaboration
    socketService.startEditing(pageId);
  }, [dispatch, state.currentPage, state.editorContent, updatePageContent]);

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

  const createPageLink = useCallback(async (sourcePageId: string, targetPageId: string, linkText: string) => {
    try {
      const linkData = await apiService.createPageLink({
        sourcePageId,
        targetPageId,
        linkText
      });
      
      dispatch({ 
        type: 'CREATE_PAGE_LINK', 
        payload: { sourcePageId, targetPageId, linkText } 
      });
      
      return linkData;
    } catch (error) {
      console.error('Failed to create page link:', error);
      throw error;
    }
  }, [dispatch]);

  const restorePageVersion = useCallback(async (pageId: string, version: any) => {
    try {
      await apiService.restorePageVersion(pageId, version.id);
      dispatch({ 
        type: 'RESTORE_PAGE_VERSION', 
        payload: { pageId, version } 
      });
    } catch (error) {
      console.error('Failed to restore page version:', error);
      throw error;
    }
  }, [dispatch]);

  const getPageVersions = useCallback(async (pageId: string) => {
    try {
      const versions = await apiService.getPageVersions(pageId);
      return versions;
    } catch (error) {
      console.error('Failed to get page versions:', error);
      throw error;
    }
  }, []);

  const toggleSplitView = useCallback(() => {
    dispatch({ type: 'TOGGLE_SPLIT_VIEW' });
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
    createPageLink,
    restorePageVersion,
    getPageVersions,
    toggleSplitView,
  };
};