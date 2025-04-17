# Easy Diagram AI - Backend

This is the backend service for Easy Diagram AI, a tool for creating and modifying diagrams using AI.

## Project Overview

Easy Diagram AI allows users to:
- Create and edit diagrams with a user-friendly interface
- Organize diagrams in folders
- Modify diagrams using natural language through AI assistance

## Database Setup

This application uses Supabase as its database provider. The database schema needs to be set up manually through the Supabase dashboard.

### Initial Setup

1. Log in to your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project
3. Go to the SQL Editor section
4. Create a new query
5. Copy and paste the contents of the `supabase_tables.sql` file into the editor
6. Run the query

This will:
- Create the `folders` table with the required structure
- Create the `diagrams` table with the required structure
- Insert a root folder if one doesn't exist yet

### Applying Schema Changes

**Important**: Any changes to the database schema must be applied manually through the Supabase dashboard.

If the application's data model changes (e.g., new columns, tables, or relationships), you'll need to:

1. Update the SQL schema in `supabase_tables.sql`
2. Log in to your Supabase dashboard
3. Go to the SQL Editor
4. Create a new query with your schema changes
5. Run the query to apply the changes

The application does not currently support automatic schema migrations, so all schema changes must be applied manually.

## Schema Management

The repository includes a file `create_supabase_tables.py` which attempts to create the necessary tables programmatically. However, due to permissions limitations in the Supabase REST API, this script may encounter errors as it's unable to execute the table creation SQL directly.

Instead, use the `supabase_tables.sql` file with the Supabase SQL Editor as described in the Database Setup section.

## Environment Variables

Copy `.env.example` to `.env` and fill in the required variables:

```
# Anthropic API Key for Claude model
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5001

# CORS Configuration
CORS_ORIGINS=http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://localhost:5001,http://127.0.0.1:5001

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Running the Application

1. Install the dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the Flask application:
   ```
   python app.py
   ```

The server will start on the port specified in your `.env` file (default is 5001).

## API Endpoints

The backend provides several API endpoints for managing diagrams and folders:

- `/api/update-diagram` - Update a diagram using AI
- `/api/diagrams` - List all diagrams
- `/api/diagram` - Get the latest diagram or create a new one
- `/api/diagram/<id>` - Get, update, or delete a specific diagram
- `/api/folders` - Get the folder hierarchy
- `/api/folder` - Create a new folder
- `/api/folder/<id>` - Update or delete a specific folder
- `/api/folder/<id>/diagrams` - Get all diagrams in a folder
- `/api/diagram/<id>/move` - Move a diagram to a different folder
- `/api/health` - Health check endpoint
