import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { DiagramItem as DiagramItemType } from '../../../services/api';

interface DiagramItemProps {
  diagram: DiagramItemType;
  isSelected: boolean;
  onSelect: (diagramId: number) => void;
  onDelete?: (diagramId: number) => void;
  onMove?: (diagramId: number) => void;
}

/**
 * DiagramItem component for rendering a single diagram in the list
 */
export const DiagramItem: React.FC<DiagramItemProps> = ({
  diagram,
  isSelected,
  onSelect,
  onDelete,
  onMove
}) => {
  return (
    <li 
      className={`diagram-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(diagram.id)}
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
        
        <div className="diagram-item-actions">
          {onMove && (
            <button
              className="move-diagram-button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(diagram.id);
              }}
              aria-label="Move diagram"
              title="Move diagram to another folder"
            >
              <DriveFileMoveIcon fontSize="small" />
            </button>
          )}
          {onDelete && (
            <button
              className="delete-diagram-button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this diagram?')) {
                  onDelete(diagram.id);
                }
              }}
              aria-label="Delete diagram"
              title="Delete diagram"
            >
              <DeleteIcon fontSize="small" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
};

export default DiagramItem;
