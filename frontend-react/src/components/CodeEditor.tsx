import React, { useRef, KeyboardEvent, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { usePanelContext } from '../contexts/PanelContext';

interface CodeEditorProps {
  code: string;
  title?: string;
  onCodeChange: (code: string) => void;
  onTitleChange?: (title: string) => void;
  panelId: string;
}

/**
 * CodeEditor component for editing mermaid code in the left panel
 */
const CodeEditor: React.FC<CodeEditorProps> = ({ code, title = '', onCodeChange, onTitleChange, panelId }) => {
  const { isPanelExpanded, togglePanelExpansion, getPanelStyle } = usePanelContext();
  const isVisible = isPanelExpanded(panelId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTitleEditable, setIsTitleEditable] = useState<boolean>(false);
  const [editableTitle, setEditableTitle] = useState<string>(title);
  const [showClearConfirmation, setShowClearConfirmation] = useState<boolean>(false);

  /**
   * Handles changes to the code in the textarea
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCodeChange(e.target.value);
  };

  /**
   * Handles changes to the diagram title in the input field
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTitle(e.target.value);
  };

  /**
   * Toggles title editing mode
   */
  const toggleTitleEdit = () => {
    if (isTitleEditable && onTitleChange) {
      // Save the title when exiting edit mode
      onTitleChange(editableTitle);
    }
    setIsTitleEditable(!isTitleEditable);
  };

  /**
   * Updates the editable title when the prop changes
   */
  React.useEffect(() => {
    setEditableTitle(title);
  }, [title]);

  /**
   * Shows the confirmation dialog for clearing the editor
   */
  const clearEditor = () => {
    setShowClearConfirmation(true);
  };

  /**
   * Handles the actual clearing of the editor after confirmation
   */
  const handleClearConfirmed = () => {
    const emptyDiagram = `graph TD`;
    onCodeChange(emptyDiagram);
    setShowClearConfirmation(false);
  };

  /**
   * Closes the confirmation dialog without clearing
   */
  const handleCancelClear = () => {
    setShowClearConfirmation(false);
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
   * Downloads the current code as a text file
   */
  const downloadCode = () => {
    if (textareaRef.current) {
      const codeContent = textareaRef.current.value;
      const blob = new Blob([codeContent], { type: 'text/plain' });
      
      // Use the diagram title if available, otherwise use a default name
      const fileName = editableTitle.trim() ? 
        `${editableTitle.trim()}.mmd` : 
        'diagram.mmd';
      
      // Create a temporary link element to trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up the URL object
      URL.revokeObjectURL(downloadLink.href);
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
      {/* Clear confirmation dialog */}
      <Dialog
        open={showClearConfirmation}
        onClose={handleCancelClear}
        aria-labelledby="clear-dialog-title"
        aria-describedby="clear-dialog-description"
      >
        <DialogTitle id="clear-dialog-title">Clear Code Editor?</DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-dialog-description">
            Are you sure you want to clear the code editor? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClearConfirmed} color="primary" autoFocus>
            Clear
          </Button>
        </DialogActions>
      </Dialog>
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
          <div className="title-input-container">
            <div className="title-input-wrapper">
              <input
                type="text"
                value={editableTitle}
                onChange={handleTitleChange}
                placeholder="Title: Enter diagram title..."
                className="diagram-title-input"
                aria-label="Diagram title"
                readOnly={!isTitleEditable}
              />
              <button 
                onClick={toggleTitleEdit} 
                className="title-edit-button"
                aria-label={isTitleEditable ? "Save title" : "Edit title"}
                title={isTitleEditable ? "Save title" : "Edit title"}
              >
                {isTitleEditable ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
              </button>
            </div>
          </div>
          <div className="code-textarea-container">
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
              <button 
                onClick={downloadCode} 
                className="icon-button" 
                title="Download code"
                aria-label="Download code"
              >
                <span className="icon">💾</span>
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
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
