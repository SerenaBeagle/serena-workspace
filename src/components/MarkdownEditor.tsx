import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import CustomMarkdown from './CustomMarkdown';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceActions } from '../hooks/useWorkspaceActions';

interface MarkdownEditorProps {
  pageId: string;
  content: string;
  isSplitView?: boolean;
}

export default function MarkdownEditor({ pageId, content, isSplitView = false }: MarkdownEditorProps) {
  const { state } = useWorkspace();
  const { updatePageContent } = useWorkspaceActions();
  const [editorContent, setEditorContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setEditorContent(content);
  }, [content, pageId]); // Also update when pageId changes

  const handleEditorChange = async (value: string | undefined) => {
    const newContent = value || '';
    console.log('Editor content changed:', {
      pageId,
      newContent: newContent.substring(0, 100) + '...',
      isUpdating
    });
    
    setEditorContent(newContent);
    
    // Debounce API calls
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      console.log('Saving page content to backend...');
      await updatePageContent(pageId, newContent, 'Content updated');
      console.log('Page content saved successfully');
    } catch (error) {
      console.error('Failed to update page content:', error);
    } finally {
      setTimeout(() => setIsUpdating(false), 1000); // Debounce for 1 second
    }
  };

  if (isSplitView) {
    return (
      <div className="split-editor">
        <div className="editor-pane">
          <div className="pane-header">
            <span>Editor</span>
          </div>
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={editorContent}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'off',
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
            }}
            theme="vs"
          />
        </div>
        <div className="preview-pane">
          <div className="pane-header">
            <span>Preview</span>
          </div>
          <CustomMarkdown content={editorContent} />
        </div>
      </div>
    );
  }

  return (
    <div className="single-editor">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={editorContent}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'off',
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
        theme="vs"
      />
    </div>
  );
}
