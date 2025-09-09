import MarkdownEditor from './MarkdownEditor';
import { useWorkspace } from '../context/WorkspaceContext';

export default function MainContent() {
  const { state } = useWorkspace();

  if (!state.currentPage) {
    return (
      <div className="main-content empty">
        <div className="empty-state">
          <h2>No page selected</h2>
          <p>Select a page from the sidebar to start editing, or create a new project and page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <MarkdownEditor
        pageId={state.currentPage.id}
        content={state.currentPage.content}
        isSplitView={state.isSplitView}
      />
    </div>
  );
}
