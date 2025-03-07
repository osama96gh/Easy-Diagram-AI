# Diagmarm Builder v0.1.0 - Frontend Specification

## 1. Project Overview

Diagmarm Builder is a web-based tool that allows users to create and visualize diagrams using the mermaid.js library. Version 0.1.0 enhances the initial version by adding AI-powered diagram modification capabilities, allowing users to update diagrams using natural language requests.

### 1.1 Vision

To provide an intuitive interface for creating and visualizing mermaid diagrams, leveraging AI to simplify the diagram creation and modification process.

### 1.2 Core Objectives for v0.1.0

- Maintain the simple, functional web interface for mermaid diagram creation
- Continue to provide real-time rendering of mermaid diagrams
- Support all diagram types available in mermaid.js
- Ensure responsive design for various screen sizes
- **Add AI-powered diagram modification through natural language requests**
- **Integrate with LLM API for processing natural language to mermaid code**

## 2. System Architecture for v0.1.0

The architecture now includes an AI component with separate frontend and backend services:

### 2.1 Key Components

1. **Frontend**
   - **Code Editor**: A text area where users can write mermaid syntax
   - **Diagram Renderer**: A component that uses mermaid.js to render the diagram from the provided code
   - **AI Assistant UI**: The user interface for entering natural language requests

### 2.2 Component Interaction

```
+----------------+                  +----------------+
|                |  HTTP Request    |                |
|    Frontend    | ---------------> |    Backend     |
|  (JavaScript)  | <--------------- |    (Python)    |
|                |  HTTP Response   |                |
+----------------+                  +----------------+
       |                                    |
       v                                    v
+----------------+                  +----------------+
|  Mermaid.js    |                  |   LangChain    |
|   Renderer     |                  |   + Claude     |
+----------------+                  +----------------+
```

### 2.3 Data Flow

1. User enters mermaid code in the editor
2. The code is passed to the mermaid.js renderer
3. The rendered diagram is displayed to the user
4. User enters a natural language request in the AI Assistant
5. Frontend sends the current diagram code and request to the backend API
6. Backend processes the request using LangChain and Anthropic Claude
7. Backend returns the updated mermaid code to the frontend
8. Frontend updates the code editor with the new code
9. The diagram is automatically re-rendered with the changes

## 3. Frontend Folder Structure

```
frontend/
├── index.html           # Main HTML file
├── css/                 # CSS styles
│   └── styles.css       # Main stylesheet
└── js/                  # JavaScript files
    ├── main.js          # Main application logic
    ├── mermaid-init.js  # Mermaid initialization
    └── ai-client.js     # API client for AI service
```

## 4. Frontend Specification

### 4.1 User Interface Components

1. **Code Editor Panel**: A text area where users can write mermaid syntax
   - Syntax highlighting is not required but could be added if time permits
   - Should have sufficient height to accommodate complex diagrams
   - Includes a simple toolbar with common actions (clear, copy)

2. **Diagram Rendering Panel**: The area where the rendered diagram is displayed
   - Updates in real-time as the code is changed
   - Displays error messages if the mermaid syntax is invalid
   - Resizes the diagram appropriately to fit the panel

3. **AI Assistant Panel**: A new area for AI interaction
   - Includes a text input field for natural language requests
   - Includes a submit button to send requests to the backend
   - Displays loading indicator during API calls
   - Shows error messages if the API processing fails
   - May include example prompts or suggestions

### 4.2 JavaScript Components

1. **main.js**
   - Core application logic
   - Event listeners for code editor updates
   - Diagram rendering functionality
   - Integration with AI Assistant

2. **mermaid-init.js**
   - Mermaid.js initialization and configuration
   - Diagram rendering function

3. **ai-client.js**
   - API client for communicating with the Python backend
   - Functions for sending requests and handling responses
   - Error handling for API communication

### 4.3 API Client Interface

```javascript
/**
 * Sends a request to update the diagram based on natural language input
 * @param {string} currentCode - The current mermaid code
 * @param {string} userRequest - The user's natural language request
 * @returns {Promise<string>} - The updated mermaid code
 */
async function updateDiagramWithAI(currentCode, userRequest) {
    // Implementation details...
}
```

### 4.4 Frontend Input/Output

**Input:**
- User-entered mermaid code in the code editor
- User-entered natural language request in the AI Assistant panel

**Output:**
- Rendered mermaid diagram in the diagram panel
- Updated mermaid code in the code editor after AI processing

### 4.5 API Request Format (to Backend)

```json
{
  "current_code": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
  "user_request": "Add a new node for error handling"
}
```

### 4.6 API Response Format (from Backend)

```json
{
  "updated_code": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B\nD --> E[Error Handling]\nE --> B"
}
```

### 4.7 Error Response Format

```json
{
  "error": "Failed to process request"
}
```

## 5. Integration Points

### 5.1 Frontend to Backend Communication

1. **API Endpoint**: The frontend will communicate with the backend using the `/api/update-diagram` endpoint
2. **Request Format**: JSON payload with `current_code` and `user_request` fields
3. **Response Format**: JSON payload with `updated_code` field or `error` field
4. **Error Handling**: The frontend will display appropriate error messages based on backend responses

## 6. User Interface Design for v0.1.0

### 6.1 Main Layout

The application will now have a three-panel layout:

```
+-------------------------------------------------------+
| Header (Logo, Title)                                  |
+------------------------+------------------------------+
|                        |                              |
|                        |                              |
|   Code Editor Panel    |    Diagram Rendering Panel   |
|                        |                              |
|                        |                              |
|                        |                              |
+------------------------+------------------------------+
|                AI Assistant Panel                     |
+-------------------------------------------------------+
| Footer (Version, Links)                               |
+-------------------------------------------------------+
```

### 6.2 Responsive Design

- The layout adapts to different screen sizes
- On smaller screens, the panels stack vertically
- The application is usable on tablets and larger mobile devices
- The AI Assistant panel collapses to a toggle-able section on smaller screens

## 7. Background Services Integration

The frontend now works seamlessly with the backend running as a background service using Supervisor.

### 7.1 Service Configuration

- The frontend HTTP server runs as a background process on port 8000
- The backend Flask server runs as a background process on port 5000
- Both services are managed through Supervisor for reliability and ease of use

### 7.2 Benefits for Frontend Development

- Consistent API endpoint availability during development
- No need to keep terminal windows open for running services
- Automatic restart of services if they crash
- Simplified development workflow

## 8. Future Enhancements (Post v0.1.0)

While not part of v0.1.0, the following features are planned for future versions:

1. Enhanced AI capabilities with diagram explanation and optimization
2. Saving and loading diagrams
3. Exporting diagrams in various formats
4. Enhanced code editor with syntax highlighting
5. User accounts and cloud storage
6. Collaborative editing features
