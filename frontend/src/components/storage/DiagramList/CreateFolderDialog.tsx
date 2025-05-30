import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';

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

  // Reset state when dialog opens with new initialParentId
  useEffect(() => {
    if (open) {
      setParentId(initialParentId);
    }
  }, [open, initialParentId]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
    if (e.target.value.trim()) {
      setError(null);
    }
  };

  // Handle parent folder selection
  const handleParentChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setParentId(value === 'null' ? null : Number(value));
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

  // Get folder name with indentation to show hierarchy
  const getFolderDisplayName = (folder: {id: number, name: string, depth: number}) => {
    // Use proper indentation with spaces for better visual hierarchy
    return `${'\u00A0\u00A0'.repeat(folder.depth)}${folder.depth > 0 ? '└─ ' : ''}${folder.name}`;
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
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="parent-folder-label">Parent Folder</InputLabel>
            <Select
              labelId="parent-folder-label"
              id="parent-folder"
              value={parentId === null ? 'null' : String(parentId)}
              onChange={handleParentChange}
              label="Parent Folder"
            >
              {folders.map((folder) => (
                <MenuItem key={folder.id} value={folder.depth === 0 ? 'null' : String(folder.id)}>
                  {getFolderDisplayName(folder)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select where to create the new folder</FormHelperText>
          </FormControl>
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
