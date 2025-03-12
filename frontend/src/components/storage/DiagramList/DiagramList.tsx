import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { BasePanel, StatusMessage } from '../../common';
import FolderItem from './FolderItem';
import DiagramItem from './DiagramItem';
import CreateFolderDialog from './CreateFolderDialog';
import MoveDiagramDialog from './MoveDiagramDialog';
import { useDiagramStorage } from '../../../hooks/useDiagramStorage';
import { useDialogState } from '../../../hooks/useDialogState';
import './DiagramList.css';

interface DiagramListProps {
  onSelectDiagram: (diagramId: number) => void;
  onCreateDiagram?: (folderId?: number, title?: string) => void;
  onDeleteDiagram?: (diagramId: number) => void;
  currentDiagramId: number | null;
  panelId: string;
  refreshTrigger?: number; // A value that changes to trigger a refresh
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
  // Use custom hooks for data and dialog management
  const {
    isLoading,
    error,
    flattenedFolders,
    normalizedState,
    getDiagramsForFolder,
    isFolderExpanded,
    toggleFolderExpansion,
    createFolder,
    deleteFolder,
    moveDiagram,
    getRootFolder
  } = useDiagramStorage(refreshTrigger);

  const {
    showMoveDiagramDialog,
    showCreateFolderDialog,
    createFolderParentId,
    openCreateFolderDialog,
    handleCreateFolderDialogClose,
    handleMoveDiagramDialogClose,
    setShowMoveDiagramDialog
  } = useDialogState();

  // Handle create folder
  const handleCreateFolder = async (name: string, parentId: number | null) => {
    await createFolder(name, parentId);
    handleCreateFolderDialogClose();
  };

  // Handle move diagram
  const handleMoveDiagram = async (diagramId: number, targetFolderId: number) => {
    await moveDiagram(diagramId, targetFolderId);
    handleMoveDiagramDialogClose();
  };

  // Handle create diagram
  const handleCreateDiagram = (folderId: number, title?: string) => {
    if (onCreateDiagram) {
      onCreateDiagram(folderId, title);
    }
  };

  // Render folders recursively
  const renderFolders = (folderIds: number[], depth: number = 0) => {
    return folderIds.map(folderId => {
      const folder = normalizedState.folders[folderId];
      if (!folder) return null;

      const diagrams = getDiagramsForFolder(folderId);
      const childFolderIds = normalizedState.folderHierarchy.childrenByParentId[folderId] || [];

      return (
        <FolderItem
          key={`folder-${folderId}`}
          folder={{
            ...folder,
            subfolders: childFolderIds.map(id => normalizedState.folders[id]),
            diagrams: diagrams
          }}
          currentDiagramId={currentDiagramId}
          onSelectDiagram={onSelectDiagram}
          onCreateDiagram={onCreateDiagram ? handleCreateDiagram : undefined}
          onCreateSubfolder={openCreateFolderDialog}
          onDeleteFolder={deleteFolder}
          onDeleteDiagram={onDeleteDiagram}
          onMoveDiagram={setShowMoveDiagramDialog}
          onToggleExpand={toggleFolderExpansion}
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
        onSelect={onSelectDiagram}
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
                // Find the root folder ID and create a diagram in it
                const rootFolder = getRootFolder();
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
        ) : Object.keys(normalizedState.folders).length === 0 ? (
          <div className="empty-list-message">No folders found</div>
        ) : (
          <ul className="folders-list">
            {(() => {
              // Get the root folder
              const rootFolder = getRootFolder();
              if (!rootFolder) return null;
              
              // Get child folder IDs of the root folder
              const childFolderIds = normalizedState.folderHierarchy.childrenByParentId[rootFolder.id] || [];
              
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
