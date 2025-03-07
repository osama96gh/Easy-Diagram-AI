# Diagmarm Builder v0.1.0 - System Overview

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

The architecture includes an AI component with separate frontend and backend services:

### 2.1 Key Components

1. **Frontend**
   - **Code Editor**: A text area where users can write mermaid syntax
   - **Diagram Renderer**: A component that uses mermaid.js to render the diagram from the provided code
   - **AI Assistant UI**: The user interface for entering natural language requests

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

## 3. Folder Structure for v0.1.0

```
diagmarm-builder/
├── frontend/                # Frontend code
│   ├── index.html           # Main HTML file
│   ├── css/                 # CSS styles
│   │   └── styles.css       # Main stylesheet
│   └── js/                  # JavaScript files
│       ├── main.js          # Main application logic
│       ├── mermaid-init.js  # Mermaid initialization
│       └── ai-client.js     # API client for AI service
├── backend/                 # Python backend
│   ├── app.py               # Flask server
│   ├── langchain_service.py # LangChain implementation
│   ├── .env.example         # Example environment file
│   └── requirements.txt     # Python dependencies
├── supervisord.conf         # Supervisor configuration for background services
├── logs/                    # Log files for background services
└── README.md                # Project documentation
```

## 4. Detailed Specifications

For detailed specifications, please refer to:

- **Frontend Specification**: `frontend/specification.md`
- **Backend Specification**: `backend/specification.md`

## 5. User Interface Design for v0.1.0

### 5.1 Main Layout

The application has a three-panel layout:

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

## 6. Future Enhancements (Post v0.1.0)

While not part of v0.1.0, the following features are planned for future versions:

1. Enhanced AI capabilities with diagram explanation and optimization
2. Saving and loading diagrams
3. Exporting diagrams in various formats
4. Enhanced code editor with syntax highlighting
5. User accounts and cloud storage
6. Collaborative editing features
