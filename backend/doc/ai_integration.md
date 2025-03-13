# AI Integration in Diagmarm Builder

This document provides detailed information about the AI integration in the Diagmarm Builder system, focusing on how the application uses Anthropic Claude via LangChain to modify mermaid diagrams based on natural language requests.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Prompt Engineering](#prompt-engineering)
5. [Error Handling](#error-handling)
6. [Future Enhancements](#future-enhancements)

## Overview

The Diagmarm Builder uses AI to enable users to modify mermaid.js diagrams using natural language requests. This feature allows users to describe changes they want to make to a diagram, and the system will automatically update the diagram code accordingly.

```mermaid
graph TD
    A[User] -->|"Natural Language Request"| B[Diagmarm Builder]
    B -->|"Current Diagram + Request"| C[AI Service]
    C -->|"Modified Diagram"| B
    B -->|"Rendered Diagram"| A
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
```

## Architecture

The AI integration follows a clean architecture with clear separation of concerns:

```mermaid
flowchart TB
    subgraph Frontend
        UI[User Interface]
        DiagramEditor[Diagram Editor]
        DiagramRenderer[Diagram Renderer]
    end
    
    subgraph Backend
        API[Flask API]
        LangChainService[LangChain Service]
    end
    
    subgraph External
        Claude[Anthropic Claude API]
    end
    
    UI -->|User Request| DiagramEditor
    DiagramEditor -->|Current Diagram + Request| API
    API -->|Process Request| LangChainService
    LangChainService -->|Prompt| Claude
    Claude -->|Response| LangChainService
    LangChainService -->|Modified Diagram| API
    API -->|Updated Diagram| DiagramEditor
    DiagramEditor -->|Render| DiagramRenderer
    DiagramRenderer -->|Display| UI
    
    classDef frontend fill:#f9f,stroke:#333,stroke-width:1px;
    classDef backend fill:#bbf,stroke:#333,stroke-width:1px;
    classDef external fill:#bfb,stroke:#333,stroke-width:1px;
    
    class UI,DiagramEditor,DiagramRenderer frontend;
    class API,LangChainService backend;
    class Claude external;
```

## Implementation Details

### LangChain Service

The LangChain service (`langchain_service.py`) is responsible for processing diagram modification requests. It uses the LangChain framework to interact with the Anthropic Claude API.

```mermaid
classDiagram
    class LangChainService {
        +create_llm_client()
        +process_diagram_request(current_code, user_request)
        +validate_mermaid_code(code)
    }
    
    class ChatAnthropic {
        +model: string
        +temperature: float
        +anthropic_api_key: string
        +invoke(messages)
    }
    
    LangChainService --> ChatAnthropic : uses
```

### Request Processing Flow

The following sequence diagram illustrates the flow of a diagram modification request:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API as Flask API
    participant LangChain as LangChain Service
    participant Claude as Anthropic Claude
    
    User->>Frontend: Request diagram modification
    Frontend->>API: POST /api/update-diagram
    
    API->>API: Validate request
    
    alt Invalid Request
        API->>Frontend: Return 400 Bad Request
        Frontend->>User: Display error message
    else Valid Request
        API->>LangChain: process_diagram_request(current_code, user_request)
        
        LangChain->>LangChain: create_llm_client()
        LangChain->>LangChain: Prepare system and user messages
        
        LangChain->>Claude: Send prompt with diagram code and request
        Claude->>LangChain: Return modified diagram code
        
        LangChain->>LangChain: Basic validation of response
        
        alt Valid Response
            LangChain->>API: Return updated code
            API->>Frontend: Return 200 OK with updated code
            Frontend->>User: Display updated diagram
        else Invalid Response
            LangChain->>API: Return original code
            API->>Frontend: Return 200 OK with original code
            Frontend->>User: Display original diagram with error message
        end
    end
```

## Prompt Engineering

The system uses a carefully crafted prompt to instruct Claude on how to modify diagrams. The prompt is designed to:

1. Clearly define the task (modifying mermaid diagrams)
2. Set expectations for the response format (only the modified code)
3. Provide guidelines for making changes
4. Include examples to demonstrate the expected behavior

### System Prompt

```
You are a diagram modification assistant that helps users update mermaid.js diagrams based on natural language requests.

Your task is to modify the provided mermaid diagram code according to the user's request.

Guidelines:
1. Return ONLY the modified mermaid code, without any explanations, markdown formatting, or code blocks.
2. Ensure the modified code is valid mermaid syntax.
3. Preserve the existing structure and style of the diagram while making the requested changes.
4. If the request is unclear or cannot be implemented, return the original code unchanged.
5. Focus on making precise, targeted changes that fulfill the user's request.
```

### Prompt Structure

```mermaid
graph TD
    A[System Prompt] --> B[User Message]
    B --> C[Current Diagram Code]
    B --> D[User Request]
    
    style A fill:#f9f,stroke:#333,stroke-width:1px
    style B fill:#bbf,stroke:#333,stroke-width:1px
    style C fill:#bfb,stroke:#333,stroke-width:1px
    style D fill:#fbb,stroke:#333,stroke-width:1px
```

### Example Interaction

```mermaid
sequenceDiagram
    participant User
    participant System
    participant Claude
    
    User->>System: "Add an error handling node connected to Debug"
    
    System->>Claude: System Prompt + Current Diagram + User Request
    Note over System,Claude: System: "You are a diagram modification assistant..."
    Note over System,Claude: Current Diagram: "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B"
    Note over System,Claude: User Request: "Add an error handling node connected to Debug"
    
    Claude->>System: Modified Diagram
    Note over Claude,System: "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B\nD --> E[Error Handling]\nE --> B"
    
    System->>User: Renders updated diagram
```

## Error Handling

The AI integration includes several layers of error handling to ensure robustness:

```mermaid
flowchart TD
    A[User Request] --> B{API Validation}
    B -->|Invalid| C[Return 400 Bad Request]
    B -->|Valid| D{LangChain Processing}
    
    D -->|API Key Missing| E[Raise ValueError]
    D -->|API Error| F[Log Error and Return Original Code]
    D -->|Success| G{Response Validation}
    
    G -->|Empty/Invalid Response| H[Return Original Code]
    G -->|Valid Response| I[Return Modified Code]
    
    style A fill:#f9f,stroke:#333,stroke-width:1px
    style B,D,G fill:#bbf,stroke:#333,stroke-width:1px
    style C,E,F,H fill:#fbb,stroke:#333,stroke-width:1px
    style I fill:#bfb,stroke:#333,stroke-width:1px
```

### Error Handling Strategies

1. **API Validation**
   - Checks for required fields in the request
   - Validates that fields are not empty
   - Returns appropriate error messages

2. **LangChain Service Errors**
   - Checks for API key configuration
   - Handles exceptions from the Anthropic API
   - Logs errors for debugging

3. **Response Validation**
   - Basic validation of the returned code
   - Fallback to original code if response is invalid
   - Potential for more advanced validation in the future

## Future Enhancements

The AI integration can be enhanced in several ways:

```mermaid
mindmap
  root((AI Integration))
    Advanced Validation
      Mermaid syntax checker
      Structure preservation checks
      Semantic validation
    Model Improvements
      Fine-tuning for diagram tasks
      Specialized diagram models
      Multi-modal capabilities
    User Experience
      Explanation of changes
      Alternative suggestions
      Undo/redo specific AI changes
    Performance
      Caching common modifications
      Optimizing prompt size
      Batch processing for multiple changes
```

### Potential Enhancements

1. **Advanced Validation**
   - Implement a more robust mermaid syntax validator
   - Ensure structural integrity of the diagram
   - Validate that the changes match the user's request

2. **Model Improvements**
   - Explore fine-tuning models specifically for diagram tasks
   - Investigate specialized models for different diagram types
   - Add support for multi-modal inputs (e.g., sketches, images)

3. **User Experience**
   - Provide explanations of the changes made
   - Offer alternative suggestions for ambiguous requests
   - Allow users to undo/redo specific AI changes

4. **Performance Optimizations**
   - Cache common modification patterns
   - Optimize prompt size and structure
   - Implement batch processing for multiple changes
