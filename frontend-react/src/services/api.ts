import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * API service for communicating with the backend
 */
export const apiService = {
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
