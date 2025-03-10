import React, { useState, KeyboardEvent } from 'react';

interface CommandBoxProps {
  onSendRequest: (request: string) => Promise<void>;
  isProcessing: boolean;
  statusMessage: string | null;
  statusType: 'loading' | 'error' | 'success' | null;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

/**
 * CommandBox component for sending natural language requests
 */
const CommandBox: React.FC<CommandBoxProps> = ({ 
  onSendRequest, 
  isProcessing, 
  statusMessage, 
  statusType,
  isVisible,
  onToggleVisibility
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
    <div className={`command-box ${isVisible ? '' : 'collapsed'}`}>
      <div className="command-box-header">
        <h2>Command Box</h2>
        <button 
          className="toggle-arrow" 
          onClick={onToggleVisibility}
          aria-label={isVisible ? "Hide command box" : "Show command box"}
        >
          {isVisible ? '▼' : '▲'}
        </button>
      </div>
      {isVisible && (
        <>
          <div className="command-input-container">
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
          className="command-submit-btn"
        >
          Update Diagram
        </button>
      </div>
          {statusMessage && (
            <div className={`status ${statusType || ''}`} style={{ display: 'block' }}>
              {statusMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommandBox;
