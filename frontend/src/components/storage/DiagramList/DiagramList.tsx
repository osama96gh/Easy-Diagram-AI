import React, { useState, useEffect } from 'react';
import { apiService, FolderItem as FolderItemType, DiagramItem as DiagramItemType } from '../../../services/api';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { BasePanel, StatusMessage } from '../../common';
import FolderItem from './FolderItem';
import CreateFolderDialog from './CreateFolderDialog';
import MoveDiagramDialog from './MoveDiagramDialog';
import './DiagramList.css';

interface DiagramListProps {
  onSelectDiagram: (diagramId: number) => void;
  onCreateDiagram?: (folderId?: number, title?: string) => void;
  onDeleteDiagram?: (diagramId: number) => void;
  currentDiagramId: number | null;
  panelId: string;
  refreshTrigger?: number; // A value that changes to trigger a refresh
}

interface FolderItemWithState extends FolderItemType {
  isExpanded: boolean;
  children: FolderItemWithState[];
}

// Extended FolderItem type to match the one in FolderItem.tsx
interface ExtendedFolderItem extends FolderItemType {
  subfolders?: ExtendedFolderItem[];
  diagrams?: DiagramItemType[];
  isExpanded?: boolean;
}

/**
 * DiagramList component for displaying and managing diagrams and folders
 */
