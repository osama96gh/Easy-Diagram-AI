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
interface FolderStructure {
  id: number;
  name: string;
  subfolders?: FolderStructure[];
}

interface MoveDiagramDialogProps {
  open: boolean;
  diagramId: number | null;
  folders: FolderStructure[];
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

  // Recursive function to render folders
  const renderFolders = (foldersList: FolderStructure[], level = 0) => {
    return foldersList.map(folder => (
      <React.Fragment key={folder.id}>
        <ListItem disablePadding style={{ paddingLeft: `${level * 16}px` }}>
          <ListItemButton 
            onClick={() => handleSelectFolder(folder.id)}
            selected={selectedFolderId === folder.id}
          >
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary={folder.name} />
          </ListItemButton>
        </ListItem>
        {folder.subfolders && folder.subfolders.length > 0 && renderFolders(folder.subfolders, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="move-diagram-dialog-title">
      <DialogTitle id="move-diagram-dialog-title">Move Diagram to Folder</DialogTitle>
      <DialogContent>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleSelectFolder(null)}
              selected={selectedFolderId === null}
            >
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="Root (No Folder)" />
            </ListItemButton>
          </ListItem>
          {folders.length > 0 ? (
            renderFolders(folders)
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
