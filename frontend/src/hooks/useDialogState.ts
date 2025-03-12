import { useState, useCallback } from 'react';

export interface UseDialogStateReturn {
  showMoveDiagramDialog: number | null;
  showCreateFolderDialog: boolean;
  showCreateDiagramDialog: boolean;
  createFolderParentId: number | null;
  createDiagramFolderId: number | null;
  setShowMoveDiagramDialog: (diagramId: number | null) => void;
  setShowCreateFolderDialog: (show: boolean) => void;
  setShowCreateDiagramDialog: (show: boolean) => void;
  setCreateFolderParentId: (folderId: number | null) => void;
  setCreateDiagramFolderId: (folderId: number | null) => void;
  handleCreateFolderDialogClose: () => void;
  handleCreateDiagramDialogClose: () => void;
  handleMoveDiagramDialogClose: () => void;
  openCreateFolderDialog: (parentId: number | null) => void;
  openCreateDiagramDialog: (folderId: number | null) => void;
}

/**
 * Custom hook for managing dialog states in the DiagramList component
 */
export const useDialogState = (): UseDialogStateReturn => {
  const [showMoveDiagramDialog, setShowMoveDiagramDialog] = useState<number | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState<boolean>(false);
  const [showCreateDiagramDialog, setShowCreateDiagramDialog] = useState<boolean>(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [createDiagramFolderId, setCreateDiagramFolderId] = useState<number | null>(null);

  /**
   * Open create folder dialog
   */
  const openCreateFolderDialog = useCallback((parentId: number | null = null) => {
    setShowCreateFolderDialog(true);
    setCreateFolderParentId(parentId);
  }, []);

  /**
   * Open create diagram dialog
   */
  const openCreateDiagramDialog = useCallback((folderId: number | null = null) => {
    setShowCreateDiagramDialog(true);
    setCreateDiagramFolderId(folderId);
  }, []);

  /**
   * Handle create folder dialog close
   */
  const handleCreateFolderDialogClose = useCallback(() => {
    setShowCreateFolderDialog(false);
    setCreateFolderParentId(null);
  }, []);

  /**
   * Handle create diagram dialog close
   */
  const handleCreateDiagramDialogClose = useCallback(() => {
    setShowCreateDiagramDialog(false);
    setCreateDiagramFolderId(null);
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
    showCreateDiagramDialog,
    createFolderParentId,
    createDiagramFolderId,
    setShowMoveDiagramDialog,
    setShowCreateFolderDialog,
    setShowCreateDiagramDialog,
    setCreateFolderParentId,
    setCreateDiagramFolderId,
    handleCreateFolderDialogClose,
    handleCreateDiagramDialogClose,
    handleMoveDiagramDialogClose,
    openCreateFolderDialog,
    openCreateDiagramDialog,
  };
};

export default useDialogState;
