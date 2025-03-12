import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { apiService, FolderItem, DiagramItem, DiagramContent } from '../services/api';

// Define the state structure
interface DiagramState {
  folders: {
    [id: number]: FolderItem;
  };
  folderHierarchy: {
    rootId: number | null;
    childrenByParentId: {
      [parentId: number]: number[];
    };
  };
  diagramsByFolderId: {
    [folderId: number]: DiagramItem[];
  };
  loadedFolders: number[];
  expandedFolders: number[];
  selectedDiagramId: number | null;
  isLoading: boolean;
  error: string | null;
  refreshingFolders: number[];
  flattenedFolders: Array<{ id: number; name: string; depth: number }>;
}

// Define the actions our reducer will handle
type DiagramAction =
  | { type: 'SET_FOLDERS', payload: FolderItem[] }
  | { type: 'SET_DIAGRAMS_FOR_FOLDER', payload: { folderId: number, diagrams: DiagramItem[] } }
  | { type: 'ADD_LOADED_FOLDER', payload: number }
  | { type: 'REMOVE_LOADED_FOLDER', payload: number }
  | { type: 'SET_SELECTED_DIAGRAM', payload: number | null }
  | { type: 'TOGGLE_FOLDER_EXPANSION', payload: number }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'SET_REFRESHING_FOLDER', payload: { folderId: number, refreshing: boolean } }
  | { type: 'ADD_DIAGRAM', payload: { folderId: number, diagram: DiagramItem } }
  | { type: 'UPDATE_DIAGRAM', payload: { diagram: DiagramItem } }
  | { type: 'REMOVE_DIAGRAM', payload: { diagramId: number, folderId: number } }
  | { type: 'MOVE_DIAGRAM', payload: { diagramId: number, sourceFolderId: number, targetFolderId: number } }
  | { type: 'SET_FLATTENED_FOLDERS', payload: Array<{ id: number; name: string; depth: number }> }
  | { type: 'VALIDATE_STATE', payload: { folders: { [id: number]: FolderItem } } };

// Define the context value type
interface DiagramContextValue {
  state: DiagramState;
  fetchFolders: () => Promise<void>;
  fetchDiagramsForFolder: (folderId: number, forceRefresh?: boolean) => Promise<void>;
  selectDiagram: (diagramId: number | null) => void;
  toggleFolderExpansion: (folderId: number) => void;
  createDiagram: (folderId: number, content?: string, name?: string) => Promise<DiagramContent>;
  updateDiagram: (diagramId: number, content: string, name?: string) => Promise<void>;
  deleteDiagram: (diagramId: number) => Promise<void>;
  moveDiagram: (diagramId: number, targetFolderId: number) => Promise<void>;
  createFolder: (name: string, parentId: number | null) => Promise<void>;
  deleteFolder: (folderId: number) => Promise<void>;
  getDiagramsForFolder: (folderId: number) => DiagramItem[];
  isFolderExpanded: (folderId: number) => boolean;
  isFolderRefreshing: (folderId: number) => boolean;
  getRootFolder: () => FolderItem | null;
  refreshExpandedFolders: () => Promise<void>;
}

// Create the context with a default value
const DiagramContext = createContext<DiagramContextValue | undefined>(undefined);

// Initial state
const initialState: DiagramState = {
  folders: {},
  folderHierarchy: {
    rootId: null,
    childrenByParentId: {},
  },
  diagramsByFolderId: {},
  loadedFolders: [],
  expandedFolders: [],
  selectedDiagramId: null,
  isLoading: false,
  error: null,
  refreshingFolders: [],
  flattenedFolders: [],
};

