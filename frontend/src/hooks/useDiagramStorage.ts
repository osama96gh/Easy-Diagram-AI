import { useState, useEffect, useCallback } from 'react';
import { apiService, FolderItem, DiagramItem } from '../services/api';

// Define normalized data structure types
export interface NormalizedFolderState {
  folders: {
    [id: number]: FolderItem;
  };
  folderHierarchy: {
    rootId: number | null;
    childrenByParentId: {
      [parentId: number]: number[]; // folder IDs
    };
  };
  diagramsByFolderId: {
    [folderId: number]: DiagramItem[];
  };
  loadedFolders: number[]; // Track which folders have had their diagrams loaded
}

export interface UseDiagramStorageReturn {
  isLoading: boolean;
  error: string | null;
  normalizedState: NormalizedFolderState;
  flattenedFolders: Array<{ id: number; name: string; depth: number }>;
  fetchFolders: () => Promise<void>;
  fetchDiagramsForFolder: (folderId: number | null) => Promise<void>;
  createFolder: (name: string, parentId: number | null) => Promise<void>;
  deleteFolder: (folderId: number) => Promise<void>;
  moveDiagram: (diagramId: number, targetFolderId: number) => Promise<void>;
  isFolderExpanded: (folderId: number) => boolean;
  toggleFolderExpansion: (folderId: number) => void;
  getDiagramsForFolder: (folderId: number) => DiagramItem[];
  getRootFolder: () => FolderItem | null;
}

// Initial state for normalized data
const initialNormalizedState: NormalizedFolderState = {
  folders: {},
  folderHierarchy: {
    rootId: null,
    childrenByParentId: {},
  },
  diagramsByFolderId: {},
  loadedFolders: [],
};

/**
 * Custom hook for managing diagram and folder data
 */
