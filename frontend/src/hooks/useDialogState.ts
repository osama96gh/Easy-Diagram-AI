import { useState, useCallback } from 'react';

export interface UseDialogStateReturn {
  showMoveDiagramDialog: number | null;
  showCreateFolderDialog: boolean;
  createFolderParentId: number | null;
  setShowMoveDiagramDialog: (diagramId: number | null) => void;
  setShowCreateFolderDialog: (show: boolean) => void;
  setCreateFolderParentId: (folderId: number | null) => void;
  handleCreateFolderDialogClose: () => void;
  handleMoveDiagramDialogClose: () => void;
  openCreateFolderDialog: (parentId: number | null) => void;
}

/**
 * Custom hook for managing dialog states in the DiagramList component
 */
export const useDialogState = (): UseDialogStateReturn => {
  const [showMoveDiagramDialog, setShowMoveDiagramDialog] = useState<number | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState<boolean>(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);

  /**
   * Open create folder dialog
   */
  const openCreateFolderDialog = useCallback((parentId: number | null = null) => {
    setShowCreateFolderDialog(true);
    setCreateFolderParentId(parentId);
  }, []);

  /**
   * Handle create folder dialog close
   */
  const handleCreateFolderDialogClose = useCallback(() => {
    setShowCreateFolderDialog(false);
    setCreateFolderParentId(null);
  }, []);

  /**
   * Handle move diagram dialog close
   */
  const handleMoveDiagramDialogClose = useCallback(() => {
    setShowMoveDiagramDialog(null);
  }, []);

  return {
    showMoveDiagramDialog,
    showCreateFolderDialog,
    createFolderParentId,
    setShowMoveDiagramDialog,
    setShowCreateFolderDialog,
    setCreateFolderParentId,
    handleCreateFolderDialogClose,
    handleMoveDiagramDialogClose,
    openCreateFolderDialog,
  };
};

export default useDialogState;
