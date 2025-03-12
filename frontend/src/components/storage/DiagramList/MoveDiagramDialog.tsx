import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemButton from '@mui/material/ListItemButton';
import FolderIcon from '@mui/icons-material/Folder';

// Define folder structure for the dialog
interface FolderItem {
  id: number;
  name: string;
  depth: number;
}

interface MoveDiagramDialogProps {
  open: boolean;
  diagramId: number | null;
  folders: FolderItem[];
  onClose: () => void;
  onMove: (diagramId: number, folderId: number) => void;
}

/**
 * MoveDiagramDialog component for moving a diagram to a different folder
 */
const MoveDiagramDialog: React.FC<MoveDiagramDialogProps> = ({
  open,
  diagramId,
  folders,
  onClose,
  onMove
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  // Reset selected folder when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFolderId(null);
    }
  }, [open]);

  // Handle folder selection
  const handleSelectFolder = (folderId: number | null) => {
    setSelectedFolderId(folderId);
  };

  // Handle move confirmation
  const handleMove = () => {
    if (diagramId !== null && selectedFolderId !== null) {
      onMove(diagramId, selectedFolderId);
      onClose();
    }
  };

  // Function to render folders from flattened structure
  const renderFolders = () => {
    return folders
      .filter(folder => folder.depth > 0) // Filter out root folder as it's handled separately
      .map(folder => (
        <ListItem 
          key={folder.id} 
          disablePadding 
          style={{ paddingLeft: `${folder.depth * 16}px` }}
        >
          <ListItemButton 
            onClick={() => handleSelectFolder(folder.id)}
            selected={selectedFolderId === folder.id}
          >
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText 
              primary={
                <span>
                  {folder.depth > 1 ? '└─ ' : ''}{folder.name}
                </span>
              } 
            />
          </ListItemButton>
        </ListItem>
      ));
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="move-diagram-dialog-title">
      <DialogTitle id="move-diagram-dialog-title">Move Diagram to Folder</DialogTitle>
      <DialogContent>
        <List>
          {folders.length > 0 ? (
            <>
              {/* Root folder */}
              {folders.find(f => f.depth === 0) && (
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectFolder(folders.find(f => f.depth === 0)?.id || null)}
                    selected={selectedFolderId === folders.find(f => f.depth === 0)?.id}
                  >
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText primary={folders.find(f => f.depth === 0)?.name || "Root Folder"} />
                  </ListItemButton>
                </ListItem>
              )}
              {/* Other folders */}
              {renderFolders()}
            </>
          ) : (
            <ListItem>
              <ListItemText primary="No folders available" />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleMove} color="primary" disabled={diagramId === null}>
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveDiagramDialog;
