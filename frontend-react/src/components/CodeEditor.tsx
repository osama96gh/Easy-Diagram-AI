import React, { useRef, KeyboardEvent } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { usePanelContext } from '../contexts/PanelContext';

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  panelId: string;
}

/**
 * CodeEditor component for editing mermaid code in the left panel
 */
const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, panelId }) => {
  const { isPanelExpanded, togglePanelExpansion, getPanelStyle } = usePanelContext();
  const isVisible = isPanelExpanded(panelId);
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
    <div 
      className={`editor-panel ${isVisible ? '' : 'collapsed'}`}
      style={getPanelStyle(panelId)}
    >
      <div className="editor-panel-header">
        <h2>Left Panel - Code Editor</h2>
        <button 
          className="toggle-arrow" 
          onClick={() => togglePanelExpansion(panelId)}
          aria-label={isVisible ? "Hide code editor" : "Show code editor"}
        >
          {isVisible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
      </div>
      {isVisible && (
        <div className="code-editor-container">
          <div className="editor-actions">
            <button 
              onClick={clearEditor} 
              className="icon-button" 
              title="Clear code"
              aria-label="Clear code"
            >
              <span className="icon">🗑️</span>
            </button>
            <button 
              onClick={copyCode} 
              className="icon-button" 
              title="Copy code"
              aria-label="Copy code"
            >
              <span className="icon">📋</span>
            </button>
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
      )}
    </div>
  );
};

export default CodeEditor;
