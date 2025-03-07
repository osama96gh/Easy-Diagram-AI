# Diagmarm Builder v0.1.0 - Backend Specification

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

2. **Backend**
   - **Flask Server**: A Python server that handles API requests
   - **LangChain Service**: A service that processes natural language using Anthropic's Claude model
   - **API Endpoints**: Interfaces for communication between frontend and backend

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

## 3. Backend Folder Structure

```
backend/
├── app.py               # Flask server
├── langchain_service.py # LangChain implementation
├── .env.example         # Example environment file
└── requirements.txt     # Python dependencies (includes Supervisor)
```

## 4. Backend Specification

### 4.1 Technology Stack

- **Framework**: Flask
- **AI Integration**: LangChain with Anthropic Claude
- **Dependencies**: flask, flask-cors, langchain, langchain-anthropic, python-dotenv

### 4.2 API Endpoints

#### 4.2.1 Update Diagram Endpoint

- **URL**: `/api/update-diagram`
- **Method**: POST
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "current_code": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
  "user_request": "Add a new node for error handling"
}
```

**Success Response:**
```json
{
  "updated_code": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B\nD --> E[Error Handling]\nE --> B"
}
```

**Error Response:**
```json
{
  "error": "Failed to process request"
}
```

### 4.3 LangChain Integration

#### 4.3.1 Model Configuration

- **Model**: Anthropic Claude (claude-3-sonnet-20240229)
- **Temperature**: 0.2 (lower for more deterministic outputs)
- **Authentication**: API key stored in environment variables

#### 4.3.2 Prompt Engineering

The system prompt will be designed to:
- Instruct the model to modify mermaid diagram code based on user requests
- Ensure the model returns only valid mermaid syntax
- Preserve the existing structure while making requested changes
- Avoid returning explanations or markdown formatting

#### 4.3.3 Python Service Interface

```python
def process_diagram_request(current_code: str, user_request: str) -> str:
    """
    Process a diagram modification request using LangChain and Anthropic.
    
    Args:
        current_code (str): The current mermaid diagram code
        user_request (str): The user's natural language request
        
    Returns:
        str: The updated mermaid diagram code
    """
    # Implementation details...
```

### 4.4 Backend Input/Output

**Input:**
- Current mermaid code from the frontend
- User's natural language request from the frontend

**Output:**
- Updated mermaid code to be sent back to the frontend
- Error message in case of processing failure

### 4.5 Environment Configuration

Required environment variables:
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude
- `FLASK_ENV`: Development or production environment
- `FLASK_DEBUG`: Enable/disable debug mode
- `CORS_ORIGINS`: Allowed origins for CORS (optional)

## 5. Integration Points

### 5.1 Frontend to Backend Communication

1. **API Endpoint**: The frontend will communicate with the backend using the `/api/update-diagram` endpoint
2. **Request Format**: JSON payload with `current_code` and `user_request` fields
3. **Response Format**: JSON payload with `updated_code` field or `error` field
4. **Error Handling**: The frontend will display appropriate error messages based on backend responses

### 5.2 Backend to LLM Communication

1. **LangChain**: The backend will use LangChain to communicate with Anthropic's Claude model
2. **Prompt Format**: The backend will format the user request and current code into a prompt for the LLM
3. **Response Processing**: The backend will extract and validate the mermaid code from the LLM response

## 6. Development Approach for v0.1.0

### 6.1 Development Steps

1. Set up the Python backend with Flask
2. Implement the LangChain integration with Anthropic Claude
3. Create the API endpoint for diagram updates
4. Connect the frontend to the backend API
5. Add error handling and loading states
6. Test the integration end-to-end

### 6.2 Testing

- Testing of AI integration with various natural language requests
- Validation of error handling for API failures

## 7. Background Services with Supervisor

The application now supports running both the frontend and backend services as background processes using Supervisor.

### 7.1 Supervisor Configuration

A `supervisord.conf` file in the project root configures:
- Both frontend and backend services to run as background processes
- Automatic restart of services if they crash
- Log file management for each service
- Process grouping for easier management

### 7.2 Service Management

The Makefile provides commands for managing the background services:
- `make start`: Start both services in the background
- `make stop`: Stop all running services
- `make restart`: Restart all services
- `make status`: Check the status of all services

### 7.3 Logging

Log files are stored in the `logs` directory:
- `logs/supervisord.log`: Main supervisor log
- `logs/backend_out.log`: Backend service output
- `logs/backend_err.log`: Backend service errors
- `logs/frontend_out.log`: Frontend service output
- `logs/frontend_err.log`: Frontend service errors

## 8. Future Enhancements (Post v0.1.0)

While not part of v0.1.0, the following features are planned for future versions:

1. Enhanced AI capabilities with diagram explanation and optimization
2. User accounts and cloud storage
3. Collaborative editing features
