import React, { useState, KeyboardEvent } from 'react';

interface ChatBoxProps {
  onSendRequest: (request: string) => Promise<void>;
  isProcessing: boolean;
  statusMessage: string | null;
  statusType: 'loading' | 'error' | 'success' | null;
}

/**
 * ChatBox component for sending natural language requests
 */
const ChatBox: React.FC<ChatBoxProps> = ({ 
  onSendRequest, 
  isProcessing, 
  statusMessage, 
  statusType 
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
    <div className="chat-box">
      <h2>Chat Box</h2>
      <div className="chat-input-container">
        <input
          type="text"
          value={request}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter command to modify diagram..."
          disabled={isProcessing}
          className="chat-input"
        />
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !request.trim()}
          className="chat-submit-btn"
        >
          Update Diagram
        </button>
      </div>
      {statusMessage && (
        <div className={`status ${statusType || ''}`} style={{ display: 'block' }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default ChatBox;
