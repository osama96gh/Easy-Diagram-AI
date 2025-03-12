import React, { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DeleteIcon from '@mui/icons-material/Delete';
import { FolderItem as FolderItemType, DiagramItem as DiagramItemType } from '../../../services/api';
import DiagramItem from './DiagramItem';

// Extended FolderItem type with diagrams property
interface ExtendedFolderItem extends FolderItemType {
  subfolders?: ExtendedFolderItem[];
  diagrams?: DiagramItemType[];
}

interface FolderItemProps {
  folder: ExtendedFolderItem;
  currentDiagramId: number | null;
  onSelectDiagram: (diagramId: number) => void;
  onDeleteDiagram?: (diagramId: number) => void;
  onMoveDiagram: (diagramId: number) => void;
  onCreateDiagram?: (folderId: number, title: string) => void;
  onCreateSubfolder: (parentFolderId: number | null, name: string) => void;
  onDeleteFolder: (folderId: number) => void;
  renderSubfolders?: (folders: ExtendedFolderItem[]) => React.ReactNode;
  diagrams?: DiagramItemType[];
  onToggleExpand?: (folderId: number) => void;
}

/**
 * FolderItem component for rendering a folder with its diagrams
 */
const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  currentDiagramId,
  onSelectDiagram,
  onDeleteDiagram,
  onMoveDiagram,
  onCreateDiagram,
  onCreateSubfolder,
  onDeleteFolder,
  renderSubfolders,
  diagrams,
  onToggleExpand
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isCreatingDiagram, setIsCreatingDiagram] = useState<boolean>(false);
  const [newDiagramTitle, setNewDiagramTitle] = useState<string>('');
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState<boolean>(false);
  const [newSubfolderName, setNewSubfolderName] = useState<string>('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  // Toggle folder expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onToggleExpand) {
      onToggleExpand(folder.id);
    }
  };

  // Handle creating a new diagram in this folder
  const handleCreateDiagram = () => {
    if (newDiagramTitle.trim() && onCreateDiagram) {
      onCreateDiagram(folder.id, newDiagramTitle.trim());
      setNewDiagramTitle('');
      setIsCreatingDiagram(false);
    }
  };

  // Handle creating a new subfolder
  const handleCreateSubfolder = () => {
    if (newSubfolderName.trim()) {
      onCreateSubfolder(folder.id, newSubfolderName.trim());
      setNewSubfolderName('');
      setIsCreatingSubfolder(false);
    }
  };

  // Handle deleting this folder
  const handleDeleteFolder = () => {
    onDeleteFolder(folder.id);
    setIsConfirmingDelete(false);
  };

  return (
    <li className="folder-item">
      <div className="folder-header" onClick={toggleExpand}>
        <div className="folder-header-content">
          <FolderIcon fontSize="small" />
          <div className="folder-name">{folder.name}</div>
        </div>
        <div className="folder-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="create-diagram-button"
            onClick={() => setIsCreatingDiagram(true)}
            aria-label="Create diagram in folder"
            title="Create diagram in folder"
          >
            <AddIcon fontSize="small" />
          </button>
          <button
            className="create-subfolder-button"
            onClick={() => setIsCreatingSubfolder(true)}
            aria-label="Create subfolder"
            title="Create subfolder"
          >
            <CreateNewFolderIcon fontSize="small" />
          </button>
          <button
            className="delete-folder-button"
            onClick={() => setIsConfirmingDelete(true)}
            aria-label="Delete folder"
            title="Delete folder"
          >
            <DeleteIcon fontSize="small" />
          </button>
          {isExpanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </div>
      </div>

      {/* Create new diagram form */}
      {isCreatingDiagram && (
        <div className="create-item-form">
          <input
            type="text"
            value={newDiagramTitle}
            onChange={(e) => setNewDiagramTitle(e.target.value)}
            placeholder="Diagram title"
            autoFocus
          />
          <div className="form-actions">
            <button onClick={handleCreateDiagram}>Create</button>
            <button onClick={() => setIsCreatingDiagram(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Create new subfolder form */}
      {isCreatingSubfolder && (
        <div className="create-item-form">
          <input
            type="text"
            value={newSubfolderName}
            onChange={(e) => setNewSubfolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
          <div className="form-actions">
            <button onClick={handleCreateSubfolder}>Create</button>
            <button onClick={() => setIsCreatingSubfolder(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delete folder confirmation */}
      {isConfirmingDelete && (
        <div className="delete-folder-confirm">
          <p>Are you sure you want to delete this folder and all its contents?</p>
          <div className="delete-folder-buttons">
            <button onClick={() => setIsConfirmingDelete(false)}>Cancel</button>
            <button className="confirm-ok" onClick={handleDeleteFolder}>Delete</button>
          </div>
        </div>
      )}

      {/* Folder contents */}
      {isExpanded && (
        <ul className="folder-contents">
          {/* Render subfolders */}
          {folder.children && folder.children.length > 0 && renderSubfolders ? (
            renderSubfolders(folder.children)
          ) : null}

          {/* Render diagrams */}
          {diagrams && diagrams.length > 0 ? (
            diagrams.map((diagram: DiagramItemType) => (
              <DiagramItem
                key={diagram.id}
                diagram={diagram}
                isSelected={currentDiagramId === diagram.id}
                onSelect={onSelectDiagram}
                onDelete={onDeleteDiagram}
                onMove={onMoveDiagram}
              />
            ))
          ) : (
            <li className="empty-folder-message">No diagrams in this folder</li>
          )}
        </ul>
      )}
    </li>
  );
};

export default FolderItem;