// Load expanded folders from localStorage
const loadExpandedFolders = (): number[] => {
  try {
    const savedState = localStorage.getItem('expandedFolders');
    if (!savedState) return [];
    
    const parsedState = JSON.parse(savedState);
    // Validate that we have an array of numbers
    if (Array.isArray(parsedState) && parsedState.every(item => typeof item === 'number')) {
      return parsedState;
    } else {
      console.warn('Invalid format in localStorage for expandedFolders, resetting');
      localStorage.removeItem('expandedFolders');
      return [];
    }
  } catch (error) {
    console.error('Error loading expanded folders from localStorage:', error);
    // Clean up potentially corrupted data
    localStorage.removeItem('expandedFolders');
    return [];
  }
};

// Validate expanded folders against existing folders
const validateExpandedFolders = (expandedFolders: number[], folders: { [id: number]: FolderItem }): number[] => {
  // Filter out any folder IDs that don't exist in the current folders
  return expandedFolders.filter(id => folders[id] !== undefined);
};

// Load selected diagram from localStorage
const loadSelectedDiagram = (): number | null => {
  try {
    const savedState = localStorage.getItem('selectedDiagramId');
    if (!savedState) return null;
    
    const parsedState = parseInt(savedState, 10);
    if (!isNaN(parsedState)) {
      return parsedState;
    } else {
      console.warn('Invalid format in localStorage for selectedDiagramId, resetting');
      localStorage.removeItem('selectedDiagramId');
      return null;
    }
  } catch (error) {
    console.error('Error loading selected diagram from localStorage:', error);
    // Clean up potentially corrupted data
    localStorage.removeItem('selectedDiagramId');
    return null;
  }
};

// Validate selected diagram against existing diagrams
const validateSelectedDiagram = (
  selectedDiagramId: number | null, 
  diagramsByFolderId: { [folderId: number]: DiagramItem[] }
): number | null => {
  if (selectedDiagramId === null) return null;
  
  // Check if the selected diagram exists in any folder
  for (const diagrams of Object.values(diagramsByFolderId)) {
    if (diagrams.some(diagram => diagram.id === selectedDiagramId)) {
      return selectedDiagramId;
    }
  }
  
  // If not found, clear the selection
  localStorage.removeItem('selectedDiagramId');
  return null;
};

