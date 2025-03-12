import React from 'react';

interface EditorToolbarProps {
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

/**
 * EditorToolbar component for code editor actions
 */
const EditorToolbar: React.FC<EditorToolbarProps> = ({ onClear, onCopy, onDownload }) => {
  return (
    <div className="editor-actions">
      <button 
        onClick={onClear} 
        className="icon-button" 
        title="Clear code"
        aria-label="Clear code"
      >
        <span className="icon">🗑️</span>
      </button>
      <button 
        onClick={onCopy} 
        className="icon-button" 
        title="Copy code"
        aria-label="Copy code"
      >
        <span className="icon">📋</span>
      </button>
      <button 
        onClick={onDownload} 
        className="icon-button" 
        title="Download code"
        aria-label="Download code"
      >
        <span className="icon">💾</span>
      </button>
    </div>
  );
};

export default EditorToolbar;
