/**
 * AI Client for Diagmarm Builder
 * Handles communication with the backend API for AI-powered diagram updates
 */

/**
 * Base URL for API requests
 * Points to the backend server
 * Change this if your backend is running on a different host/port
 */
const API_BASE_URL = "http://127.0.0.1:5000";

/**
 * Sends a request to update the diagram based on natural language input
 * @param {string} currentCode - The current mermaid code
 * @param {string} userRequest - The user's natural language request
 * @returns {Promise<string>} - The updated mermaid code
 * @throws {Error} - If the API request fails
 */
async function updateDiagramWithAI(currentCode, userRequest) {
    try {
        // Prepare the request payload
        const payload = {
            current_code: currentCode,
            user_request: userRequest
        };
        
        // Send the request to the backend API
        const response = await fetch(`${API_BASE_URL}/api/update-diagram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Parse the response
        const data = await response.json();
        
        // Check if the response contains an error
        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to update diagram');
        }
        
        // Return the updated code
        return data.updated_code;
    } catch (error) {
        // Re-throw the error to be handled by the caller
        throw error;
    }
}

/**
 * Checks if the backend API is available
 * @returns {Promise<boolean>} - True if the API is available, false otherwise
 */
async function checkAPIAvailability() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
}
