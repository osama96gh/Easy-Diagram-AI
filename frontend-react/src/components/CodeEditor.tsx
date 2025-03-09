import React, { useRef, KeyboardEvent } from 'react';

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
}

/**
 * CodeEditor component for editing mermaid code
 */
const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handles changes to the code in the textarea
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCodeChange(e.target.value);
  };

  /**
   * Clears the code editor and resets to default example
   */
  const clearEditor = () => {
    const defaultCode = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;
    
    onCodeChange(defaultCode);
  };

  /**
   * Copies the current code to clipboard
   */
  const copyCode = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      document.execCommand('copy');
      
      // Visual feedback could be added here
    }
  };

  /**
   * Handles tab key in the textarea to insert tabs instead of changing focus
   */
  const handleTabKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // Insert tab at cursor position
        const newValue = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        
        // Update the textarea value
        onCodeChange(newValue);
        
        // Move cursor after the inserted tab
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
    }
  };

  return (
    <div className="editor-panel">
      <h2>Code Editor</h2>
      <div className="toolbar">
        <button onClick={clearEditor}>Clear</button>
        <button onClick={copyCode}>Copy Code</button>
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleCodeChange}
        onKeyDown={handleTabKey}
        placeholder="Enter your mermaid code here..."
        className="code-editor"
      />
    </div>
  );
};

export default CodeEditor;
