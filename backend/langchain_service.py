"""
LangChain service for processing mermaid diagram modification requests using Anthropic Claude.
"""
import os
from typing import Dict, Any
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# System prompt for diagram modification
SYSTEM_PROMPT = """
You are a diagram modification assistant that helps users update mermaid.js diagrams based on natural language requests.

Your task is to modify the provided mermaid diagram code according to the user's request.

Guidelines:
1. Return ONLY the modified mermaid code, without any explanations, markdown formatting, or code blocks.
2. Ensure the modified code is valid mermaid syntax.
3. Preserve the existing structure and style of the diagram while making the requested changes.
4. If the request is unclear or cannot be implemented, return the original code unchanged.
5. Focus on making precise, targeted changes that fulfill the user's request.

Example:
If the user provides:
```
graph TD
A[Start] --> B{Is it working?}
B -->|Yes| C[Great!]
B -->|No| D[Debug]
```

And requests: "Add a node for error handling connected to Debug"

You should return:
```
graph TD
A[Start] --> B{Is it working?}
B -->|Yes| C[Great!]
B -->|No| D[Debug]
D --> E[Error Handling]
```
"""


def create_llm_client() -> ChatAnthropic:
    """
    Create and configure the Anthropic Claude client.
    
    Returns:
        ChatAnthropic: Configured LangChain Anthropic client
    """
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
    
    # Create and configure the model
    llm = ChatAnthropic(
        model="claude-3-7-sonnet-latest",
        temperature=0.2,
        anthropic_api_key=ANTHROPIC_API_KEY
    )
    
    return llm


def process_diagram_request(current_code: str, user_request: str) -> str:
    """
    Process a diagram modification request using LangChain and Anthropic.
    
    Args:
        current_code (str): The current mermaid diagram code
        user_request (str): The user's natural language request
        
    Returns:
        str: The updated mermaid diagram code
    """
    try:
        # Create LLM client
        llm = create_llm_client()
        
        # Prepare messages
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Here is my current diagram code:\n\n{current_code}\n\nRequest: {user_request}")
        ]
        
        # Get response from the model
        response = llm.invoke(messages)
        
        # Extract the updated code from the response
        updated_code = response.content.strip()
        
        # If the response is empty or seems invalid, return the original code
        if not updated_code or len(updated_code) < 10:  # Basic validation
            return current_code
            
        return updated_code
        
    except Exception as e:
        # Log the error (in a production environment, use proper logging)
        print(f"Error processing diagram request: {str(e)}")
        # Return the original code in case of error
        return current_code


def validate_mermaid_code(code: str) -> bool:
    """
    Basic validation of mermaid code.
    
    Args:
        code (str): The mermaid code to validate
        
    Returns:
        bool: True if the code appears to be valid mermaid syntax, False otherwise
    """
    # This is a very basic validation - in a production environment,
    # you might want to use a more sophisticated approach
    
    # Check if the code starts with a valid mermaid diagram type
    valid_starts = [
        "graph", "flowchart", "sequenceDiagram", "classDiagram",
        "stateDiagram", "erDiagram", "journey", "gantt", "pie"
    ]
    
    code_lines = code.strip().split('\n')
    if not code_lines:
        return False
    
    first_line = code_lines[0].strip()
    
    for start in valid_starts:
        if first_line.startswith(start):
            return True
            
    return False
