"""
Database models for the Easy Diagram AI application.
Using Supabase as the backend.
"""
import os
from datetime import datetime
from supabase import create_client, Client

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

class Folder:
    """
    Model for folder operations.
    """
    
    @staticmethod
    def create(name, parent_id=None, is_root=False):
        """
        Create a new folder.
        """
        # Check if we're trying to create a root folder and one already exists
        if is_root:
            existing_root = supabase.table("folders").select("*").eq("is_root", True).execute()
            if existing_root.data and len(existing_root.data) > 0:
                raise ValueError("Only one root folder can exist in the system")

        # Create the folder
        result = supabase.table("folders").insert({
            "name": name,
            "parent_id": parent_id,
            "is_root": is_root,
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat()
        }).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def get(folder_id):
        """
        Get a folder by ID.
        """
        result = supabase.table("folders").select("*").eq("id", folder_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def get_root():
        """
        Get the root folder.
        """
        result = supabase.table("folders").select("*").eq("is_root", True).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def get_all():
        """
        Get all folders.
        """
        result = supabase.table("folders").select("*").execute()
        return result.data
    
    @staticmethod
    def get_children(parent_id):
        """
        Get all child folders of a parent folder.
        """
        result = supabase.table("folders").select("*").eq("parent_id", parent_id).execute()
        return result.data
    
    @staticmethod
    def update(folder_id, data):
        """
        Update a folder.
        """
        # Check if we're updating a root folder
        folder = Folder.get(folder_id)
        if folder and folder.get("is_root") and "parent_id" in data and data["parent_id"] is not None:
            raise ValueError("Root folder cannot have a parent")
            
        # Update the folder
        data["last_updated"] = datetime.utcnow().isoformat()
        result = supabase.table("folders").update(data).eq("id", folder_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def delete(folder_id):
        """
        Delete a folder.
        """
        # Check if we're deleting a root folder
        folder = Folder.get(folder_id)
        if folder and folder.get("is_root"):
            raise ValueError("Cannot delete the root folder")
            
        # Check if the folder has children
        children = Folder.get_children(folder_id)
        if children and len(children) > 0:
            raise ValueError("Cannot delete folder with subfolders. Delete subfolders first.")
            
        # Check if the folder contains diagrams
        diagrams = Diagram.get_by_folder(folder_id)
        if diagrams and len(diagrams) > 0:
            raise ValueError("Cannot delete folder containing diagrams. Move or delete diagrams first.")
            
        # Delete the folder
        result = supabase.table("folders").delete().eq("id", folder_id).execute()
        return result.data
    
    @staticmethod
    def to_dict(folder):
        """
        Convert the folder to a dictionary for JSON serialization.
        """
        if not folder:
            return None
            
        return {
            'id': folder.get('id'),
            'name': folder.get('name'),
            'parent_id': folder.get('parent_id'),
            'is_root': folder.get('is_root'),
            'created_at': folder.get('created_at'),
            'last_updated': folder.get('last_updated')
        }


class Diagram:
    """
    Model for diagram operations.
    """
    
    @staticmethod
    def create(content, name=None, folder_id=None):
        """
        Create a new diagram.
        """
        # If folder_id is not provided, use the root folder
        if folder_id is None:
            root_folder = Folder.get_root()
            if not root_folder:
                # Create a root folder if it doesn't exist
                root_folder = Folder.create("Root", None, True)
            folder_id = root_folder.get('id')
        
        # Create the diagram
        result = supabase.table("diagrams").insert({
            "content": content,
            "name": name,
            "folder_id": folder_id,
            "last_updated": datetime.utcnow().isoformat()
        }).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def get(diagram_id):
        """
        Get a diagram by ID.
        """
        result = supabase.table("diagrams").select("*").eq("id", diagram_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def get_all():
        """
        Get all diagrams.
        """
        result = supabase.table("diagrams").select("*").order("last_updated.desc").execute()
        return result.data
    
    @staticmethod
    def get_latest():
        """
        Get the latest diagram.
        """
        result = supabase.table("diagrams").select("*").order("last_updated.desc").limit(1).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def get_by_folder(folder_id):
        """
        Get all diagrams in a folder.
        """
        result = supabase.table("diagrams").select("*").eq("folder_id", folder_id).order("last_updated.desc").execute()
        return result.data
    
    @staticmethod
    def update(diagram_id, data):
        """
        Update a diagram.
        """
        data["last_updated"] = datetime.utcnow().isoformat()
        result = supabase.table("diagrams").update(data).eq("id", diagram_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    
    @staticmethod
    def delete(diagram_id):
        """
        Delete a diagram.
        """
        result = supabase.table("diagrams").delete().eq("id", diagram_id).execute()
        return result.data
    
    @staticmethod
    def to_dict(diagram):
        """
        Convert the diagram to a dictionary for JSON serialization.
        """
        if not diagram:
            return None
            
        return {
            'id': diagram.get('id'),
            'content': diagram.get('content'),
            'last_updated': diagram.get('last_updated'),
            'name': diagram.get('name'),
            'folder_id': diagram.get('folder_id')
        }

# Function to initialize database schema
def initialize_schema():
    """
    Creates the necessary tables in Supabase if they don't exist.
    Note: This function might require elevated permissions.
    It's recommended to create tables via the Supabase dashboard instead.
    """
    # Create the folders table
    try:
        # Check if the folders table exists
        supabase.table("folders").select("*").limit(1).execute()
    except Exception as e:
        print(f"Error checking folders table: {str(e)}")
        print("Please create the following tables in Supabase:")
        print("""
        -- Folders table
        create table folders (
          id bigint primary key generated by default as identity,
          name varchar(255) not null,
          parent_id bigint references folders(id),
          is_root boolean default false not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          last_updated timestamp with time zone default timezone('utc'::text, now()) not null
        );

        -- Diagrams table
        create table diagrams (
          id bigint primary key generated by default as identity,
          content text not null,
          last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
          name varchar(255),
          folder_id bigint not null references folders(id)
        );
        """)
        return False
    
    # Check if diagrams table exists
    try:
        supabase.table("diagrams").select("*").limit(1).execute()
    except Exception as e:
        print(f"Error checking diagrams table: {str(e)}")
        print("Please create the following table in Supabase:")
        print("""
        -- Diagrams table
        create table diagrams (
          id bigint primary key generated by default as identity,
          content text not null,
          last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
          name varchar(255),
          folder_id bigint not null references folders(id)
        );
        """)
        return False
    
    return True

# Function to ensure a root folder exists
def ensure_root_folder_exists():
    """
    Ensures that a root folder exists in the system.
    If no root folder exists, creates one.
    Returns the root folder.
    """
    root_folder = Folder.get_root()
    
    if not root_folder:
        # Create a root folder
        root_folder = Folder.create("Root", None, True)
        print("Created root folder with ID:", root_folder.get('id'))
    
    return root_folder

# Function to migrate existing diagrams to the root folder
def migrate_diagrams_to_root_folder(root_folder_id):
    """
    Migrates all diagrams with no folder to the root folder.
    """
    diagrams_without_folder = supabase.table("diagrams").select("*").is_("folder_id", "null").execute()
    
    if diagrams_without_folder.data and len(diagrams_without_folder.data) > 0:
        print(f"Migrating {len(diagrams_without_folder.data)} diagrams to root folder")
        for diagram in diagrams_without_folder.data:
            supabase.table("diagrams").update({"folder_id": root_folder_id}).eq("id", diagram.get('id')).execute()
        
        print("Migration complete")
