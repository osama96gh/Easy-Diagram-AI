import React, { useState, useEffect } from 'react';
import './App.css';
import CodeEditor from './components/CodeEditor';
import DiagramRenderer from './components/DiagramRenderer';
import CommandBox from './components/CommandBox';
import DiagramList from './components/DiagramList';
import { apiService } from './services/api';
import { PanelProvider } from './contexts/PanelContext';

function App() {
  // Empty diagram code
  const emptyDiagram = `graph TD`;

  // State for the mermaid code
  const [code, setCode] = useState<string>(emptyDiagram);
  
  // State for the diagram title
  const [title, setTitle] = useState<string>('');

  // State for diagram persistence
  const [diagramId, setDiagramId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // State for component functionality
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'loading' | 'error' | 'success' | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [diagramListRefreshTrigger, setDiagramListRefreshTrigger] = useState<number>(0);

  // Check if the API is available and load the latest diagram when the component mounts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Checking API availability...');
        const isAvailable = await apiService.checkAPIAvailability();
        console.log('API available:', isAvailable);
        setIsApiAvailable(isAvailable);
        
        if (!isAvailable) {
          setStatusMessage('Backend service is currently unavailable');
          setStatusType('error');
          return;
        }

        // Try to load the latest diagram
        try {
          console.log('Loading latest diagram...');
          const latestDiagram = await apiService.getLatestDiagram();
          
          if (latestDiagram && latestDiagram.content) {
            console.log('Latest diagram loaded:', latestDiagram);
            setCode(latestDiagram.content);
            setDiagramId(latestDiagram.id);
            setLastSaved(new Date(latestDiagram.last_updated));
            // Set the title if available
            if (latestDiagram.name) {
              setTitle(latestDiagram.name);
            }
            setStatusMessage('Latest diagram loaded');
            setStatusType('success');
            
            // Hide success message after a few seconds
            setTimeout(() => {
              setStatusMessage(null);
              setStatusType(null);
            }, 3000);
          } else {
            console.log('No existing diagram found, using empty diagram');
          }
        } catch (error) {
          console.error('Error loading diagram:', error);
          // Continue with empty diagram if loading fails
        }
      } catch (error) {
        console.error('Error checking API availability:', error);
        setIsApiAvailable(false);
        setStatusMessage('Failed to connect to backend service');
        setStatusType('error');
      }
    };

    initializeApp();
  }, []);

  // Save diagram when code or title changes (with debounce)
  useEffect(() => {
    // Skip initial render and when API is not available
    if (!isApiAvailable) return;
    
    const saveTimeout = setTimeout(async () => {
      try {
        setIsSaving(true);
        
        if (diagramId) {
          // Update existing diagram
          console.log('Updating diagram with ID:', diagramId);
          const updatedDiagram = await apiService.updateDiagram(diagramId, code, title);
          setLastSaved(new Date(updatedDiagram.last_updated));
        } else {
          // Create new diagram
          console.log('Creating new diagram');
          const newDiagram = await apiService.createDiagram(code, title);
          setDiagramId(newDiagram.id);
          setLastSaved(new Date(newDiagram.last_updated));
        }
        
        setIsSaving(false);
      } catch (error) {
        console.error('Error saving diagram:', error);
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(saveTimeout);
  }, [code, title, diagramId, isApiAvailable]);

  // Handle code changes from the editor
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  // Handle title changes from the editor
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  // Handle requests from the command box
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

  // Create a new diagram with empty content
  const handleCreateNewDiagram = async () => {
    try {
      setStatusMessage('Creating new diagram...');
      setStatusType('loading');
      
      // Create a new diagram with empty content
      const newDiagram = await apiService.createDiagram(emptyDiagram, '');
      
      // Update state with the new diagram
      setCode(emptyDiagram);
      setDiagramId(newDiagram.id);
      setTitle('');
      setLastSaved(new Date(newDiagram.last_updated));
      
      // Trigger a refresh of the diagram list
      setDiagramListRefreshTrigger(prev => prev + 1);
      
      // Show success message
      setStatusMessage('New diagram created successfully');
      setStatusType('success');
      
      // Hide success message after a few seconds
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 3000);
    } catch (error) {
      console.error('Error creating new diagram:', error);
      setStatusMessage('Failed to create new diagram');
      setStatusType('error');
    }
  };

  // Handle diagram selection from the list
  const handleSelectDiagram = async (selectedDiagramId: number) => {
    try {
      setStatusMessage('Loading diagram...');
      setStatusType('loading');
      
      // Fetch the selected diagram
      const diagram = await apiService.getDiagram(selectedDiagramId);
      
      // Update state with the loaded diagram
      setCode(diagram.content);
      setDiagramId(diagram.id);
      setTitle(diagram.name || '');
      setLastSaved(new Date(diagram.last_updated));
      
      // Show success message
      setStatusMessage('Diagram loaded successfully');
      setStatusType('success');
      
      // Hide success message after a few seconds
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 3000);
    } catch (error) {
      console.error('Error loading diagram:', error);
      setStatusMessage('Failed to load diagram');
      setStatusType('error');
    }
  };

  return (
    <PanelProvider>
      <div className="app-container">
        <div className="main-panel">
          <CodeEditor 
            code={code} 
            title={title}
            onCodeChange={handleCodeChange}
            onTitleChange={handleTitleChange}
            panelId="leftPanel"
          />
          <DiagramRenderer 
            code={code}
            title={title}
            panelId="centerPanel"
          />
          <DiagramList
            onSelectDiagram={handleSelectDiagram}
            onCreateDiagram={handleCreateNewDiagram}
            currentDiagramId={diagramId}
            panelId="rightPanel"
            refreshTrigger={diagramListRefreshTrigger}
          />
        </div>
        <div className="bottom-panel">
          <CommandBox
            onSendRequest={handleSendRequest}
            isProcessing={isProcessing}
            statusMessage={statusMessage}
            statusType={statusType}
            panelId="bottomPanel"
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        </div>
      </div>
    </PanelProvider>
  );
}

export default App;
