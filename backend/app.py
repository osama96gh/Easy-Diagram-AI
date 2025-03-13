"""
Flask server for the Easy Diagram AI application.
Provides API endpoints for AI-powered diagram modification and diagram persistence.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_service import process_diagram_request
from models import db, Diagram, Folder

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URI", "sqlite:///diagrams.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000")
CORS(app, resources={r"/api/*": {"origins": cors_origins.split(",")}})

# Function to ensure a root folder exists
def ensure_root_folder_exists():
    """
    Ensures that a root folder exists in the system.
    If no root folder exists, creates one.
    Returns the root folder.
    """
    root_folder = Folder.query.filter_by(is_root=True).first()
    
    if not root_folder:
        # Create a root folder
        root_folder = Folder(
            name="Root",
            parent_id=None,
            is_root=True
        )
        db.session.add(root_folder)
        db.session.commit()
        print("Created root folder with ID:", root_folder.id)
    
    return root_folder

# Function to migrate existing diagrams to the root folder
def migrate_diagrams_to_root_folder(root_folder_id):
    """
    Migrates all diagrams with no folder to the root folder.
    """
    diagrams_without_folder = Diagram.query.filter_by(folder_id=None).all()
    
    if diagrams_without_folder:
        print(f"Migrating {len(diagrams_without_folder)} diagrams to root folder")
        for diagram in diagrams_without_folder:
            diagram.folder_id = root_folder_id
        
        db.session.commit()
        print("Migration complete")

# Create database tables if they don't exist and initialize system
with app.app_context():
    db.create_all()
    
    # Ensure root folder exists
    root_folder = ensure_root_folder_exists()
    
    # Migrate existing diagrams to root folder
    migrate_diagrams_to_root_folder(root_folder.id)

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
        diagrams = Diagram.query.order_by(Diagram.last_updated.desc()).all()
        
        # Return a simplified version with just id, name, and last_updated
        result = [
            {
                "id": diagram.id,
                "name": diagram.name or f"Untitled Diagram {diagram.id}",
                "last_updated": diagram.last_updated.isoformat() if diagram.last_updated else None
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
        latest_diagram = Diagram.query.order_by(Diagram.last_updated.desc()).first()
        
        if latest_diagram:
            return jsonify(latest_diagram.to_dict())
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
            
        # If folder_id is not provided, use the root folder
        if folder_id is None:
            root_folder = Folder.query.filter_by(is_root=True).first()
            if not root_folder:
                # This should not happen as we ensure a root folder exists at startup
                root_folder = ensure_root_folder_exists()
            folder_id = root_folder.id
        else:
            # Verify the folder exists
            folder = Folder.query.get(folder_id)
            if not folder:
                return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
            
        # Create a new diagram
        new_diagram = Diagram(content=content, name=name, folder_id=folder_id)
        
        # Save to database
        db.session.add(new_diagram)
        db.session.commit()
        
        # Return the saved diagram
        return jsonify(new_diagram.to_dict())
        
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
        diagram = Diagram.query.get(diagram_id)
        
        if not diagram:
            return jsonify({"error": f"Diagram with id {diagram_id} not found"}), 404
            
        return jsonify(diagram.to_dict())
            
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
        diagram = Diagram.query.get(diagram_id)
        
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
        diagram.content = content
        if name:
            diagram.name = name
            
        # Save changes to database
        db.session.commit()
        
        # Return the updated diagram
        return jsonify(diagram.to_dict())
        
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
        diagram = Diagram.query.get(diagram_id)
        
        if not diagram:
            return jsonify({"error": f"Diagram with id {diagram_id} not found"}), 404
            
        # Delete the diagram
        db.session.delete(diagram)
        db.session.commit()
        
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
        root_folder = Folder.query.filter_by(is_root=True).first()
        
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
        'id': folder.id,
        'name': folder.name,
        'parent_id': folder.parent_id,
        'is_root': folder.is_root,
        'created_at': folder.created_at.isoformat() if folder.created_at else None,
        'last_updated': folder.last_updated.isoformat() if folder.last_updated else None,
        'children': []
    }
    
    # Get all direct children
    children = Folder.query.filter_by(parent_id=folder.id).all()
    
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
            parent_folder = Folder.query.get(parent_id)
            if not parent_folder:
                return jsonify({"error": f"Parent folder with id {parent_id} not found"}), 404
                
        # Create a new folder
        new_folder = Folder(name=name, parent_id=parent_id, is_root=is_root)
        
        # Save to database
        db.session.add(new_folder)
        db.session.commit()
        
        # Return the saved folder
        return jsonify(new_folder.to_dict())
    except ValueError as e:
        # Handle the specific error from the event listener
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
        folder = Folder.query.get(folder_id)
        
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
            
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data:
            return jsonify({"error": "Invalid request. No data provided."}), 400
            
        # Update the folder
        if "name" in data and data["name"]:
            folder.name = data["name"]
            
        if "parent_id" in data:
            # Root folders cannot have a parent
            if folder.is_root and data["parent_id"] is not None:
                return jsonify({"error": "Root folder cannot have a parent"}), 400
                
            # Prevent circular references
            if data["parent_id"] == folder_id:
                return jsonify({"error": "A folder cannot be its own parent"}), 400
                
            # Check if the new parent exists
            if data["parent_id"] is not None:
                parent_folder = Folder.query.get(data["parent_id"])
                if not parent_folder:
                    return jsonify({"error": f"Parent folder with id {data['parent_id']} not found"}), 404
                    
            folder.parent_id = data["parent_id"]
            
        # Save changes to database
        db.session.commit()
        
        # Return the updated folder
        return jsonify(folder.to_dict())
    except ValueError as e:
        # Handle the specific error from the event listener
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
        folder = Folder.query.get(folder_id)
        
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
            
        # Cannot delete the root folder
        if folder.is_root:
            return jsonify({"error": "Cannot delete the root folder"}), 400
            
        # Check if the folder has children
        children = Folder.query.filter_by(parent_id=folder_id).all()
        if children:
            return jsonify({"error": "Cannot delete folder with subfolders. Delete subfolders first."}), 400
            
        # Check if the folder contains diagrams
        diagrams = Diagram.query.filter_by(folder_id=folder_id).all()
        if diagrams:
            return jsonify({"error": "Cannot delete folder containing diagrams. Move or delete diagrams first."}), 400
            
        # Delete the folder
        db.session.delete(folder)
        db.session.commit()
        
        # Return success response
        return jsonify({
            "success": True,
            "message": f"Folder with id {folder_id} deleted successfully"
        })
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
        folder = Folder.query.get(folder_id)
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
                
        # Get diagrams in the folder
        diagrams = Diagram.query.filter_by(folder_id=folder_id).order_by(Diagram.last_updated.desc()).all()
        
        # Return a simplified version with just id, name, last_updated, and folder_id
        result = [
            {
                "id": diagram.id,
                "name": diagram.name or f"Untitled Diagram {diagram.id}",
                "last_updated": diagram.last_updated.isoformat() if diagram.last_updated else None,
                "folder_id": diagram.folder_id
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
        diagram = Diagram.query.get(diagram_id)
        
        if not diagram:
            return jsonify({"error": f"Diagram with id {diagram_id} not found"}), 404
            
        # Get request data
        data = request.get_json()
        
        # Validate request data
        if not data or "folder_id" not in data:
            return jsonify({"error": "Invalid request. Missing required fields."}), 400
            
        folder_id = data["folder_id"]
        
        # Check if the folder exists
        folder = Folder.query.get(folder_id)
        if not folder:
            return jsonify({"error": f"Folder with id {folder_id} not found"}), 404
                
        # Update the diagram's folder
        diagram.folder_id = folder_id
        
        # Save changes to database
        db.session.commit()
        
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
