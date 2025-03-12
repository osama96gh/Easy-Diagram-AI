import React, { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FolderIcon from '@mui/icons-material/Folder';
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
  onDeleteFolder: (folderId: number) => void;
  renderSubfolders?: (folders: ExtendedFolderItem[]) => React.ReactNode;
  diagrams?: DiagramItemType[];
  onToggleExpand: (folderId: number) => void;
  isExpanded: boolean;
  isRefreshing?: boolean;
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
  onDeleteFolder,
  renderSubfolders,
  diagrams,
  onToggleExpand,
  isExpanded,
  isRefreshing
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  // Toggle folder expansion
  const toggleExpand = () => {
    onToggleExpand(folder.id);
  };

  // Handle deleting this folder
  const handleDeleteFolder = () => {
    onDeleteFolder(folder.id);
    setIsConfirmingDelete(false);
  };

  return (
    <li className="folder-item">
      <div className={`folder-header ${isRefreshing ? 'refreshing' : ''}`} onClick={toggleExpand}>
        <div className="folder-header-content">
          <FolderIcon fontSize="small" />
          <div className="folder-name">{folder.name}</div>
          {isRefreshing && (
            <CircularProgress size={16} thickness={5} style={{ marginLeft: '8px' }} />
          )}
        </div>
        <div className="folder-actions" onClick={(e) => e.stopPropagation()}>
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
