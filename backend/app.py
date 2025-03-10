"""
Flask server for the Diagmarm Builder application.
Provides API endpoints for AI-powered diagram modification and diagram persistence.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_service import process_diagram_request
from models import db, Diagram

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

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

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
            
        # Create a new diagram
        new_diagram = Diagram(content=content, name=name)
        
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


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return jsonify({"status": "ok", "message": "Diagmarm Builder API is running"})


if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", 5000))
    
    # Get debug mode from environment
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    
    # Run the Flask app
    app.run(host="0.0.0.0", port=port, debug=debug)
