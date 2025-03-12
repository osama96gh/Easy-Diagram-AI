import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, parentId: number | null) => void;
  folders?: Array<{id: number, name: string, depth: number}>;
  initialParentId?: number | null;
}

/**
 * CreateFolderDialog component for creating a new folder
 */
const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onClose,
  onCreateFolder,
  folders = [],
  initialParentId = null
}) => {
  const [folderName, setFolderName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [parentId, setParentId] = useState<number | null>(initialParentId);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
    if (e.target.value.trim()) {
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }
    
    onCreateFolder(folderName.trim(), parentId);
    handleClose();
  };

  // Handle dialog close
  const handleClose = () => {
    setFolderName('');
    setError(null);
    setParentId(initialParentId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="create-folder-dialog-title">
      <form onSubmit={handleSubmit}>
        <DialogTitle id="create-folder-dialog-title">Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="folder-name"
            label="Folder Name"
            type="text"
            fullWidth
            value={folderName}
            onChange={handleInputChange}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button type="submit" color="primary">
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateFolderDialog;
