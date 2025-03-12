import React, { useState, KeyboardEvent } from 'react';
import SendIcon from '@mui/icons-material/Send';
import { BasePanel, StatusMessage } from '../../common';
import './CommandBox.css';

interface CommandBoxProps {
  onSendRequest: (request: string) => Promise<void>;
  isProcessing: boolean;
  statusMessage: string | null;
  statusType: 'loading' | 'error' | 'success' | null;
  panelId: string;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

/**
 * CommandBox component for sending natural language requests in the bottom panel
 */
const CommandBox: React.FC<CommandBoxProps> = ({ 
  onSendRequest, 
  isProcessing, 
  statusMessage, 
  statusType,
  panelId,
  isSaving = false,
  lastSaved = null
}) => {
  const [request, setRequest] = useState('');

  /**
   * Handles changes to the input field
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequest(e.target.value);
  };

  /**
   * Handles the submit button click
   */
  const handleSubmit = async () => {
    if (request.trim() && !isProcessing) {
      await onSendRequest(request.trim());
      setRequest('');
    }
  };

  /**
   * Handles the Enter key press
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <BasePanel
      title="Bottom Panel - Command Box"
      panelId={panelId}
      orientation="vertical"
    >
      <div className="command-input-container">
        <div className="input-with-icon">
          <input
            type="text"
            value={request}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter command to modify diagram..."
            disabled={isProcessing}
            className="command-input"
          />
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !request.trim()}
            className="send-icon-btn"
            aria-label="Send command"
          >
            <SendIcon fontSize="small" />
          </button>
        </div>
      </div>
      <StatusMessage 
        message={statusMessage}
        type={statusType}
        autoHide={statusType === 'success'}
      />
          
      {/* Saving status display */}
      <div className="saving-status">
        {isSaving && <span className="saving-indicator">Saving diagram...</span>}
        {!isSaving && lastSaved && (
          <span className="last-saved">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    </BasePanel>
  );
};

export default CommandBox;
