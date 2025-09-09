import { useState } from 'react';
import { Link, Plus, Search } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface PageLinkCreatorProps {
  currentPageId: string;
  onLinkCreated?: () => void;
}

export default function PageLinkCreator({ currentPageId, onLinkCreated }: PageLinkCreatorProps) {
  const { state, dispatch } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');

  // Get all pages from all projects, excluding the current page
  const allPages = state.projects
    .flatMap(project => project.pages)
    .filter(page => page.id !== currentPageId);

  // Filter pages based on search term
  const filteredPages = allPages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLink = () => {
    if (selectedPageId && linkText.trim()) {
      dispatch({
        type: 'CREATE_PAGE_LINK',
        payload: {
          sourcePageId: currentPageId,
          targetPageId: selectedPageId,
          linkText: linkText.trim(),
        },
      });
      
      // Insert the link into the current page content
      const currentPage = state.projects
        .flatMap(p => p.pages)
        .find(p => p.id === currentPageId);
      
      if (currentPage) {
        const linkMarkdown = `[${linkText.trim()}](page:${selectedPageId})`;
        const newContent = currentPage.content + (currentPage.content ? '\n\n' : '') + linkMarkdown;
        
        dispatch({
          type: 'UPDATE_PAGE_CONTENT',
          payload: { pageId: currentPageId, content: newContent },
        });
      }

      // Reset form
      setLinkText('');
      setSelectedPageId('');
      setSearchTerm('');
      setIsOpen(false);
      onLinkCreated?.();
    }
  };

  const handleCreateSubPage = () => {
    const title = prompt('Sub-page title:');
    if (title?.trim()) {
      const currentPage = state.projects
        .flatMap(p => p.pages)
        .find(p => p.id === currentPageId);
      
      if (currentPage) {
        dispatch({
          type: 'CREATE_PAGE',
          payload: {
            projectId: currentPage.projectId,
            title: title.trim(),
            parentPageId: currentPageId,
          },
        });
        
        // Insert the sub-page link into the current page content
        const linkMarkdown = `[${title.trim()}](page:${uuidv4()})`;
        const newContent = currentPage.content + (currentPage.content ? '\n\n' : '') + linkMarkdown;
        
        dispatch({
          type: 'UPDATE_PAGE_CONTENT',
          payload: { pageId: currentPageId, content: newContent },
        });
      }
      
      setIsOpen(false);
      onLinkCreated?.();
    }
  };

  if (!isOpen) {
    return (
      <button
        className="link-creator-button"
        onClick={() => setIsOpen(true)}
        title="Create page link or sub-page"
      >
        <Link size={16} />
        <span>Link</span>
      </button>
    );
  }

  return (
    <div className="link-creator-modal">
      <div className="link-creator-content">
        <div className="link-creator-header">
          <h3>Create Page Link</h3>
          <button
            className="close-button"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="link-creator-form">
          <div className="form-group">
            <label>Link Text:</label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Enter link text..."
              className="link-text-input"
            />
          </div>

          <div className="form-group">
            <label>Link to Page:</label>
            <div className="page-search">
              <Search size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pages..."
                className="page-search-input"
              />
            </div>
            
            <div className="page-list">
              {filteredPages.map(page => (
                <div
                  key={page.id}
                  className={`page-option ${selectedPageId === page.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPageId(page.id)}
                >
                  <span className="page-title">{page.title}</span>
                  <span className="page-project">
                    {state.projects.find(p => p.id === page.projectId)?.title}
                  </span>
                </div>
              ))}
              
              {filteredPages.length === 0 && searchTerm && (
                <div className="no-results">No pages found</div>
              )}
            </div>
          </div>

          <div className="link-creator-actions">
            <button
              className="create-subpage-button"
              onClick={handleCreateSubPage}
            >
              <Plus size={16} />
              <span>Create Sub-page</span>
            </button>
            
            <button
              className="create-link-button"
              onClick={handleCreateLink}
              disabled={!selectedPageId || !linkText.trim()}
            >
              Create Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate UUID (you might want to import this from uuid)
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
