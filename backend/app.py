"""
Flask server for the Diagmarm Builder application.
Provides API endpoints for AI-powered diagram modification.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_service import process_diagram_request

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000")
CORS(app, resources={r"/api/*": {"origins": cors_origins.split(",")}})

@app.route("/api/update-diagram", methods=["POST"])
def update_diagram():
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
