import React, { useState, useEffect } from 'react';
import { apiService, FolderItem, DiagramItem } from '../services/api';
import { usePanelContext } from '../contexts/PanelContext';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DescriptionIcon from '@mui/icons-material/Description';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import './DiagramList.css';

interface DiagramListProps {
  onSelectDiagram: (diagramId: number) => void;
  onCreateDiagram?: (folderId?: number, title?: string) => void;
  onDeleteDiagram?: (diagramId: number) => void;
  currentDiagramId: number | null;
  panelId: string;
  refreshTrigger?: number; // A value that changes to trigger a refresh
}

interface FolderItemWithState extends FolderItem {
  isExpanded: boolean;
  children: FolderItemWithState[];
}

const DiagramList: React.FC<DiagramListProps> = ({ 
  onSelectDiagram, 
  onCreateDiagram,
  onDeleteDiagram,
  currentDiagramId, 
  panelId,
  refreshTrigger = 0 
}) => {
  const [folders, setFolders] = useState<FolderItemWithState[]>([]);
  const [folderDiagrams, setFolderDiagrams] = useState<{[folderId: number]: DiagramItem[]}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getPanelStyle, isPanelExpanded, togglePanelExpansion } = usePanelContext();
  
  // State for confirmation dialogs
  const [showDeleteDiagramConfirm, setShowDeleteDiagramConfirm] = useState<number | null>(null);
  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState<number | null>(null);
  const [showMoveDiagramDialog, setShowMoveDiagramDialog] = useState<number | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<number | null>(null);
  const [flattenedFolders, setFlattenedFolders] = useState<Array<{id: number, name: string, depth: number}>>([]);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState<boolean>(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState<string>('');
  
  // State for create diagram dialog
  const [showCreateDiagramDialog, setShowCreateDiagramDialog] = useState<boolean>(false);
  const [createDiagramFolderId, setCreateDiagramFolderId] = useState<number | null>(null);
  const [newDiagramTitle, setNewDiagramTitle] = useState<string>('');
  
  // Function to add isExpanded property to folders recursively
  const addExpandedProperty = (folders: FolderItem[]): FolderItemWithState[] => {
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
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
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
    setNewFolderName('');
  };

  // Handle create folder dialog close
  const handleCreateFolderDialogClose = () => {
    setShowCreateFolderDialog(false);
    setCreateFolderParentId(null);
    setNewFolderName('');
  };

  // Create a new folder
  const handleCreateFolder = async () => {
    try {
      if (!newFolderName.trim() || createFolderParentId === null) return;
      
      await apiService.createFolder(newFolderName.trim(), createFolderParentId);
      
      // Refresh folders
      await fetchFolders();
      
      // Close the dialog
      setShowCreateFolderDialog(false);
      setCreateFolderParentId(null);
      setNewFolderName('');
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
      setShowDeleteFolderConfirm(null);
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
    setMoveTargetFolderId(null);
  };

  // Move a diagram to a folder
  const handleMoveDiagram = async () => {
    try {
      if (moveTargetFolderId === null || showMoveDiagramDialog === null) return;
      
      await apiService.moveDiagram(showMoveDiagramDialog, moveTargetFolderId);
      
      // Refresh diagrams for all folders we have loaded
      const folderIds = Object.keys(folderDiagrams).map(id => parseInt(id, 10));
      for (const folderId of folderIds) {
        await fetchDiagramsForFolder(folderId);
      }
      
      setShowMoveDiagramDialog(null);
      setMoveTargetFolderId(null);
    } catch (err) {
      console.error('Error moving diagram:', err);
      setError('Failed to move diagram');
    }
  };
  
  // Open create diagram dialog
  const openCreateDiagramDialog = (folderId: number | null = null) => {
    setShowCreateDiagramDialog(true);
    setCreateDiagramFolderId(folderId);
    setNewDiagramTitle('');
  };

  // Handle create diagram dialog close
  const handleCreateDiagramDialogClose = () => {
    setShowCreateDiagramDialog(false);
    setCreateDiagramFolderId(null);
    setNewDiagramTitle('');
  };

  // Create a new diagram
  const handleCreateDiagram = () => {
    if (onCreateDiagram && createDiagramFolderId !== null) {
      onCreateDiagram(createDiagramFolderId, newDiagramTitle);
      handleCreateDiagramDialogClose();
    }
  };
  
  // Render a diagram item
  const renderDiagram = (diagram: DiagramItem) => {
    return (
      <li 
        key={`diagram-${diagram.id}`} 
        className={`diagram-item ${currentDiagramId === diagram.id ? 'selected' : ''}`}
        onClick={() => onSelectDiagram(diagram.id)}
      >
        <div className="diagram-item-content">
          <DescriptionIcon fontSize="small" className="diagram-icon" />
          <div className="diagram-item-details">
            <div className="diagram-item-name">
              {diagram.name || `Untitled Diagram ${diagram.id}`}
            </div>
            <div className="diagram-item-date">
              {formatDate(diagram.last_updated)}
            </div>
          </div>
        </div>
        
        {showDeleteDiagramConfirm === diagram.id ? (
          <div className="delete-confirm">
            <button 
              className="confirm-yes" 
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteDiagram) {
                  onDeleteDiagram(diagram.id);
                }
                setShowDeleteDiagramConfirm(null);
              }}
              title="Confirm delete"
            >
              Yes
            </button>
            <button 
              className="confirm-no" 
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDiagramConfirm(null);
              }}
              title="Cancel delete"
            >
              No
            </button>
          </div>
        ) : (
          <div className="diagram-item-actions">
            <button
              className="move-diagram-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveDiagramDialog(diagram.id);
              }}
              aria-label="Move diagram"
              title="Move diagram"
            >
              <DriveFileMoveIcon fontSize="small" />
            </button>
            {onDeleteDiagram && (
              <button
                className="delete-diagram-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDiagramConfirm(diagram.id);
                }}
                aria-label="Delete diagram"
                title="Delete diagram"
              >
                <DeleteIcon fontSize="small" />
              </button>
            )}
          </div>
        )}
      </li>
    );
  };
  
  // Render a folder and its contents recursively
  const renderFolder = (folder: FolderItemWithState) => {
    const diagrams = folderDiagrams[folder.id] || [];
    
    return (
      <li key={`folder-${folder.id}`} className="folder-item">
        <div 
          className="folder-header" 
          onClick={() => toggleFolderExpansion(folder.id)}
        >
          <div className="folder-header-content">
            {folder.isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
            <span className="folder-name">{folder.name}</span>
            {folder.isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>
          
          <div className="folder-actions">
            <button
              className="create-diagram-button"
              onClick={(e) => {
                e.stopPropagation();
                openCreateDiagramDialog(folder.id);
              }}
              aria-label="Create new diagram in this folder"
              title="Create new diagram in this folder"
            >
              <AddIcon fontSize="small" />
            </button>
            <button
              className="create-subfolder-button"
              onClick={(e) => {
                e.stopPropagation();
                openCreateFolderDialog(folder.id);
              }}
              aria-label="Create subfolder"
              title="Create subfolder"
            >
              <CreateNewFolderIcon fontSize="small" />
            </button>
            {!folder.is_root && (
              <button
                className="delete-folder-button"
                onClick={async (e) => {
                  e.stopPropagation();
                  
                  // Make sure we have the diagrams data for this folder
                  if (!folderDiagrams[folder.id]) {
                    try {
                      await fetchDiagramsForFolder(folder.id);
                    } catch (err) {
                      console.error(`Error fetching diagrams for folder ${folder.id}:`, err);
                      setError(`Failed to check folder contents. Please try again.`);
                      return;
                    }
                  }
                  
                  // Check if the folder has diagrams
                  const diagrams = folderDiagrams[folder.id] || [];
                  if (diagrams.length > 0) {
                    // If folder has diagrams, show a panel message
                    setShowDeleteFolderConfirm(folder.id);
                  } else {
                    // If folder is empty, delete it directly without confirmation
                    handleDeleteFolder(folder.id);
                  }
                }}
                aria-label="Delete folder"
                title="Delete folder"
              >
                <DeleteIcon fontSize="small" />
              </button>
            )}
          </div>
        </div>
        
        {showDeleteFolderConfirm === folder.id && (
          <div className="delete-folder-confirm">
            <p>This folder cannot be deleted because it is not empty.</p>
            <p>Please move or delete all diagrams in this folder first.</p>
            <div className="delete-folder-buttons">
              <button 
                className="confirm-ok" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteFolderConfirm(null);
                }}
                title="OK"
              >
                OK
              </button>
            </div>
          </div>
        )}
        
        {folder.isExpanded && (
          <ul className="folder-contents">
            {/* Render subfolders */}
            {folder.children && folder.children.length > 0 && (
              folder.children.map(childFolder => renderFolder(childFolder))
            )}
            
            {/* Render diagrams in this folder */}
            {diagrams.length > 0 ? (
              diagrams.map(diagram => renderDiagram(diagram))
            ) : folder.isExpanded && (
              <li className="empty-folder-message">No diagrams in this folder</li>
            )}
          </ul>
        )}
      </li>
    );
  };
  
  const isExpanded = isPanelExpanded(panelId);
  
  return (
    <div className={`diagram-list-panel ${isExpanded ? '' : 'collapsed'}`} style={getPanelStyle(panelId)}>
      {/* Move Diagram Dialog */}
      <Dialog
        open={showMoveDiagramDialog !== null}
        onClose={handleMoveDiagramDialogClose}
        aria-labelledby="move-dialog-title"
        aria-describedby="move-dialog-description"
      >
        <DialogTitle id="move-dialog-title">Move Diagram</DialogTitle>
        <DialogContent>
          <DialogContentText id="move-dialog-description">
            Select a destination folder for this diagram.
          </DialogContentText>
          <FormControl fullWidth margin="dense">
            <InputLabel id="folder-select-label">Destination Folder</InputLabel>
            <Select
              labelId="folder-select-label"
              value={moveTargetFolderId || ''}
              onChange={(e) => setMoveTargetFolderId(e.target.value as number)}
              label="Destination Folder"
            >
              <MenuItem value="">
                <em>Select a folder</em>
              </MenuItem>
              {flattenedFolders.map(folder => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.depth > 0 ? '\u00A0\u00A0'.repeat(folder.depth) + '└─ ' : ''}{folder.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMoveDiagramDialogClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleMoveDiagram} 
            color="primary" 
            disabled={moveTargetFolderId === null}
          >
            Move
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog
        open={showCreateFolderDialog}
        onClose={handleCreateFolderDialogClose}
        aria-labelledby="create-folder-dialog-title"
      >
        <DialogTitle id="create-folder-dialog-title">Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="folder-name"
            label="Folder Name"
            type="text"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            variant="outlined"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="parent-folder-select-label">Parent Folder</InputLabel>
            <Select
              labelId="parent-folder-select-label"
              value={createFolderParentId || ''}
              onChange={(e) => setCreateFolderParentId(e.target.value as number)}
              label="Parent Folder"
            >
              {flattenedFolders.map(folder => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.depth > 0 ? '\u00A0\u00A0'.repeat(folder.depth) + '└─ ' : ''}{folder.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateFolderDialogClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFolder} 
            color="primary"
            disabled={!newFolderName.trim() || createFolderParentId === null}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Diagram Dialog */}
      <Dialog
        open={showCreateDiagramDialog}
        onClose={handleCreateDiagramDialogClose}
        aria-labelledby="create-diagram-dialog-title"
      >
        <DialogTitle id="create-diagram-dialog-title">Create New Diagram</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="diagram-title"
            label="Diagram Title"
            type="text"
            fullWidth
            value={newDiagramTitle}
            onChange={(e) => setNewDiagramTitle(e.target.value)}
            variant="outlined"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="folder-select-label">Folder Location</InputLabel>
            <Select
              labelId="folder-select-label"
              value={createDiagramFolderId || ''}
              onChange={(e) => setCreateDiagramFolderId(e.target.value as number)}
              label="Folder Location"
            >
              {flattenedFolders.map(folder => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.depth > 0 ? '\u00A0\u00A0'.repeat(folder.depth) + '└─ ' : ''}{folder.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDiagramDialogClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateDiagram} 
            color="primary"
            disabled={createDiagramFolderId === null}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <div className="diagram-list-panel-header">
        <h2>Diagrams</h2>
        <div className="diagram-list-panel-controls">
    {isExpanded && (
      <>
        {onCreateDiagram && (
          <button
            className="new-diagram-button"
            onClick={(e) => {
              e.stopPropagation();
              // Find the root folder ID and open the create diagram dialog
              const rootFolder = folders.find(folder => folder.is_root);
              if (rootFolder) {
                openCreateDiagramDialog(rootFolder.id); // Pre-select the root folder
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
              openCreateFolderDialog(rootFolder.id); // Pre-select the root folder
            }
          }}
          aria-label="Create new folder"
          title="Create new folder"
        >
          <CreateNewFolderIcon />
        </button>
      </>
    )}
          <button 
            className="toggle-arrow" 
            onClick={() => togglePanelExpansion(panelId)}
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            {isExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="diagram-list-content">
          {isLoading ? (
            <div className="loading-indicator">Loading...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
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
                    {rootFolder.children && rootFolder.children.map(childFolder => 
                      renderFolder(childFolder)
                    )}
                    
                    {/* Render diagrams in the root folder */}
                    {rootDiagrams.length > 0 ? (
                      rootDiagrams.map(diagram => renderDiagram(diagram))
                    ) : (
                      <li className="empty-folder-message">No diagrams in root folder</li>
                    )}
                  </>
                );
              })()}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagramList;
