import React, { useState } from 'react';
import { Plus, Folder, FileText, ChevronRight, ChevronDown, Link } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceActions } from '../hooks/useWorkspaceActions';
import { Page } from '../types';

export default function Sidebar() {
  const { state } = useWorkspace();
  const { createProject, selectProject, selectPage, createPage } = useWorkspaceActions();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleCreateProject = async () => {
    if (newProjectTitle.trim()) {
      try {
        await createProject(newProjectTitle.trim());
        setNewProjectTitle('');
        setIsCreatingProject(false);
      } catch (error) {
        console.error('Failed to create project:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    } else if (e.key === 'Escape') {
      setIsCreatingProject(false);
      setNewProjectTitle('');
    }
  };

  const renderPageHierarchy = (pages: Page[] = [], parentId?: string, level: number = 0) => {
    if (!pages || !Array.isArray(pages)) {
      return null;
    }
    
    const rootPages = pages.filter(page => 
      parentId ? page.parentPageId === parentId : !page.parentPageId
    );

    return rootPages.map((page) => (
      <div key={page.id} className="page-hierarchy">
        <div
          className={`page-item ${state.currentPage?.id === page.id ? 'active' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => selectPage(page.id)}
        >
          <FileText size={14} />
          <span className="page-title">{page.title}</span>
          {page.linkedPages && page.linkedPages.length > 0 && (
            <Link size={12} className="link-indicator" />
          )}
        </div>
        
        {/* Render child pages */}
        {page.childPages && page.childPages.length > 0 && renderPageHierarchy(pages, page.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Workspace</h2>
        <button
          className="add-button"
          onClick={() => setIsCreatingProject(true)}
          title="New Project"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="sidebar-content">
        {isCreatingProject && (
          <div className="create-project-form">
            <input
              type="text"
              placeholder="Project name..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!newProjectTitle.trim()) {
                  setIsCreatingProject(false);
                }
              }}
              autoFocus
            />
          </div>
        )}

        {state.projects && Array.isArray(state.projects) ? state.projects.map((project) => (
          <div key={project.id} className="project-item">
            <div
              className="project-header"
              onClick={() => {
                selectProject(project.id);
                toggleProjectExpansion(project.id);
              }}
            >
              <div className="project-toggle">
                {expandedProjects.has(project.id) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <Folder size={16} />
              </div>
              <span className="project-title">{project.title}</span>
            </div>

            {expandedProjects.has(project.id) && (
              <div className="pages-list">
                {renderPageHierarchy(project.pages || [])}
                <button
                  className="add-page-button"
                  onClick={async () => {
                    if (!state.currentUser) {
                      alert('Please log in first to create pages.');
                      return;
                    }
                    
                    const title = prompt('Page title:');
                    if (title?.trim()) {
                      try {
                        console.log('Creating page:', { projectId: project.id, title: title.trim() });
                        const pageData = await createPage(project.id, title.trim());
                        console.log('Page created successfully:', pageData);
                      } catch (error) {
                        console.error('Failed to create page:', error);
                        alert(`Failed to create page: ${error.message || 'Unknown error'}`);
                      }
                    }
                  }}
                >
                  <Plus size={12} />
                  <span>Add page</span>
                </button>
              </div>
            )}
          </div>
        )) : (
          <div className="empty-state">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
