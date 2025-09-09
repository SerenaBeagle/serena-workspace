import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import CustomMarkdown from './CustomMarkdown';
import PageLinkCreator from './PageLinkCreator';
import { useWorkspace } from '../context/WorkspaceContext';

interface MarkdownEditorProps {
  pageId: string;
  content: string;
  isSplitView?: boolean;
}

export default function MarkdownEditor({ pageId, content, isSplitView = false }: MarkdownEditorProps) {
  const { dispatch } = useWorkspace();
  const [editorContent, setEditorContent] = useState(content);

  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    dispatch({
      type: 'UPDATE_PAGE_CONTENT',
      payload: { pageId, content: newContent },
    });
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
