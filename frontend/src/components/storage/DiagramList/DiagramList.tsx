import React, { useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircularProgress from '@mui/material/CircularProgress';
import { BasePanel, StatusMessage } from '../../common';
import FolderItem from './FolderItem';
import DiagramItem from './DiagramItem';
import CreateFolderDialog from './CreateFolderDialog';
import CreateDiagramDialog from './CreateDiagramDialog';
import MoveDiagramDialog from './MoveDiagramDialog';
import { useDialogState } from '../../../hooks/useDialogState';
import { useDiagramContext } from '../../../contexts/DiagramContext';
import './DiagramList.css';

interface DiagramListProps {
  onSelectDiagram: (diagramId: number) => void;
  onCreateDiagram?: (folderId?: number, title?: string) => void;
  onDeleteDiagram?: (diagramId: number) => void;
  currentDiagramId: number | null;
  panelId: string;
}

/**
 * DiagramList component for displaying and managing diagrams and folders
 */
const DiagramList: React.FC<DiagramListProps> = ({
  onSelectDiagram,
  onCreateDiagram,
  onDeleteDiagram,
  currentDiagramId,
  panelId
}) => {
  // Use the diagram context instead of useDiagramStorage
  const {
    state,
    getDiagramsForFolder,
    isFolderExpanded,
    toggleFolderExpansion,
    createFolder,
    deleteFolder,
    moveDiagram,
    getRootFolder,
    isFolderRefreshing,
    refreshExpandedFolders,
    selectDiagram
  } = useDiagramContext();
  
  const { isLoading, error, flattenedFolders, folders, folderHierarchy } = state;

  const {
    showMoveDiagramDialog,
    showCreateFolderDialog,
    showCreateDiagramDialog,
    createFolderParentId,
    createDiagramFolderId,
    openCreateFolderDialog,
    openCreateDiagramDialog,
    handleCreateFolderDialogClose,
    handleCreateDiagramDialogClose,
    handleMoveDiagramDialogClose,
    setShowMoveDiagramDialog
  } = useDialogState();

  // Handle diagram selection
  const handleSelectDiagram = (diagramId: number) => {
    // Update both the context state and call the parent component's handler
    selectDiagram(diagramId);
    onSelectDiagram(diagramId);
  };

  // Handle create folder
  const handleCreateFolder = async (name: string, parentId: number | null) => {
    // Always call createFolder regardless of parentId value
    // The createFolder function in DiagramContext handles null parentId correctly
    await createFolder(name, parentId);
    handleCreateFolderDialogClose();
  };

  // Handle move diagram
  const handleMoveDiagram = async (diagramId: number, targetFolderId: number) => {
    await moveDiagram(diagramId, targetFolderId);
    handleMoveDiagramDialogClose();
  };

  // Handle create diagram from dialog
  const handleCreateDiagramFromDialog = (name: string, folderId: number) => {
    if (onCreateDiagram) {
      onCreateDiagram(folderId, name);
    }
  };

  // Refresh all expanded folders
  const handleRefreshFolders = useCallback(() => {
    refreshExpandedFolders();
  }, [refreshExpandedFolders]);

  // Render folders recursively
  const renderFolders = (folderIds: number[], depth: number = 0) => {
    return folderIds.map(folderId => {
      const folder = folders[folderId];
      if (!folder) return null;

      const diagrams = getDiagramsForFolder(folderId);
      const childFolderIds = folderHierarchy.childrenByParentId[folderId] || [];
      const expanded = isFolderExpanded(folderId);
      const refreshing = isFolderRefreshing(folderId);

      return (
        <FolderItem
          key={`folder-${folderId}`}
          folder={{
            ...folder,
            subfolders: childFolderIds.map(id => folders[id]),
            diagrams: diagrams
          }}
          currentDiagramId={currentDiagramId}
          onSelectDiagram={handleSelectDiagram}
          onDeleteFolder={deleteFolder}
          onDeleteDiagram={onDeleteDiagram}
          onMoveDiagram={setShowMoveDiagramDialog}
          onToggleExpand={toggleFolderExpansion}
          isExpanded={expanded}
          isRefreshing={refreshing}
          diagrams={diagrams}
          renderSubfolders={() => renderFolders(childFolderIds, depth + 1)}
        />
      );
    });
  };

  // Render root folder diagrams
  const renderRootDiagrams = () => {
    const rootFolder = getRootFolder();
    if (!rootFolder) return null;

    const rootDiagrams = getDiagramsForFolder(rootFolder.id);
    
    if (rootDiagrams.length === 0) {
      return <li className="empty-folder-message">No diagrams in root folder</li>;
    }

    return rootDiagrams.map(diagram => (
      <DiagramItem
        key={`diagram-${diagram.id}`}
        diagram={diagram}
        isSelected={currentDiagramId === diagram.id}
        onSelect={handleSelectDiagram}
        onDelete={onDeleteDiagram}
        onMove={setShowMoveDiagramDialog}
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
                // Find the root folder ID and open the create diagram dialog
                const rootFolder = getRootFolder();
                if (rootFolder) {
                  openCreateDiagramDialog(rootFolder.id);
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
              const rootFolder = getRootFolder();
              if (rootFolder) {
                openCreateFolderDialog(rootFolder.id);
              }
            }}
            aria-label="Create new folder"
            title="Create new folder"
          >
            <CreateNewFolderIcon />
          </button>
          <button
            className="refresh-button"
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshFolders();
            }}
            aria-label="Refresh folders"
            title="Refresh folders"
          >
            <RefreshIcon />
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

      {/* Create Diagram Dialog */}
      <CreateDiagramDialog
        open={showCreateDiagramDialog}
        onClose={handleCreateDiagramDialogClose}
        onCreateDiagram={handleCreateDiagramFromDialog}
        folders={flattenedFolders}
        initialFolderId={createDiagramFolderId}
      />

      <div className="diagram-list-content">
        {isLoading ? (
          <div className="loading-indicator">
            <CircularProgress size={24} />
            <span>Loading folders and diagrams...</span>
          </div>
        ) : error ? (
          <StatusMessage 
            message={error}
            type="error"
          />
        ) : Object.keys(folders).length === 0 ? (
          <div className="empty-list-message">No folders found</div>
        ) : (
          <ul className="folders-list">
            {(() => {
              // Get the root folder
              const rootFolder = getRootFolder();
              if (!rootFolder) return null;
              
              // Get child folder IDs of the root folder
              const childFolderIds = folderHierarchy.childrenByParentId[rootFolder.id] || [];
              
              return (
                <>
                  {/* Render subfolders of the root folder */}
                  {renderFolders(childFolderIds)}
                  
                  {/* Render diagrams in the root folder */}
                  {renderRootDiagrams()}
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