export const useDiagramStorage = (refreshTrigger = 0): UseDiagramStorageReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [normalizedState, setNormalizedState] = useState<NormalizedFolderState>(initialNormalizedState);
  const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
  const [flattenedFolders, setFlattenedFolders] = useState<Array<{ id: number; name: string; depth: number }>>([]);

  /**
   * Normalize folder data into a more efficient structure
   */
  const normalizeFolderData = useCallback((folders: FolderItem[]): NormalizedFolderState => {
    const result: NormalizedFolderState = {
      folders: {},
      folderHierarchy: {
        rootId: null,
        childrenByParentId: {},
      },
      diagramsByFolderId: {},
      loadedFolders: [],
    };

    // Helper function to process folders recursively
    const processFolders = (folderList: FolderItem[], parentId: number | null = null) => {
      folderList.forEach(folder => {
        // Store the folder in the folders map
        result.folders[folder.id] = { ...folder };

        // Set root folder if this is a root folder
        if (folder.is_root) {
          result.folderHierarchy.rootId = folder.id;
        }

        // Add to children map
        if (parentId !== null) {
          if (!result.folderHierarchy.childrenByParentId[parentId]) {
            result.folderHierarchy.childrenByParentId[parentId] = [];
          }
          result.folderHierarchy.childrenByParentId[parentId].push(folder.id);
        }

        // Process children recursively
        if (folder.children && folder.children.length > 0) {
          processFolders(folder.children, folder.id);
        }
      });
    };

    processFolders(folders);
    return result;
  }, []);

  /**
   * Flatten folder hierarchy for dropdown menus
   */
  const flattenFolderHierarchy = useCallback((state: NormalizedFolderState): Array<{ id: number; name: string; depth: number }> => {
    const result: Array<{ id: number; name: string; depth: number }> = [];
    
    // Helper function to process folders recursively
    const processFolders = (folderIds: number[], depth: number = 0) => {
      folderIds.forEach(folderId => {
        const folder = state.folders[folderId];
        if (folder) {
          // Add the current folder to the result
          result.push({
            id: folder.id,
            name: folder.name,
            depth: depth
          });
          
          // Process children if they exist
          const childFolderIds = state.folderHierarchy.childrenByParentId[folder.id] || [];
          if (childFolderIds.length > 0) {
            processFolders(childFolderIds, depth + 1);
          }
        }
      });
    };
    
    // Start with the root folder if it exists
    if (state.folderHierarchy.rootId !== null) {
      processFolders([state.folderHierarchy.rootId]);
    }
    
    return result;
  }, []);

  /**
   * Fetch diagrams for a specific folder
   */
  const fetchDiagramsForFolder = useCallback(async (folderId: number | null) => {
    // Skip if folderId is null
    if (folderId === null) return;
    
    try {
      // Only fetch if we haven't already loaded this folder's diagrams
      if (!normalizedState.loadedFolders.includes(folderId)) {
        const diagrams = await apiService.getDiagramsInFolder(folderId);
        
        setNormalizedState(prev => ({
          ...prev,
          diagramsByFolderId: {
            ...prev.diagramsByFolderId,
            [folderId]: diagrams
          },
          loadedFolders: [...prev.loadedFolders, folderId]
        }));
      }
    } catch (err) {
      console.error(`Error fetching diagrams for folder ${folderId}:`, err);
      setError(`Failed to load diagrams for folder ${folderId}`);
    }
  }, [normalizedState.loadedFolders]);

  /**
   * Fetch all folders
   */
  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    try {
      const foldersList = await apiService.getFolders();
      const normalized = normalizeFolderData(foldersList);
      
      setNormalizedState(prev => ({
        ...normalized,
        diagramsByFolderId: prev.diagramsByFolderId,
        loadedFolders: prev.loadedFolders,
      }));
      
      setError(null);
      
      // Fetch diagrams for the root folder if it exists
      fetchDiagramsForFolder(normalized.folderHierarchy.rootId);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  }, [normalizeFolderData, fetchDiagramsForFolder]);

  /**
   * Create a new folder
   */
  const createFolder = useCallback(async (name: string, parentId: number | null) => {
    try {
      if (!name.trim()) return;
      
      // Find the root folder ID if parentId is null
      if (parentId === null) {
        const rootFolder = Object.values(normalizedState.folders).find(folder => folder.is_root);
        if (rootFolder) {
          // Call API with the root folder ID
          await apiService.createFolder(name.trim(), rootFolder.id);
        } else {
          console.error('No root folder found');
          setError('Failed to create folder: No root folder found');
          return;
        }
      } else {
        // Call API with the provided parent ID
        await apiService.createFolder(name.trim(), parentId);
      }
      
      // Refresh folders
      await fetchFolders();
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
    }
  }, [fetchFolders, normalizedState.folders]);

  /**
   * Delete a folder
   */
  const deleteFolder = useCallback(async (folderId: number) => {
    try {
      await apiService.deleteFolder(folderId);
      
      // Refresh folders
      await fetchFolders();
    } catch (err) {
      console.error('Error deleting folder:', err);
      
      // Display the specific error message from the backend if available
      if (err instanceof Error) {
        // Extract the error message from the axios error response
        const errorMessage = err.message.includes('Cannot delete folder containing diagrams') 
          ? 'Cannot delete folder containing diagrams. Move or delete diagrams first.'
          : err.message;
        setError(errorMessage);
      } else {
        setError('Failed to delete folder');
      }
    }
  }, [fetchFolders]);

  /**
   * Move a diagram to a folder
   */
  const moveDiagram = useCallback(async (diagramId: number, targetFolderId: number) => {
    try {
      await apiService.moveDiagram(diagramId, targetFolderId);
      
      // Refresh diagrams for all folders we have loaded
      const folderIds = normalizedState.loadedFolders;
      for (const folderId of folderIds) {
        await fetchDiagramsForFolder(folderId);
      }
    } catch (err) {
      console.error('Error moving diagram:', err);
      setError('Failed to move diagram');
    }
  }, [fetchDiagramsForFolder, normalizedState.loadedFolders]);

  /**
   * Check if a folder is expanded
   */
  const isFolderExpanded = useCallback((folderId: number): boolean => {
    return expandedFolders.includes(folderId);
  }, [expandedFolders]);

  /**
   * Toggle folder expansion
   */
  const toggleFolderExpansion = useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      } else {
        // Fetch diagrams for this folder if we're expanding it and haven't loaded them yet
        if (!normalizedState.loadedFolders.includes(folderId)) {
          // We know folderId is not null here since it's a parameter of type number
          fetchDiagramsForFolder(folderId);
        }
        return [...prev, folderId];
      }
    });
  }, [fetchDiagramsForFolder, normalizedState.loadedFolders]);

  /**
   * Get diagrams for a specific folder
   */
  const getDiagramsForFolder = useCallback((folderId: number): DiagramItem[] => {
    return normalizedState.diagramsByFolderId[folderId] || [];
  }, [normalizedState.diagramsByFolderId]);

  /**
   * Get the root folder
   */
  const getRootFolder = useCallback((): FolderItem | null => {
    const rootId = normalizedState.folderHierarchy.rootId;
    return rootId !== null ? normalizedState.folders[rootId] : null;
  }, [normalizedState.folders, normalizedState.folderHierarchy.rootId]);

  // Update flattened folders whenever the normalized state changes
  useEffect(() => {
    setFlattenedFolders(flattenFolderHierarchy(normalizedState));
  }, [normalizedState, flattenFolderHierarchy]);

  // Fetch folders when component mounts or refreshTrigger changes
  useEffect(() => {
    fetchFolders();
    
    // Set up interval to refresh the data periodically
    const intervalId = setInterval(fetchFolders, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchFolders, refreshTrigger]);

  return {
    isLoading,
    error,
    normalizedState,
    flattenedFolders,
    fetchFolders,
    fetchDiagramsForFolder,
    createFolder,
    deleteFolder,
    moveDiagram,
    isFolderExpanded,
    toggleFolderExpansion,
    getDiagramsForFolder,
    getRootFolder,
  };
};

export default useDiagramStorage;
