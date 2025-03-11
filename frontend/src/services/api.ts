import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Interfaces for folder and diagram data
 */
export interface FolderItem {
  id: number;
  name: string;
  parent_id: number | null;
  is_root: boolean;
  created_at: string;
  last_updated: string;
  children: FolderItem[];
}

export interface DiagramItem {
  id: number;
  name: string;
  last_updated: string;
  folder_id: number;
}

export interface DiagramContent {
  id: number;
  content: string;
  last_updated: string;
  name: string | null;
  folder_id: number;
}

/**
 * API service for communicating with the backend
 */
export const apiService = {
  /**
   * Retrieves all diagrams from the backend
   * @returns Array of diagram metadata (id, name, last_updated)
   */
  getAllDiagrams: async (): Promise<Array<{ id: number; name: string; last_updated: string }>> => {
    try {
      console.log('Retrieving all diagrams from API');
      
      const response = await axios.get(`${API_BASE_URL}/api/diagrams`);
      
      console.log('API response for all diagrams:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error retrieving diagrams:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve diagrams: ${error.message}`);
      }
      throw new Error('Failed to retrieve diagrams');
    }
  },
  
  /**
   * Retrieves a specific diagram by ID
   * @param id - The ID of the diagram to retrieve
   * @returns The diagram data
   */
  getDiagram: async (id: number): Promise<{ id: number; content: string; last_updated: string; name: string | null }> => {
    try {
      console.log(`Retrieving diagram ${id} from API`);
      
      const response = await axios.get(`${API_BASE_URL}/api/diagram/${id}`);
      
      console.log('API response for diagram:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error retrieving diagram:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve diagram: ${error.message}`);
      }
      throw new Error('Failed to retrieve diagram');
    }
  },
  /**
   * Retrieves the latest diagram from the backend
   * @returns The latest diagram data or null if no diagram exists
   */
  getLatestDiagram: async (): Promise<{ id: number; content: string; last_updated: string; name: string | null } | null> => {
    try {
      console.log('Retrieving latest diagram from API');
      
      const response = await axios.get(`${API_BASE_URL}/api/diagram`);
      
      console.log('API response for latest diagram:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // If no diagram exists, content will be null
      if (!response.data.content) {
        return null;
      }
      
      return response.data;
    } catch (error) {
      console.error('API error retrieving diagram:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve diagram: ${error.message}`);
      }
      throw new Error('Failed to retrieve diagram');
    }
  },
  
  /**
   * Creates a new diagram in the backend
   * @param content - The mermaid code for the diagram
   * @param name - Optional name for the diagram
   * @returns The created diagram data
   */
  createDiagram: async (content: string, name: string = ''): Promise<{ id: number; content: string; last_updated: string; name: string | null }> => {
    try {
      console.log('Creating new diagram in API:', { content, name });
      
      const response = await axios.post(`${API_BASE_URL}/api/diagram`, {
        content,
        name
      });
      
      console.log('API response for diagram creation:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error creating diagram:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create diagram: ${error.message}`);
      }
      throw new Error('Failed to create diagram');
    }
  },
  
  /**
   * Updates an existing diagram in the backend
   * @param id - The ID of the diagram to update
   * @param content - The updated mermaid code
   * @param name - Optional updated name for the diagram
   * @returns The updated diagram data
   */
  updateDiagram: async (id: number, content: string, name: string = ''): Promise<{ id: number; content: string; last_updated: string; name: string | null }> => {
    try {
      console.log('Updating diagram in API:', { id, content, name });
      
      const response = await axios.put(`${API_BASE_URL}/api/diagram/${id}`, {
        content,
        name
      });
      
      console.log('API response for diagram update:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error updating diagram:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update diagram: ${error.message}`);
      }
      throw new Error('Failed to update diagram');
    }
  },
  
  /**
   * Deletes a diagram by ID
   * @param id - The ID of the diagram to delete
   * @returns Success message
   */
  deleteDiagram: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`Deleting diagram ${id} from API`);
      
      const response = await axios.delete(`${API_BASE_URL}/api/diagram/${id}`);
      
      console.log('API response for diagram deletion:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error deleting diagram:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete diagram: ${error.message}`);
      }
      throw new Error('Failed to delete diagram');
    }
  },
  /**
   * Sends a request to update the diagram based on natural language input
   * @param currentCode - The current mermaid code
   * @param userRequest - The user's natural language request
   * @returns The updated mermaid code
   */
  updateDiagramWithAI: async (currentCode: string, userRequest: string): Promise<string> => {
    try {
      console.log('Sending request to API:', { currentCode, userRequest });
      
      const response = await axios.post(`${API_BASE_URL}/api/update-diagram`, {
        current_code: currentCode,
        user_request: userRequest
      });

      console.log('API response:', response.data);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Handle potentially malformed JSON response
      if (!response.data.updated_code) {
        console.error('Invalid API response format:', response.data);
        throw new Error('Invalid response from API');
      }

      return response.data.updated_code;
    } catch (error) {
      console.error('API error details:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update diagram: ${error.message}`);
      }
      throw new Error('Failed to update diagram');
    }
  },

  /**
   * Checks if the backend API is available
   * @returns True if the API is available, false otherwise
   */
  checkAPIAvailability: async (): Promise<boolean> => {
    try {
      console.log('Checking API health at:', `${API_BASE_URL}/api/health`);
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      console.log('API health response:', response.data);
      return response.status === 200;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  },

  /**
   * Folder-related methods
   */

  /**
   * Retrieves the folder hierarchy from the backend
   * @returns Array of folder data with nested children
   */
  getFolders: async (): Promise<FolderItem[]> => {
    try {
      console.log('Retrieving folder hierarchy from API');
      
      const response = await axios.get(`${API_BASE_URL}/api/folders`);
      
      console.log('API response for folders:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error retrieving folders:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve folders: ${error.message}`);
      }
      throw new Error('Failed to retrieve folders');
    }
  },

  /**
   * Creates a new folder
   * @param name - The name of the folder
   * @param parentId - The ID of the parent folder (required for non-root folders)
   * @param isRoot - Whether this is a root folder (default: false)
   * @returns The created folder data
   */
  createFolder: async (name: string, parentId: number, isRoot: boolean = false): Promise<FolderItem> => {
    try {
      console.log('Creating new folder in API:', { name, parentId, isRoot });
      
      const response = await axios.post(`${API_BASE_URL}/api/folder`, {
        name,
        parent_id: parentId,
        is_root: isRoot
      });
      
      console.log('API response for folder creation:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error creating folder:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create folder: ${error.message}`);
      }
      throw new Error('Failed to create folder');
    }
  },

  /**
   * Updates an existing folder
   * @param id - The ID of the folder to update
   * @param name - The updated name
   * @param parentId - Optional updated parent folder ID
   * @returns The updated folder data
   */
  updateFolder: async (id: number, name: string, parentId?: number): Promise<FolderItem> => {
    try {
      console.log('Updating folder in API:', { id, name, parentId });
      
      const data: any = { name };
      if (parentId !== undefined) {
        data.parent_id = parentId;
      }
      
      const response = await axios.put(`${API_BASE_URL}/api/folder/${id}`, data);
      
      console.log('API response for folder update:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error updating folder:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update folder: ${error.message}`);
      }
      throw new Error('Failed to update folder');
    }
  },

  /**
   * Deletes a folder by ID
   * @param id - The ID of the folder to delete
   * @returns Success message
   */
  deleteFolder: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`Deleting folder ${id} from API`);
      
      const response = await axios.delete(`${API_BASE_URL}/api/folder/${id}`);
      
      console.log('API response for folder deletion:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error deleting folder:', error);
      
      // Extract the error message from the axios error response if available
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error instanceof Error) {
        throw new Error(`Failed to delete folder: ${error.message}`);
      }
      
      throw new Error('Failed to delete folder');
    }
  },

  /**
   * Retrieves all diagrams in a specific folder
   * @param folderId - The ID of the folder
   * @returns Array of diagram metadata
   */
  getDiagramsInFolder: async (folderId: number): Promise<DiagramItem[]> => {
    try {
      console.log(`Retrieving diagrams in folder ${folderId} from API`);
      
      const response = await axios.get(`${API_BASE_URL}/api/folder/${folderId}/diagrams`);
      
      console.log('API response for diagrams in folder:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error retrieving diagrams in folder:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve diagrams in folder: ${error.message}`);
      }
      throw new Error('Failed to retrieve diagrams in folder');
    }
  },

  /**
   * Creates a new diagram in a specific folder
   * @param content - The mermaid code for the diagram
   * @param name - Optional name for the diagram
   * @param folderId - The ID of the folder to create the diagram in
   * @returns The created diagram data
   */
  createDiagramInFolder: async (content: string, name: string = '', folderId: number): Promise<DiagramContent> => {
    try {
      console.log('Creating new diagram in folder in API:', { content, name, folderId });
      
      const response = await axios.post(`${API_BASE_URL}/api/diagram`, {
        content,
        name,
        folder_id: folderId
      });
      
      console.log('API response for diagram creation in folder:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error creating diagram in folder:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create diagram in folder: ${error.message}`);
      }
      throw new Error('Failed to create diagram in folder');
    }
  },

  /**
   * Moves a diagram to a different folder
   * @param diagramId - The ID of the diagram to move
   * @param folderId - The ID of the destination folder
   * @returns Success message
   */
  moveDiagram: async (diagramId: number, folderId: number): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`Moving diagram ${diagramId} to folder ${folderId}`);
      
      const response = await axios.put(`${API_BASE_URL}/api/diagram/${diagramId}/move`, {
        folder_id: folderId
      });
      
      console.log('API response for diagram move:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('API error moving diagram:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to move diagram: ${error.message}`);
      }
      throw new Error('Failed to move diagram');
    }
  }
};
