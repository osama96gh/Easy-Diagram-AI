# Diagmarm Builder Backend Documentation

Welcome to the Diagmarm Builder backend documentation. This documentation provides comprehensive information about the backend system, including its architecture, API endpoints, database schema, and AI integration.

## Table of Contents

### 1. [Backend System Documentation](backend_system_documentation.md)
   - System overview
   - Architecture
   - Database schema
   - API endpoints
   - AI-powered diagram modification
   - Folder and diagram management
   - Environment configuration
   - Deployment options

### 2. [API Documentation](api_documentation.md)
   - Authentication
   - Diagram endpoints
   - Folder endpoints
   - System endpoints
   - Error handling
   - Request/response examples

### 3. [AI Integration](ai_integration.md)
   - Overview of AI capabilities
   - Architecture
   - Implementation details
   - Prompt engineering
   - Error handling
   - Future enhancements

### 4. [Database Schema](database_schema.md)
   - Overview
   - Entity relationship diagram
   - Tables
   - Relationships
   - Constraints
   - Indexes
   - Data flow

## Diagrams

The documentation includes various diagrams to help visualize the system:

```mermaid
graph TD
    A[Documentation] --> B[System Overview]
    A --> C[API Reference]
    A --> D[AI Integration]
    A --> E[Database Schema]
    
    B --> B1[Architecture Diagrams]
    B --> B2[Component Diagrams]
    B --> B3[Deployment Diagrams]
    
    C --> C1[Endpoint Diagrams]
    C --> C2[Request/Response Flow]
    C --> C3[Error Handling]
    
    D --> D1[AI Architecture]
    D --> D2[Prompt Engineering]
    D --> D3[Process Flow]
    
    E --> E1[ER Diagrams]
    E --> E2[Table Relationships]
    E --> E3[Data Flow Diagrams]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B,C,D,E fill:#bbf,stroke:#333,stroke-width:1px
    style B1,B2,B3,C1,C2,C3,D1,D2,D3,E1,E2,E3 fill:#bfb,stroke:#333,stroke-width:1px
```

## Getting Started

To get started with the Diagmarm Builder backend:

1. Review the [Backend System Documentation](backend_system_documentation.md) for an overview of the system
2. Explore the [API Documentation](api_documentation.md) to understand available endpoints
3. Learn about the AI integration in [AI Integration](ai_integration.md)
4. Understand the data model in [Database Schema](database_schema.md)

## Development

For development purposes:

1. Set up the environment variables as described in the [Backend System Documentation](backend_system_documentation.md#environment-configuration)
2. Install dependencies with `pip install -r requirements.txt`
3. Run the development server with `python app.py`

## Deployment

For deployment options, refer to the [Deployment](backend_system_documentation.md#deployment) section in the Backend System Documentation.
