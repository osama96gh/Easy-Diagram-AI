import React, { useState, KeyboardEvent } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { usePanelContext } from '../contexts/PanelContext';

interface CommandBoxProps {
  onSendRequest: (request: string) => Promise<void>;
  isProcessing: boolean;
  statusMessage: string | null;
  statusType: 'loading' | 'error' | 'success' | null;
  panelId: string;
}

/**
 * CommandBox component for sending natural language requests in the bottom panel
 */
const CommandBox: React.FC<CommandBoxProps> = ({ 
  onSendRequest, 
  isProcessing, 
  statusMessage, 
  statusType,
  panelId
}) => {
  const { isPanelExpanded, togglePanelExpansion, getPanelStyle } = usePanelContext();
  const isVisible = isPanelExpanded(panelId);
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
    <div 
      className={`command-box ${isVisible ? '' : 'collapsed'}`}
      style={getPanelStyle(panelId)}
    >
      <div className="command-box-header">
        <h2>Bottom Panel - Command Box</h2>
        <button 
          className="toggle-arrow" 
          onClick={() => togglePanelExpansion(panelId)}
          aria-label={isVisible ? "Hide command box" : "Show command box"}
        >
          {isVisible ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
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
