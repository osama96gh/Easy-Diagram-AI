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

interface CreateDiagramDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateDiagram: (name: string, folderId: number) => void;
  folders?: Array<{id: number, name: string, depth: number}>;
  initialFolderId?: number | null;
}

/**
 * CreateDiagramDialog component for creating a new diagram
 */
const CreateDiagramDialog: React.FC<CreateDiagramDialogProps> = ({
  open,
  onClose,
  onCreateDiagram,
  folders = [],
  initialFolderId = null
}) => {
  const [diagramName, setDiagramName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<number | null>(initialFolderId);

  // Reset state when dialog opens with new initialFolderId
  useEffect(() => {
    if (open) {
      setFolderId(initialFolderId);
    }
  }, [open, initialFolderId]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiagramName(e.target.value);
    if (e.target.value.trim()) {
      setError(null);
    }
  };

  // Handle folder selection
  const handleFolderChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setFolderId(value === 'null' ? null : Number(value));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!diagramName.trim()) {
      setError('Diagram name cannot be empty');
      return;
    }
    
    // Find the root folder ID if folderId is null
    if (folderId === null) {
      const rootFolder = folders.find(folder => folder.depth === 0);
      if (rootFolder) {
        onCreateDiagram(diagramName.trim(), rootFolder.id);
      } else {
        setError('No valid folder selected');
        return;
      }
    } else {
      onCreateDiagram(diagramName.trim(), folderId);
    }
    
    handleClose();
  };

  // Handle dialog close
  const handleClose = () => {
    setDiagramName('');
    setError(null);
    setFolderId(initialFolderId);
    onClose();
  };

  // Get folder name with indentation to show hierarchy
  const getFolderDisplayName = (folder: {id: number, name: string, depth: number}) => {
    // Use proper indentation with spaces for better visual hierarchy
    return `${'\u00A0\u00A0'.repeat(folder.depth)}${folder.depth > 0 ? '└─ ' : ''}${folder.name}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="create-diagram-dialog-title">
      <form onSubmit={handleSubmit}>
        <DialogTitle id="create-diagram-dialog-title">Create New Diagram</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="diagram-name"
            label="Diagram Name"
            type="text"
            fullWidth
            value={diagramName}
            onChange={handleInputChange}
            error={!!error}
            helperText={error}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="folder-location-label">Location</InputLabel>
            <Select
              labelId="folder-location-label"
              id="folder-location"
              value={folderId === null ? 'null' : String(folderId)}
              onChange={handleFolderChange}
              label="Location"
            >
              {folders.map((folder) => (
                <MenuItem key={folder.id} value={String(folder.id)}>
                  {getFolderDisplayName(folder)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select where to create the new diagram</FormHelperText>
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

export default CreateDiagramDialog;
