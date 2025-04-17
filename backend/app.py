"""
Flask server for the Easy Diagram AI application.
Provides API endpoints for AI-powered diagram modification and diagram persistence.
Using Supabase as the backend database.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_service import process_diagram_request
from models import Folder, Diagram, initialize_schema, ensure_root_folder_exists, migrate_diagrams_to_root_folder

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000")
CORS(app, resources={r"/api/*": {"origins": cors_origins.split(",")}})

# Create database tables if they don't exist and initialize system
with app.app_context():
    # Initialize database schema
    initialize_schema()
    
    # Ensure root folder exists
    root_folder = ensure_root_folder_exists()
    
    # Migrate existing diagrams to root folder
    if root_folder:
        migrate_diagrams_to_root_folder(root_folder.get('id'))

@app.route("/api/update-diagram", methods=["POST"])
def update_diagram_with_ai():
    """
    API endpoint to update a mermaid diagram based on a natural language request.
    
    Expected request body:
    {
        "current_code": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
        "user_request": "Add a new node for error handling"
    }
    
    Returns:
    {
        "updated_code": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B\nD --> E[Error Handling]\nE --> B"
    }
    
    Or in case of error:
    {
        "error": "Failed to process request"
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data or "current_code" not in data or "user_request" not in data:
            return jsonify({"error": "Invalid request. Missing required fields."}), 400
            
        current_code = data["current_code"]
        user_request = data["user_request"]
        
        # Basic validation
        if not current_code or not user_request:
            return jsonify({"error": "Invalid request. Empty fields."}), 400
            
        # Process the request using LangChain service
        updated_code = process_diagram_request(current_code, user_request)
        
        # Return the updated code
        return jsonify({"updated_code": updated_code})
        
    except Exception as e:
        # Log the error (in a production environment, use proper logging)
        print(f"Error processing request: {str(e)}")
        return jsonify({"error": "Failed to process request"}), 500


@app.route("/api/diagrams", methods=["GET"])
def get_all_diagrams():
    """
    API endpoint to retrieve all diagrams.
    
    Returns:
    [
        {
            "id": 1,
            "name": "Diagram 1",
            "last_updated": "2023-10-03T12:34:56"
        },
        ...
    ]
    """
    try:
        # Get all diagrams from the database, ordered by last updated
        diagrams = Diagram.get_all()
        
        # Return a simplified version with just id, name, and last_updated
        result = [
            {
                "id": diagram.get('id'),
                "name": diagram.get('name') or f"Untitled Diagram {diagram.get('id')}",
                "last_updated": diagram.get('last_updated')
            }
            for diagram in diagrams
        ]
        
        return jsonify(result)
            
    except Exception as e:
        print(f"Error retrieving diagrams: {str(e)}")
        return jsonify({"error": "Failed to retrieve diagrams"}), 500


@app.route("/api/diagram", methods=["GET"])
def get_diagram():
    """
    API endpoint to retrieve the latest diagram.
    
    Returns:
    {
        "id": 1,
        "content": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
        "last_updated": "2023-10-03T12:34:56",
        "name": null
    }
    
    Or in case no diagrams exist:
    {
        "content": null
    }
    """
    try:
        # Get the latest diagram from the database
        latest_diagram = Diagram.get_latest()
        
        if latest_diagram:
            return jsonify(Diagram.to_dict(latest_diagram))
        else:
            return jsonify({"content": None})
            
    except Exception as e:
        print(f"Error retrieving diagram: {str(e)}")
        return jsonify({"error": "Failed to retrieve diagram"}), 500


@app.route("/api/diagram", methods=["POST"])
def create_diagram():
    """
    API endpoint to create a new diagram in the database.
    
    Expected request body:
    {
        "content": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
        "name": "My Diagram" (optional),
        "folder_id": 1 (optional, defaults to root folder)
    }
    
    Returns:
    {
        "id": 1,
        "content": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
        "last_updated": "2023-10-03T12:34:56",
        "name": "My Diagram",
        "folder_id": 1
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data or "content" not in data:
            return jsonify({"error": "Invalid request. Missing required fields."}), 400
            
        content = data["content"]
        name = data.get("name")
        folder_id = data.get("folder_id")
        
        # Basic validation
        if not content:
            return jsonify({"error": "Invalid request. Empty content."}), 400
            
        # If folder_id is provided, verify the folder exists
        if folder_id:
            folder = Folder.get(folder_id)
            if not folder:
                return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
            
        # Create a new diagram
        new_diagram = Diagram.create(content, name, folder_id)
        
        # Return the saved diagram
        return jsonify(Diagram.to_dict(new_diagram))
        
    except Exception as e:
        print(f"Error creating diagram: {str(e)}")
        return jsonify({"error": "Failed to create diagram"}), 500


@app.route("/api/diagram/<int:diagram_id>", methods=["GET"])
def get_diagram_by_id(diagram_id):
    """
    API endpoint to retrieve a specific diagram by ID.
    
    Returns:
    {
        "id": 1,
        "content": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
        "last_updated": "2023-10-03T12:34:56",
        "name": "My Diagram"
    }
    """
    try:
        # Get the diagram from the database
        diagram = Diagram.get(diagram_id)
        
        if not diagram:
            return jsonify({"error": f"Diagram with id {diagram_id} not found"}), 404
            
        return jsonify(Diagram.to_dict(diagram))
            
    except Exception as e:
        print(f"Error retrieving diagram: {str(e)}")
        return jsonify({"error": "Failed to retrieve diagram"}), 500


@app.route("/api/diagram/<int:diagram_id>", methods=["PUT"])
def update_diagram(diagram_id):
    """
    API endpoint to update an existing diagram in the database.
    
    Expected request body:
    {
        "content": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
        "name": "My Diagram" (optional)
    }
    
    Returns:
    {
        "id": 1,
        "content": "graph TD\nA[Start] --> B{Is it working?}\nB -->|Yes| C[Great!]\nB -->|No| D[Debug]\nD --> B",
        "last_updated": "2023-10-03T12:34:56",
        "name": "My Diagram"
    }
    """
    try:
        # Get the diagram from the database
        diagram = Diagram.get(diagram_id)
        
        if not diagram:
            return jsonify({"error": f"Diagram with id {diagram_id} not found"}), 404
            
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data or "content" not in data:
            return jsonify({"error": "Invalid request. Missing required fields."}), 400
            
        content = data["content"]
        name = data.get("name")
        
        # Basic validation
        if not content:
            return jsonify({"error": "Invalid request. Empty content."}), 400
            
        # Update the diagram
        update_data = {"content": content}
        if name:
            update_data["name"] = name
            
        updated_diagram = Diagram.update(diagram_id, update_data)
        
        # Return the updated diagram
        return jsonify(Diagram.to_dict(updated_diagram))
        
    except Exception as e:
        print(f"Error updating diagram: {str(e)}")
        return jsonify({"error": "Failed to update diagram"}), 500


@app.route("/api/diagram/<int:diagram_id>", methods=["DELETE"])
def delete_diagram(diagram_id):
    """
    API endpoint to delete an existing diagram from the database.
    
    Returns:
    {
        "success": true,
        "message": "Diagram deleted successfully"
    }
    
    Or in case of error:
    {
        "error": "Failed to delete diagram"
    }
    """
    try:
        # Get the diagram from the database
        diagram = Diagram.get(diagram_id)
        
        if not diagram:
            return jsonify({"error": f"Diagram with id {diagram_id} not found"}), 404
            
        # Delete the diagram
        Diagram.delete(diagram_id)
        
        # Return success response
        return jsonify({
            "success": True,
            "message": f"Diagram with id {diagram_id} deleted successfully"
        })
        
    except Exception as e:
        print(f"Error deleting diagram: {str(e)}")
        return jsonify({"error": "Failed to delete diagram"}), 500


# Folder API Endpoints

@app.route("/api/folders", methods=["GET"])
def get_folders():
    """
    API endpoint to retrieve the folder hierarchy.
    
    Returns:
    [
        {
            "id": 1,
            "name": "Root",
            "parent_id": null,
            "is_root": true,
            "children": [
                {
                    "id": 2,
                    "name": "Subfolder 1",
                    "parent_id": 1,
                    "is_root": false,
                    "children": []
                }
            ]
        }
    ]
    """
    try:
        # Get the root folder
        root_folder = Folder.get_root()
        
        if not root_folder:
            # This should not happen as we ensure a root folder exists at startup
            root_folder = ensure_root_folder_exists()
        
        # Build the hierarchy recursively
        result = [build_folder_hierarchy(root_folder)]
        
        return jsonify(result)
    except Exception as e:
        print(f"Error retrieving folders: {str(e)}")
        return jsonify({"error": "Failed to retrieve folders"}), 500

def build_folder_hierarchy(folder):
    """
    Helper function to build a folder hierarchy recursively.
    """
    folder_dict = {
        'id': folder.get('id'),
        'name': folder.get('name'),
        'parent_id': folder.get('parent_id'),
        'is_root': folder.get('is_root'),
        'created_at': folder.get('created_at'),
        'last_updated': folder.get('last_updated'),
        'children': []
    }
    
    # Get all direct children
    children = Folder.get_children(folder.get('id'))
    
    # Recursively build hierarchy for each child
    for child in children:
        child_dict = build_folder_hierarchy(child)
        folder_dict['children'].append(child_dict)
    
    return folder_dict

@app.route("/api/folder", methods=["POST"])
def create_folder():
    """
    API endpoint to create a new folder.
    
    Expected request body:
    {
        "name": "New Folder",
        "parent_id": 1 (required, except for root folder)
    }
    
    Returns:
    {
        "id": 3,
        "name": "New Folder",
        "parent_id": 1,
        "is_root": false,
        "created_at": "2023-10-03T12:34:56",
        "last_updated": "2023-10-03T12:34:56"
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data or "name" not in data:
            return jsonify({"error": "Invalid request. Missing required fields."}), 400
            
        name = data["name"]
        parent_id = data.get("parent_id")
        is_root = data.get("is_root", False)
        
        # Basic validation
        if not name:
            return jsonify({"error": "Invalid request. Empty name."}), 400
            
        # Non-root folders must have a parent
        if not is_root and parent_id is None:
            return jsonify({"error": "Non-root folders must have a parent folder."}), 400
            
        # If parent_id is provided, check if the parent folder exists
        if parent_id is not None:
            parent_folder = Folder.get(parent_id)
            if not parent_folder:
                return jsonify({"error": f"Parent folder with id {parent_id} not found"}), 404
                
        # Create a new folder
        new_folder = Folder.create(name, parent_id, is_root)
        
        # Return the saved folder
        return jsonify(Folder.to_dict(new_folder))
    except ValueError as e:
        # Handle the specific error from the model
        print(f"Error creating folder: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error creating folder: {str(e)}")
        return jsonify({"error": "Failed to create folder"}), 500

@app.route("/api/folder/<int:folder_id>", methods=["PUT"])
def update_folder(folder_id):
    """
    API endpoint to update an existing folder.
    
    Expected request body:
    {
        "name": "Updated Folder Name",
        "parent_id": 2 (optional, not applicable for root folder)
    }
    
    Returns:
    {
        "id": 1,
        "name": "Updated Folder Name",
        "parent_id": 2,
        "is_root": false,
        "created_at": "2023-10-03T12:34:56",
        "last_updated": "2023-10-03T12:34:56"
    }
    """
    try:
        # Get the folder from the database
        folder = Folder.get(folder_id)
        
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
            
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data:
            return jsonify({"error": "Invalid request. No data provided."}), 400
            
        # Create an update data dictionary
        update_data = {}
        
        # Update the folder name if provided
        if "name" in data and data["name"]:
            update_data["name"] = data["name"]
            
        # Update the parent_id if provided
        if "parent_id" in data:
            # Root folders cannot have a parent
            if folder.get("is_root") and data["parent_id"] is not None:
                return jsonify({"error": "Root folder cannot have a parent"}), 400
                
            # Prevent circular references
            if data["parent_id"] == folder_id:
                return jsonify({"error": "A folder cannot be its own parent"}), 400
                
            # Check if the new parent exists
            if data["parent_id"] is not None:
                parent_folder = Folder.get(data["parent_id"])
                if not parent_folder:
                    return jsonify({"error": f"Parent folder with id {data['parent_id']} not found"}), 404
                    
            update_data["parent_id"] = data["parent_id"]
            
        # Update the folder
        updated_folder = Folder.update(folder_id, update_data)
        
        # Return the updated folder
        return jsonify(Folder.to_dict(updated_folder))
    except ValueError as e:
        # Handle the specific error from the model
        print(f"Error updating folder: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error updating folder: {str(e)}")
        return jsonify({"error": "Failed to update folder"}), 500

@app.route("/api/folder/<int:folder_id>", methods=["DELETE"])
def delete_folder(folder_id):
    """
    API endpoint to delete an existing folder.
    
    Returns:
    {
        "success": true,
        "message": "Folder deleted successfully"
    }
    """
    try:
        # Get the folder from the database
        folder = Folder.get(folder_id)
        
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
            
        # Delete the folder (the model handles validation)
        Folder.delete(folder_id)
        
        # Return success response
        return jsonify({
            "success": True,
            "message": f"Folder with id {folder_id} deleted successfully"
        })
    except ValueError as e:
        # Handle the specific error from the model
        print(f"Error deleting folder: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error deleting folder: {str(e)}")
        return jsonify({"error": "Failed to delete folder"}), 500

@app.route("/api/folder/<int:folder_id>/diagrams", methods=["GET"])
def get_diagrams_in_folder(folder_id):
    """
    API endpoint to retrieve all diagrams in a specific folder.
    
    Returns:
    [
        {
            "id": 1,
            "name": "Diagram 1",
            "last_updated": "2023-10-03T12:34:56",
            "folder_id": 1
        },
        ...
    ]
    """
    try:
        # Check if folder exists
        folder = Folder.get(folder_id)
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
                
        # Get diagrams in the folder
        diagrams = Diagram.get_by_folder(folder_id)
        
        # Return a simplified version with just id, name, last_updated, and folder_id
        result = [
            {
                "id": diagram.get('id'),
                "name": diagram.get('name') or f"Untitled Diagram {diagram.get('id')}",
                "last_updated": diagram.get('last_updated'),
                "folder_id": diagram.get('folder_id')
            }
            for diagram in diagrams
        ]
        
        return jsonify(result)
    except Exception as e:
        print(f"Error retrieving diagrams: {str(e)}")
        return jsonify({"error": "Failed to retrieve diagrams"}), 500

@app.route("/api/diagram/<int:diagram_id>/move", methods=["PUT"])
def move_diagram(diagram_id):
    """
    API endpoint to move a diagram to a different folder.
    
    Expected request body:
    {
        "folder_id": 1
    }
    
    Returns:
    {
        "success": true,
        "message": "Diagram moved successfully"
    }
    """
    try:
        # Get the diagram from the database
        diagram = Diagram.get(diagram_id)
        
        if not diagram:
            return jsonify({"error": f"Diagram with id {diagram_id} not found"}), 404
            
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data or "folder_id" not in data:
            return jsonify({"error": "Invalid request. Missing required fields."}), 400
            
        folder_id = data["folder_id"]
        
        # Check if the folder exists
        folder = Folder.get(folder_id)
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
                
        # Update the diagram's folder
        Diagram.update(diagram_id, {"folder_id": folder_id})
        
        # Return success response
        return jsonify({
            "success": True,
            "message": f"Diagram with id {diagram_id} moved successfully"
        })
    except Exception as e:
        print(f"Error moving diagram: {str(e)}")
        return jsonify({"error": "Failed to move diagram"}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return jsonify({"status": "ok", "message": "Easy Diagram AI API is running"})


if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", 5000))
    
    # Get debug mode from environment
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    
    # Run the Flask app
    app.run(host="0.0.0.0", port=port, debug=debug)
