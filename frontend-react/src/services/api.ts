import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

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
  }
};