const DiagramList: React.FC<DiagramListProps> = ({ 
  onSelectDiagram, 
  onCreateDiagram,
  onDeleteDiagram,
  currentDiagramId, 
  panelId,
  refreshTrigger = 0 
}) => {
  const [folders, setFolders] = useState<FolderItemWithState[]>([]);
  const [folderDiagrams, setFolderDiagrams] = useState<{[folderId: number]: DiagramItemType[]}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for dialogs
  const [showMoveDiagramDialog, setShowMoveDiagramDialog] = useState<number | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState<boolean>(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [flattenedFolders, setFlattenedFolders] = useState<Array<{id: number, name: string, depth: number}>>([]);
  
  // State for create diagram dialog
  const [showCreateDiagramDialog, setShowCreateDiagramDialog] = useState<boolean>(false);
  const [createDiagramFolderId, setCreateDiagramFolderId] = useState<number | null>(null);
  const [newDiagramTitle, setNewDiagramTitle] = useState<string>('');
  
  // Function to add isExpanded property to folders recursively
  const addExpandedProperty = (folders: FolderItemType[]): FolderItemWithState[] => {
    return folders.map(folder => ({
      ...folder,
      isExpanded: false,
      children: folder.children ? addExpandedProperty(folder.children) : []
    }));
  };
  
  // Function to fetch folders
  const fetchFolders = async () => {
    try {
      const foldersList = await apiService.getFolders();
      const processedFolders = addExpandedProperty(foldersList);
      setFolders(processedFolders);
      
      // Fetch diagrams for the root folder
      if (processedFolders.length > 0) {
        fetchDiagramsForFolder(processedFolders[0].id);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders');
    }
  };
  
  // Function to fetch diagrams for a specific folder
  const fetchDiagramsForFolder = async (folderId: number) => {
    try {
      const diagrams = await apiService.getDiagramsInFolder(folderId);
      setFolderDiagrams(prev => ({
        ...prev,
        [folderId]: diagrams
      }));
    } catch (err) {
      console.error(`Error fetching diagrams for folder ${folderId}:`, err);
      setError(`Failed to load diagrams for folder ${folderId}`);
    }
  };
  
  // Function to flatten the folder hierarchy for the dropdown
  const flattenFolderHierarchy = (folders: FolderItemWithState[], depth: number = 0): Array<{id: number, name: string, depth: number}> => {
    let result: Array<{id: number, name: string, depth: number}> = [];
    
    folders.forEach(folder => {
      // Add the current folder to the result
      result.push({
        id: folder.id,
        name: folder.name,
        depth: depth
      });
      
      // Recursively add children if they exist
      if (folder.children && folder.children.length > 0) {
        result = [...result, ...flattenFolderHierarchy(folder.children, depth + 1)];
      }
    });
    
    return result;
  };

  // Fetch folders and diagrams when component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchFolders();
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up interval to refresh the data periodically
    const intervalId = setInterval(fetchData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshTrigger]);
  
  // Update flattened folders whenever the folders state changes
  useEffect(() => {
    setFlattenedFolders(flattenFolderHierarchy(folders));
  }, [folders]);
  
  // Toggle folder expansion
  const toggleFolderExpansion = async (folderId: number) => {
    const updateFoldersExpansion = (items: FolderItemWithState[]): FolderItemWithState[] => {
      return items.map(folder => {
        if (folder.id === folderId) {
          const newIsExpanded = !folder.isExpanded;
          
          // If expanding and we don't have diagrams for this folder yet, fetch them
          if (newIsExpanded && !folderDiagrams[folder.id]) {
            fetchDiagramsForFolder(folder.id);
          }
          
          return {
            ...folder,
            isExpanded: newIsExpanded,
            children: folder.children ? updateFoldersExpansion(folder.children) : []
          };
        } else {
          return {
            ...folder,
            children: folder.children ? updateFoldersExpansion(folder.children) : []
          };
        }
      });
    };
    
    setFolders(updateFoldersExpansion(folders));
  };
  
  // Open create folder dialog
  const openCreateFolderDialog = (parentId: number | null = null) => {
    setShowCreateFolderDialog(true);
    setCreateFolderParentId(parentId);
  };

  // Handle create folder dialog close
  const handleCreateFolderDialogClose = () => {
    setShowCreateFolderDialog(false);
    setCreateFolderParentId(null);
  };

  // Create a new folder
  const handleCreateFolder = async (name: string, parentId: number | null) => {
    try {
      if (!name.trim() || parentId === null) return;
      
      await apiService.createFolder(name.trim(), parentId);
      
      // Refresh folders
      await fetchFolders();
      
      // Close the dialog
      setShowCreateFolderDialog(false);
      setCreateFolderParentId(null);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
    }
  };
  
  // Delete a folder
  const handleDeleteFolder = async (folderId: number) => {
    try {
      await apiService.deleteFolder(folderId);
      
      // Refresh folders
      await fetchFolders();
    } catch (err) {
      console.error('Error deleting folder:', err);
      
      // Display the specific error message from the backend if available
      if (err instanceof Error) {
        // Extract the error message from the axios error response
        const errorMessage = err.message.includes('Cannot delete folder containing diagrams') 
          ? 'Cannot delete folder containing diagrams. Move or delete diagrams first.'
          : err.message;
        setError(errorMessage);
      } else {
        setError('Failed to delete folder');
      }
    }
  };
  
  // Handle move diagram dialog close
  const handleMoveDiagramDialogClose = () => {
    setShowMoveDiagramDialog(null);
  };

  // Move a diagram to a folder
  const handleMoveDiagram = async (diagramId: number, targetFolderId: number) => {
    try {
      await apiService.moveDiagram(diagramId, targetFolderId);
      
      // Refresh diagrams for all folders we have loaded
      const folderIds = Object.keys(folderDiagrams).map(id => parseInt(id, 10));
      for (const folderId of folderIds) {
        await fetchDiagramsForFolder(folderId);
      }
      
      setShowMoveDiagramDialog(null);
    } catch (err) {
      console.error('Error moving diagram:', err);
      setError('Failed to move diagram');
    }
  };
  
  // Handle create diagram
  const handleCreateDiagram = (folderId: number, title?: string) => {
    if (onCreateDiagram) {
      onCreateDiagram(folderId, title);
    }
  };
  
  // Recursive function to render folders
  const renderFolders = (folders: FolderItemWithState[] | ExtendedFolderItem[]) => {
    return folders.map(folder => (
      <FolderItem
        key={`folder-${folder.id}`}
        folder={folder as ExtendedFolderItem}
        diagrams={folderDiagrams[folder.id] || []}
        currentDiagramId={currentDiagramId}
        onToggleExpand={toggleFolderExpansion}
        onSelectDiagram={onSelectDiagram}
        onCreateDiagram={onCreateDiagram ? handleCreateDiagram : undefined}
        onCreateSubfolder={openCreateFolderDialog}
        onDeleteFolder={handleDeleteFolder}
        onDeleteDiagram={onDeleteDiagram}
        onMoveDiagram={setShowMoveDiagramDialog}
        renderSubfolders={(subfolders) => renderFolders(subfolders)}
      />
    ));
  };
  
  return (
    <BasePanel
      title="Diagrams"
      panelId={panelId}
      orientation="horizontal"
      headerContent={
        <div className="diagram-list-panel-controls">
          {onCreateDiagram && (
            <button
              className="new-diagram-button"
              onClick={(e) => {
                e.stopPropagation();
                // Find the root folder ID and create a diagram in it
                const rootFolder = folders.find(folder => folder.is_root);
                if (rootFolder) {
                  handleCreateDiagram(rootFolder.id);
                }
              }}
              aria-label="Create new diagram"
              title="Create new diagram"
            >
              <AddIcon />
            </button>
          )}
          <button
            className="new-folder-button"
            onClick={(e) => {
              e.stopPropagation();
              // Find the root folder ID and open the create folder dialog
              const rootFolder = folders.find(folder => folder.is_root);
              if (rootFolder) {
                openCreateFolderDialog(rootFolder.id);
              }
            }}
            aria-label="Create new folder"
            title="Create new folder"
          >
            <CreateNewFolderIcon />
          </button>
        </div>
      }
    >
      {/* Move Diagram Dialog */}
      <MoveDiagramDialog
        open={showMoveDiagramDialog !== null}
        diagramId={showMoveDiagramDialog}
        onClose={handleMoveDiagramDialogClose}
        onMove={handleMoveDiagram}
        folders={flattenedFolders}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={showCreateFolderDialog}
        onClose={handleCreateFolderDialogClose}
        onCreateFolder={handleCreateFolder}
        folders={flattenedFolders}
        initialParentId={createFolderParentId}
      />

      <div className="diagram-list-content">
        {isLoading ? (
          <div className="loading-indicator">Loading...</div>
        ) : error ? (
          <StatusMessage 
            message={error}
            type="error"
          />
        ) : folders.length === 0 ? (
          <div className="empty-list-message">No folders found</div>
        ) : (
          <ul className="folders-list">
            {(() => {
              // Find the root folder
              const rootFolder = folders.find(folder => folder.is_root);
              if (!rootFolder) return null;
              
              // Get diagrams for the root folder
              const rootDiagrams = folderDiagrams[rootFolder.id] || [];
              
              return (
                <>
                  {/* Render subfolders of the root folder */}
                  {rootFolder.children && renderFolders(rootFolder.children)}
                  
                  {/* Render diagrams in the root folder */}
                  {rootDiagrams.length > 0 ? (
                    rootDiagrams.map(diagram => (
                      <li 
                        key={`diagram-${diagram.id}`} 
                        className={`diagram-item ${currentDiagramId === diagram.id ? 'selected' : ''}`}
                        onClick={() => onSelectDiagram(diagram.id)}
                      >
                        <div className="diagram-item-content">
                          <div className="diagram-item-details">
                            <div className="diagram-item-name">
                              {diagram.name || `Untitled Diagram ${diagram.id}`}
                            </div>
                            <div className="diagram-item-date">
                              {new Date(diagram.last_updated).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="empty-folder-message">No diagrams in root folder</li>
                  )}
                </>
              );
            })()}
          </ul>
        )}
      </div>
    </BasePanel>
  );
};

export default DiagramList;
