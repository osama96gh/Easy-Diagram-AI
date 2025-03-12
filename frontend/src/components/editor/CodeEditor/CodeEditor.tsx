import React, { useRef, KeyboardEvent, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { BasePanel } from '../../common';
import TitleEditor from './TitleEditor';
import EditorToolbar from './EditorToolbar';
import './CodeEditor.css';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState<boolean>(false);

  /**
   * Handles changes to the code in the textarea
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCodeChange(e.target.value);
  };

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
      const fileName = title.trim() ? 
        `${title.trim()}.mmd` : 
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
    <BasePanel
      title="Left Panel - Code Editor"
      panelId={panelId}
      orientation="horizontal"
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
      <div className="code-editor-container">
          <TitleEditor title={title} onTitleChange={onTitleChange} />
          <div className="code-textarea-container">
            <EditorToolbar 
              onClear={clearEditor}
              onCopy={copyCode}
              onDownload={downloadCode}
            />
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
    </BasePanel>
  );
};

export default CodeEditor;
