import React, { useState, useEffect } from 'react';
import './App.css';
import CodeEditor from './components/CodeEditor';
import DiagramRenderer from './components/DiagramRenderer';
import ChatBox from './components/ChatBox';
import { apiService } from './services/api';

function App() {
  // State for the mermaid code
  const [code, setCode] = useState<string>(`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`);

  // State for the chat box
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'loading' | 'error' | 'success' | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);

  // Check if the API is available when the component mounts
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        console.log('Checking API availability...');
        const isAvailable = await apiService.checkAPIAvailability();
        console.log('API available:', isAvailable);
        setIsApiAvailable(isAvailable);
        
        if (!isAvailable) {
          setStatusMessage('AI service is currently unavailable');
          setStatusType('error');
        }
      } catch (error) {
        console.error('Error checking API availability:', error);
        setIsApiAvailable(false);
        setStatusMessage('Failed to connect to AI service');
        setStatusType('error');
      }
    };

    checkApiAvailability();
  }, []);

  // Handle code changes from the editor
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  // Handle requests from the chat box
  const handleSendRequest = async (request: string) => {
    console.log('Sending request:', request);
    
    if (!isApiAvailable) {
      console.warn('API is not available');
      setStatusMessage('AI service is currently unavailable');
      setStatusType('error');
      return;
    }

    if (!code.trim()) {
      console.warn('No code provided');
      setStatusMessage('Please enter some mermaid code first');
      setStatusType('error');
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage('Processing your request...');
      setStatusType('loading');
      console.log('Processing request with code:', code);

      // Send the request to the AI service
      const updatedCode = await apiService.updateDiagramWithAI(code, request);
      console.log('Received updated code:', updatedCode);

      // Update the code
      setCode(updatedCode);

      // Show success message
      setStatusMessage('Diagram updated successfully!');
      setStatusType('success');

      // Hide success message after a few seconds
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 3000);
    } catch (error) {
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to update diagram';
      console.error('AI request error:', error);
      setStatusMessage(errorMessage);
      setStatusType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <CodeEditor code={code} onCodeChange={handleCodeChange} />
        <DiagramRenderer code={code} />
      </div>
      <ChatBox
        onSendRequest={handleSendRequest}
        isProcessing={isProcessing}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    </div>
  );
}

export default App;