// Helper function to normalize folder data
const normalizeFolderData = (folders: FolderItem[]): {
  folders: { [id: number]: FolderItem };
  folderHierarchy: {
    rootId: number | null;
    childrenByParentId: { [parentId: number]: number[] };
  };
} => {
  const result = {
    folders: {} as { [id: number]: FolderItem },
    folderHierarchy: {
      rootId: null as number | null,
      childrenByParentId: {} as { [parentId: number]: number[] },
    },
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
};

// Helper function to flatten folder hierarchy
const flattenFolderHierarchy = (
  folders: { [id: number]: FolderItem },
  folderHierarchy: { rootId: number | null; childrenByParentId: { [parentId: number]: number[] } }
): Array<{ id: number; name: string; depth: number }> => {
  const result: Array<{ id: number; name: string; depth: number }> = [];
  
  // Helper function to process folders recursively
  const processFolders = (folderIds: number[], depth: number = 0) => {
    // Sort folder IDs to ensure consistent ordering
    folderIds.sort((a, b) => {
      const folderA = folders[a];
      const folderB = folders[b];
      return folderA.name.localeCompare(folderB.name);
    });
    
    folderIds.forEach(folderId => {
      const folder = folders[folderId];
      if (folder) {
        // Add the current folder to the result
        result.push({
          id: folder.id,
          name: folder.name,
          depth: depth
        });
        
        // Process children if they exist
        const childFolderIds = folderHierarchy.childrenByParentId[folder.id] || [];
        if (childFolderIds.length > 0) {
          processFolders(childFolderIds, depth + 1);
        }
      }
    });
  };
  
  // Start with the root folder if it exists
  if (folderHierarchy.rootId !== null) {
    processFolders([folderHierarchy.rootId]);
  }
  
  return result;
};

// Reducer function to handle state updates
function diagramReducer(state: DiagramState, action: DiagramAction): DiagramState {
  switch (action.type) {
    case 'SET_FOLDERS': {
      const { folders, folderHierarchy } = normalizeFolderData(action.payload);
      const flattenedFolders = flattenFolderHierarchy(folders, folderHierarchy);
      
      // Validate expanded folders against the new folders
      const validExpandedFolders = validateExpandedFolders(state.expandedFolders, folders);
      
      // If any folders were removed, update localStorage
      if (validExpandedFolders.length !== state.expandedFolders.length) {
        localStorage.setItem('expandedFolders', JSON.stringify(validExpandedFolders));
      }
      
      // Clean up loaded folders that no longer exist
      const validLoadedFolders = state.loadedFolders.filter(id => folders[id] !== undefined);
      
      // Clean up diagrams for folders that no longer exist
      const validDiagramsByFolderId = { ...state.diagramsByFolderId };
      Object.keys(validDiagramsByFolderId).forEach(folderIdStr => {
        const folderId = parseInt(folderIdStr, 10);
        if (!folders[folderId]) {
          delete validDiagramsByFolderId[folderId];
        }
      });
      
      // Validate selected diagram
      const validSelectedDiagram = validateSelectedDiagram(state.selectedDiagramId, validDiagramsByFolderId);
      
      return {
        ...state,
        folders,
        folderHierarchy,
        flattenedFolders,
        expandedFolders: validExpandedFolders,
        loadedFolders: validLoadedFolders,
        diagramsByFolderId: validDiagramsByFolderId,
        selectedDiagramId: validSelectedDiagram
      };
    }

    case 'SET_DIAGRAMS_FOR_FOLDER':
      return {
        ...state,
        diagramsByFolderId: {
          ...state.diagramsByFolderId,
          [action.payload.folderId]: action.payload.diagrams
        },
        loadedFolders: state.loadedFolders.includes(action.payload.folderId)
          ? state.loadedFolders
          : [...state.loadedFolders, action.payload.folderId]
      };

    case 'ADD_LOADED_FOLDER':
      return {
        ...state,
        loadedFolders: state.loadedFolders.includes(action.payload)
          ? state.loadedFolders
          : [...state.loadedFolders, action.payload]
      };
      
    case 'REMOVE_LOADED_FOLDER':
      return {
        ...state,
        loadedFolders: state.loadedFolders.filter(id => id !== action.payload)
      };

    case 'SET_SELECTED_DIAGRAM':
      // Save to localStorage for persistence
      if (action.payload !== null) {
        localStorage.setItem('selectedDiagramId', action.payload.toString());
      } else {
        localStorage.removeItem('selectedDiagramId');
      }
      return {
        ...state,
        selectedDiagramId: action.payload
      };

    case 'TOGGLE_FOLDER_EXPANSION': {
      const newExpandedFolders = state.expandedFolders.includes(action.payload)
        ? state.expandedFolders.filter(id => id !== action.payload)
        : [...state.expandedFolders, action.payload];
        
      // Save to localStorage for persistence
      localStorage.setItem('expandedFolders', JSON.stringify(newExpandedFolders));
      
      return {
        ...state,
        expandedFolders: newExpandedFolders
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'SET_REFRESHING_FOLDER': {
      const { folderId, refreshing } = action.payload;
      return {
        ...state,
        refreshingFolders: refreshing
          ? [...state.refreshingFolders, folderId]
          : state.refreshingFolders.filter(id => id !== folderId)
      };
    }

    case 'ADD_DIAGRAM': {
      const { folderId, diagram } = action.payload;
      const folderDiagrams = state.diagramsByFolderId[folderId] || [];
      
      // Check if diagram already exists
      const existingIndex = folderDiagrams.findIndex(d => d.id === diagram.id);
      
      if (existingIndex >= 0) {
        // Update existing diagram
        const updatedDiagrams = [...folderDiagrams];
        updatedDiagrams[existingIndex] = diagram;
        
        return {
          ...state,
          diagramsByFolderId: {
            ...state.diagramsByFolderId,
            [folderId]: updatedDiagrams
          }
        };
      } else {
        // Add new diagram
        return {
          ...state,
          diagramsByFolderId: {
            ...state.diagramsByFolderId,
            [folderId]: [...folderDiagrams, diagram]
          }
        };
      }
    }

    case 'UPDATE_DIAGRAM': {
      const { diagram } = action.payload;
      const folderId = diagram.folder_id;
      
      if (!state.diagramsByFolderId[folderId]) {
        return state;
      }
      
      const updatedDiagrams = state.diagramsByFolderId[folderId].map(d => 
        d.id === diagram.id ? diagram : d
      );
      
      return {
        ...state,
        diagramsByFolderId: {
          ...state.diagramsByFolderId,
          [folderId]: updatedDiagrams
        }
      };
    }

    case 'REMOVE_DIAGRAM': {
      const { diagramId, folderId } = action.payload;
      
      if (!state.diagramsByFolderId[folderId]) {
        return state;
      }
      
      const updatedDiagrams = state.diagramsByFolderId[folderId].filter(d => d.id !== diagramId);
      
      return {
        ...state,
        diagramsByFolderId: {
          ...state.diagramsByFolderId,
          [folderId]: updatedDiagrams
        },
        // If the selected diagram is being removed, clear the selection
        selectedDiagramId: state.selectedDiagramId === diagramId ? null : state.selectedDiagramId
      };
    }

    case 'MOVE_DIAGRAM': {
      const { diagramId, sourceFolderId, targetFolderId } = action.payload;
      
      if (!state.diagramsByFolderId[sourceFolderId]) {
        return state;
      }
      
      // Find the diagram to move
      const diagramToMove = state.diagramsByFolderId[sourceFolderId].find(d => d.id === diagramId);
      
      if (!diagramToMove) {
        return state;
      }
      
      // Remove from source folder
      const sourceUpdatedDiagrams = state.diagramsByFolderId[sourceFolderId].filter(d => d.id !== diagramId);
      
      // Add to target folder
      const targetDiagrams = state.diagramsByFolderId[targetFolderId] || [];
      const updatedDiagram = { ...diagramToMove, folder_id: targetFolderId };
      
      return {
        ...state,
        diagramsByFolderId: {
          ...state.diagramsByFolderId,
          [sourceFolderId]: sourceUpdatedDiagrams,
          [targetFolderId]: [...targetDiagrams, updatedDiagram]
        }
      };
    }

    case 'SET_FLATTENED_FOLDERS':
      return {
        ...state,
        flattenedFolders: action.payload
      };
      
    case 'VALIDATE_STATE': {
      // Validate expanded folders against existing folders
      const validExpandedFolders = validateExpandedFolders(state.expandedFolders, action.payload.folders);
      
      // If any folders were removed, update localStorage
      if (validExpandedFolders.length !== state.expandedFolders.length) {
        localStorage.setItem('expandedFolders', JSON.stringify(validExpandedFolders));
      }
      
      // Validate selected diagram
      const validSelectedDiagram = validateSelectedDiagram(state.selectedDiagramId, state.diagramsByFolderId);
      
      return {
        ...state,
        expandedFolders: validExpandedFolders,
        selectedDiagramId: validSelectedDiagram
      };
    }

    default:
      return state;
  }
}

// Create the provider component
export const DiagramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(diagramReducer, {
    ...initialState,
    expandedFolders: loadExpandedFolders(),
    selectedDiagramId: loadSelectedDiagram()
  });
  
  const lastRefreshTimeRef = useRef<{[folderId: number]: number}>({});
  
  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const foldersList = await apiService.getFolders();
      dispatch({ type: 'SET_FOLDERS', payload: foldersList });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Fetch diagrams for the root folder if it exists
      const normalized = normalizeFolderData(foldersList);
      if (normalized.folderHierarchy.rootId !== null) {
        fetchDiagramsForFolder(normalized.folderHierarchy.rootId);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load folders' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Fetch diagrams for a specific folder
  const fetchDiagramsForFolder = useCallback(async (folderId: number, forceRefresh: boolean = false) => {
    // Skip if folderId is null
    if (folderId === null) return;
    
    // First verify the folder exists in our state
    if (!state.folders[folderId]) {
      console.warn(`Attempted to fetch diagrams for non-existent folder ${folderId}`);
      
      // Clean up any references to this folder
      if (state.expandedFolders.includes(folderId)) {
        dispatch({ type: 'TOGGLE_FOLDER_EXPANSION', payload: folderId });
      }
      
      // Remove from loaded folders
      if (state.loadedFolders.includes(folderId)) {
        dispatch({ type: 'REMOVE_LOADED_FOLDER', payload: folderId });
      }
      
      return;
    }
    
    try {
      // Only fetch if we haven't already loaded this folder's diagrams or if force refresh is requested
      if (forceRefresh || !state.loadedFolders.includes(folderId)) {
        // Mark folder as refreshing
        dispatch({ 
          type: 'SET_REFRESHING_FOLDER', 
          payload: { folderId, refreshing: true } 
        });
        
        const diagrams = await apiService.getDiagramsInFolder(folderId);
        
        // Check if the folder still exists in our state (it might have been deleted while we were fetching)
        if (state.folders[folderId]) {
          dispatch({ 
            type: 'SET_DIAGRAMS_FOR_FOLDER', 
            payload: { folderId, diagrams } 
          });
          
          // Update last refresh time
          lastRefreshTimeRef.current[folderId] = Date.now();
        }
        
        // Remove from refreshing state
        dispatch({ 
          type: 'SET_REFRESHING_FOLDER', 
          payload: { folderId, refreshing: false } 
        });
      }
    } catch (err) {
      console.error(`Error fetching diagrams for folder ${folderId}:`, err);
      
      // Handle case where folder might have been deleted
      if (err instanceof Error && 
          (err.message.includes('not found') || err.message.includes('404'))) {
        console.warn(`Folder ${folderId} may have been deleted, removing from state`);
        
        // Clean up any references to this folder
        if (state.expandedFolders.includes(folderId)) {
          dispatch({ type: 'TOGGLE_FOLDER_EXPANSION', payload: folderId });
        }
        
        // Remove from loaded folders
        if (state.loadedFolders.includes(folderId)) {
          dispatch({ type: 'REMOVE_LOADED_FOLDER', payload: folderId });
        }
        
        // Refresh folders to get the latest structure
        fetchFolders();
        
        dispatch({ type: 'SET_ERROR', payload: `Folder structure has changed. Refreshing data.` });
      } else {
        dispatch({ type: 'SET_ERROR', payload: `Failed to load diagrams for folder ${folderId}` });
      }
      
      // Remove from refreshing state even if there's an error
      dispatch({ 
        type: 'SET_REFRESHING_FOLDER', 
        payload: { folderId, refreshing: false } 
      });
    }
  }, [state.loadedFolders, state.expandedFolders, state.folders, fetchFolders]);

  // Create a new folder
  const createFolder = useCallback(async (name: string, parentId: number | null) => {
    try {
      if (!name.trim()) return;
      
      // Find the root folder ID if parentId is null
      if (parentId === null) {
        const rootFolder = Object.values(state.folders).find(folder => folder.is_root);
        if (rootFolder) {
          // Call API with the root folder ID
          await apiService.createFolder(name.trim(), rootFolder.id);
        } else {
          console.error('No root folder found');
          dispatch({ type: 'SET_ERROR', payload: 'Failed to create folder: No root folder found' });
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
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create folder' });
    }
  }, [fetchFolders, state.folders]);

  // Delete a folder
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
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete folder' });
      }
    }
  }, [fetchFolders]);

  // Create a new diagram
  const createDiagram = useCallback(async (folderId: number, content: string = '', name: string = ''): Promise<DiagramContent> => {
    try {
      const newDiagram = await apiService.createDiagramInFolder(content, name, folderId);
      
      // Update local state optimistically
      dispatch({
        type: 'ADD_DIAGRAM',
        payload: {
          folderId,
          diagram: {
            id: newDiagram.id,
            name: newDiagram.name || '',
            last_updated: newDiagram.last_updated,
            folder_id: folderId
          }
        }
      });
      
      // Set as selected diagram
      dispatch({ type: 'SET_SELECTED_DIAGRAM', payload: newDiagram.id });
      
      return newDiagram;
    } catch (err) {
      console.error('Error creating diagram:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create diagram' });
      throw err;
    }
  }, []);

  // Update a diagram
  const updateDiagram = useCallback(async (diagramId: number, content: string, name: string = '') => {
    try {
      const updatedDiagram = await apiService.updateDiagram(diagramId, content, name);
      
      // Find which folder contains this diagram
      let folderId: number | null = null;
      Object.entries(state.diagramsByFolderId).forEach(([folderIdStr, diagrams]) => {
        if (diagrams.some(d => d.id === diagramId)) {
          folderId = parseInt(folderIdStr, 10);
        }
      });
      
      if (folderId !== null) {
        // Update local state
        dispatch({
          type: 'UPDATE_DIAGRAM',
          payload: {
            diagram: {
              id: updatedDiagram.id,
              name: updatedDiagram.name || '',
              last_updated: updatedDiagram.last_updated,
              folder_id: folderId
            }
          }
        });
      }
    } catch (err) {
      console.error('Error updating diagram:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update diagram' });
      throw err;
    }
  }, [state.diagramsByFolderId]);

  // Delete a diagram
  const deleteDiagram = useCallback(async (diagramId: number) => {
    try {
      // Find which folder contains this diagram
      let folderId: number | null = null;
      Object.entries(state.diagramsByFolderId).forEach(([folderIdStr, diagrams]) => {
        if (diagrams.some(d => d.id === diagramId)) {
          folderId = parseInt(folderIdStr, 10);
        }
      });
      
      await apiService.deleteDiagram(diagramId);
      
      if (folderId !== null) {
        // Update local state
        dispatch({
          type: 'REMOVE_DIAGRAM',
          payload: {
            diagramId,
            folderId
          }
        });
      }
    } catch (err) {
      console.error('Error deleting diagram:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete diagram' });
      throw err;
    }
  }, [state.diagramsByFolderId]);

  // Move a diagram to a different folder
  const moveDiagram = useCallback(async (diagramId: number, targetFolderId: number) => {
    try {
      // Find the source folder ID
      let sourceFolderId: number | null = null;
      
      // Search through all loaded folders to find which one contains the diagram
      Object.entries(state.diagramsByFolderId).forEach(([folderId, diagrams]) => {
        if (diagrams.some(diagram => diagram.id === diagramId)) {
          sourceFolderId = parseInt(folderId);
        }
      });
      
      await apiService.moveDiagram(diagramId, targetFolderId);
      
      // Update local state if we know the source folder
      if (sourceFolderId !== null) {
        dispatch({
          type: 'MOVE_DIAGRAM',
          payload: {
            diagramId,
            sourceFolderId,
            targetFolderId
          }
        });
        
        // Refresh both folders to ensure data consistency
        await fetchDiagramsForFolder(sourceFolderId, true);
        await fetchDiagramsForFolder(targetFolderId, true);
      } else {
        // If we don't know the source folder, just refresh the target folder
        await fetchDiagramsForFolder(targetFolderId, true);
      }
    } catch (err) {
      console.error('Error moving diagram:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to move diagram' });
      throw err;
    }
  }, [fetchDiagramsForFolder, state.diagramsByFolderId]);

  // Refresh diagrams for all expanded folders
  const refreshExpandedFolders = useCallback(async () => {
    for (const folderId of state.expandedFolders) {
      // Only refresh folders that haven't been refreshed in the last 5 seconds
      const lastRefreshTime = lastRefreshTimeRef.current[folderId] || 0;
      const now = Date.now();
      if (now - lastRefreshTime > 5000) {
        await fetchDiagramsForFolder(folderId, true);
      }
    }
  }, [state.expandedFolders, fetchDiagramsForFolder]);

  // Select a diagram
  const selectDiagram = useCallback((diagramId: number | null) => {
    dispatch({ type: 'SET_SELECTED_DIAGRAM', payload: diagramId });
  }, []);

  // Toggle folder expansion
  const toggleFolderExpansion = useCallback((folderId: number) => {
    // Check if we're expanding or collapsing
    const isExpanding = !state.expandedFolders.includes(folderId);
    
    dispatch({ type: 'TOGGLE_FOLDER_EXPANSION', payload: folderId });
    
    // Only fetch diagrams if we're expanding and haven't loaded them yet
    if (isExpanding && !state.loadedFolders.includes(folderId)) {
      fetchDiagramsForFolder(folderId);
    }
    // No automatic refresh on expansion - this was causing too many API calls
  }, [state.expandedFolders, state.loadedFolders, fetchDiagramsForFolder]);

  // Get diagrams for a specific folder
  const getDiagramsForFolder = useCallback((folderId: number): DiagramItem[] => {
    return state.diagramsByFolderId[folderId] || [];
  }, [state.diagramsByFolderId]);

  // Check if a folder is expanded
  const isFolderExpanded = useCallback((folderId: number): boolean => {
    return state.expandedFolders.includes(folderId);
  }, [state.expandedFolders]);

  // Check if a folder is currently refreshing
  const isFolderRefreshing = useCallback((folderId: number): boolean => {
    return state.refreshingFolders.includes(folderId);
  }, [state.refreshingFolders]);

  // Get the root folder
  const getRootFolder = useCallback((): FolderItem | null => {
    const rootId = state.folderHierarchy.rootId;
    return rootId !== null ? state.folders[rootId] : null;
  }, [state.folders, state.folderHierarchy.rootId]);

  // Fetch folders when component mounts
  useEffect(() => {
    fetchFolders();
    
    // Set up interval to refresh the folders periodically - less frequently
    const folderIntervalId = setInterval(fetchFolders, 60000); // Refresh every 60 seconds
    
    // No automatic refresh for expanded folders - only manual or on expansion
    
    return () => {
      clearInterval(folderIntervalId);
    };
  }, [fetchFolders]);

  // Restore expanded folders on initial load
  useEffect(() => {
    // For each expanded folder, ensure its diagrams are loaded
    state.expandedFolders.forEach(folderId => {
      if (!state.loadedFolders.includes(folderId)) {
        fetchDiagramsForFolder(folderId);
      }
    });
  }, [state.expandedFolders, fetchDiagramsForFolder, state.loadedFolders]);

  // Context value
  const contextValue: DiagramContextValue = {
    state,
    fetchFolders,
    fetchDiagramsForFolder,
    selectDiagram,
    toggleFolderExpansion,
    createDiagram,
    updateDiagram,
    deleteDiagram,
    moveDiagram,
    createFolder,
    deleteFolder,
    getDiagramsForFolder,
    isFolderExpanded,
    isFolderRefreshing,
    getRootFolder,
    refreshExpandedFolders
  };
  
  return (
    <DiagramContext.Provider value={contextValue}>
      {children}
    </DiagramContext.Provider>
  );
};

// Custom hook for using the diagram context
export const useDiagramContext = () => {
  const context = useContext(DiagramContext);
  if (context === undefined) {
    throw new Error('useDiagramContext must be used within a DiagramProvider');
  }
  return context;
};
