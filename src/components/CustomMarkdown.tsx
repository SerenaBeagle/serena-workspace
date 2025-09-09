import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWorkspace } from '../context/WorkspaceContext';

interface CustomMarkdownProps {
  content: string;
}

export default function CustomMarkdown({ content }: CustomMarkdownProps) {
  const { state, dispatch } = useWorkspace();

  const handlePageLinkClick = (pageId: string) => {
    dispatch({ type: 'SELECT_PAGE', payload: { pageId } });
  };

  const renderPageLink = (href: string, children: React.ReactNode) => {
    // Check if this is a page link (format: page:pageId)
    if (href.startsWith('page:')) {
      const pageId = href.substring(5);
      const page = state.projects
        .flatMap(p => p.pages)
        .find(p => p.id === pageId);
      
      if (page) {
        return (
          <button
            className="page-link"
            onClick={() => handlePageLinkClick(pageId)}
            title={`Go to: ${page.title}`}
          >
            {children}
          </button>
        );
      }
    }
    
    // Regular external link
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => renderPageLink(href || '', children),
        }}
      >
        {content || '*Start typing to see your markdown here...*'}
      </ReactMarkdown>
    </div>
  );
}
