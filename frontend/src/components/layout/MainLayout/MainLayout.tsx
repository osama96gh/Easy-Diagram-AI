import React, { useState, useEffect } from 'react';
import { PanelProvider, usePanelContext } from '../../../contexts/PanelContext';
import { CodeEditor, CommandBox } from '../../editor';
import { DiagramRenderer } from '../../diagram';
import { DiagramList } from '../../storage';
import { apiService } from '../../../services/api';
import { useDiagramContext } from '../../../contexts/DiagramContext';
import { useAuth } from '../../../contexts/AuthContext';
import './MainLayout.css';

/**
 * MainLayout component that handles the overall application layout and state
 */
const MainLayout: React.FC = () => {
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
  
  // Get diagram context
  const { 
    selectDiagram: contextSelectDiagram,
    createDiagram: contextCreateDiagram,
    deleteDiagram: contextDeleteDiagram,
    refreshExpandedFolders
  } = useDiagramContext();

  // Check if the API is available and load the selected or latest diagram when the component mounts
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

        // Check if there's a selected diagram ID in localStorage
        const savedDiagramId = localStorage.getItem('selectedDiagramId');
        
        if (savedDiagramId) {
          // Try to load the selected diagram
          try {
            const diagramId = parseInt(savedDiagramId, 10);
            console.log('Loading selected diagram:', diagramId);
            
            const selectedDiagram = await apiService.getDiagram(diagramId);
            
            if (selectedDiagram && selectedDiagram.content) {
              console.log('Selected diagram loaded:', selectedDiagram);
              setCode(selectedDiagram.content);
              setDiagramId(selectedDiagram.id);
              setLastSaved(new Date(selectedDiagram.last_updated));
              // Set the title if available
              if (selectedDiagram.name) {
                setTitle(selectedDiagram.name);
              }
              setStatusMessage('Selected diagram loaded');
              setStatusType('success');
              
              // Hide success message after a few seconds
              setTimeout(() => {
                setStatusMessage(null);
                setStatusType(null);
              }, 3000);
              
              // Exit early since we've loaded the selected diagram
              return;
            }
          } catch (error) {
            console.error('Error loading selected diagram:', error);
            // Continue with loading the latest diagram if loading the selected diagram fails
          }
        }
        
        // If no selected diagram or loading it failed, try to load the latest diagram
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
  const handleCreateNewDiagram = async (folderId?: number, title: string = '') => {
    try {
      setStatusMessage('Creating new diagram...');
      setStatusType('loading');
      
      // Create a new diagram with empty content and the provided title
      let newDiagram;
      if (folderId !== undefined) {
        // Create diagram in the specified folder using context
        newDiagram = await contextCreateDiagram(folderId, emptyDiagram, title);
      } else {
        // Create diagram in the root folder (default behavior)
        const rootFolder = await apiService.getFolders().then(folders => 
          folders.find(folder => folder.is_root)
        );
        
        if (rootFolder) {
          newDiagram = await contextCreateDiagram(rootFolder.id, emptyDiagram, title);
        } else {
          newDiagram = await apiService.createDiagram(emptyDiagram, title);
        }
      }
      
      // Update state with the new diagram
      setCode(emptyDiagram);
      setDiagramId(newDiagram.id);
      setTitle(title);
      setLastSaved(new Date(newDiagram.last_updated));
      
      // Refresh folders to show the new diagram
      refreshExpandedFolders();
      
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
      
      // Update context with selected diagram
      contextSelectDiagram(selectedDiagramId);
      
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

  // Handle diagram deletion
  const handleDeleteDiagram = async (diagramIdToDelete: number) => {
    try {
      setStatusMessage('Deleting diagram...');
      setStatusType('loading');
      
      // Delete the diagram using context
      await contextDeleteDiagram(diagramIdToDelete);
      
      // If the deleted diagram was the current one
      if (diagramId === diagramIdToDelete) {
        // Get all diagrams to find another one to select
        const remainingDiagrams = await apiService.getAllDiagrams();
        
        if (remainingDiagrams.length > 0) {
          // Select the first available diagram
          const firstDiagram = remainingDiagrams[0];
          
          // Load the selected diagram
          const diagramData = await apiService.getDiagram(firstDiagram.id);
          
          // Update state with the loaded diagram
          setCode(diagramData.content);
          setDiagramId(diagramData.id);
          setTitle(diagramData.name || '');
          setLastSaved(new Date(diagramData.last_updated));
          
          setStatusMessage('Diagram deleted and new diagram loaded');
        } else {
          // No diagrams left, reset to empty
          setCode(emptyDiagram);
          setDiagramId(null);
          setTitle('');
          setLastSaved(null);
          
          setStatusMessage('Diagram deleted');
        }
      } else {
        setStatusMessage('Diagram deleted successfully');
      }
      
      // Refresh folders to update the UI
      refreshExpandedFolders();
      
      // Set status type to success
      setStatusType('success');
      
      // Hide success message after a few seconds
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting diagram:', error);
      setStatusMessage('Failed to delete diagram');
      setStatusType('error');
    }
  };

  return (
    <PanelProvider>
      <MainLayoutContent
        code={code}
        title={title}
        diagramId={diagramId}
        onCodeChange={handleCodeChange}
        onTitleChange={handleTitleChange}
        onSelectDiagram={handleSelectDiagram}
        onCreateDiagram={handleCreateNewDiagram}
        onDeleteDiagram={handleDeleteDiagram}
        onSendRequest={handleSendRequest}
        isProcessing={isProcessing}
        statusMessage={statusMessage}
        statusType={statusType}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />
    </PanelProvider>
  );
};

// Separate component to use the PanelContext
interface MainLayoutContentProps {
  code: string;
  title: string;
  diagramId: number | null;
  onCodeChange: (code: string) => void;
  onTitleChange: (title: string) => void;
  onSelectDiagram: (id: number) => void;
  onCreateDiagram: (folderId?: number, title?: string) => void;
  onDeleteDiagram: (id: number) => void;
  onSendRequest: (request: string) => Promise<void>;
  isProcessing: boolean;
  statusMessage: string | null;
  statusType: 'loading' | 'error' | 'success' | null;
  isSaving: boolean;
  lastSaved: Date | null;
}

const MainLayoutContent: React.FC<MainLayoutContentProps> = (props) => {
  const { isPanelExpanded } = usePanelContext();
  const { user, signOut } = useAuth();
  const isBottomPanelExpanded = isPanelExpanded('bottomPanel');
  
  return (
    <div className="app-container">
      <div className="auth-header">
        <span className="user-email">{user?.email}</span>
        <button onClick={signOut}>Sign Out</button>
      </div>
      <div className="main-panel">
        <CodeEditor 
          code={props.code} 
          title={props.title}
          onCodeChange={props.onCodeChange}
          onTitleChange={props.onTitleChange}
          panelId="leftPanel"
        />
        <DiagramRenderer 
          code={props.code}
          title={props.title}
          panelId="centerPanel"
          diagramId={props.diagramId}
        />
        <DiagramList
          onSelectDiagram={props.onSelectDiagram}
          onCreateDiagram={props.onCreateDiagram}
          onDeleteDiagram={props.onDeleteDiagram}
          currentDiagramId={props.diagramId}
          panelId="rightPanel"
        />
      </div>
      <div 
        className={`bottom-panel ${!isBottomPanelExpanded ? 'collapsed' : ''}`}
      >
        <CommandBox
          onSendRequest={props.onSendRequest}
          isProcessing={props.isProcessing}
          statusMessage={props.statusMessage}
          statusType={props.statusType}
          panelId="bottomPanel"
          isSaving={props.isSaving}
          lastSaved={props.lastSaved}
        />
      </div>
    </div>
  );
};

export default MainLayout;
