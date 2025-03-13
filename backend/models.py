"""
Database models for the Easy Diagram AI application.
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event

# Initialize SQLAlchemy
db = SQLAlchemy()

class Folder(db.Model):
    """
    Model for storing folder information.
    """
    __tablename__ = 'folders'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    is_root = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = db.relationship('Folder', remote_side=[id], backref=db.backref('children', lazy='dynamic'))
    diagrams = db.relationship('Diagram', backref='folder', lazy='dynamic')
    
    def __repr__(self):
        return f"<Folder id={self.id}, name={self.name}, parent_id={self.parent_id}, is_root={self.is_root}>"
    
    def to_dict(self, include_children=False, include_diagrams=False):
        """
        Convert the folder to a dictionary for JSON serialization.
        """
        result = {
            'id': self.id,
            'name': self.name,
            'parent_id': self.parent_id,
            'is_root': self.is_root,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
        
        if include_children:
            result['children'] = [child.to_dict() for child in self.children]
            
        if include_diagrams:
            result['diagrams'] = [diagram.to_dict() for diagram in self.diagrams]
            
        return result

# Event listener to ensure only one root folder exists
@event.listens_for(Folder, 'before_insert')
def check_root_folder_before_insert(mapper, connection, folder):
    if folder.is_root:
        # Check if a root folder already exists
        root_count = connection.execute(
            db.select(db.func.count()).select_from(Folder).where(Folder.is_root == True)
        ).scalar()
        
        if root_count > 0:
            raise ValueError("Only one root folder can exist in the system")

# Event listener to prevent changing the root folder's parent
@event.listens_for(Folder, 'before_update')
def check_root_folder_before_update(mapper, connection, folder):
    if folder.is_root and folder.parent_id is not None:
        raise ValueError("Root folder cannot have a parent")

class Diagram(db.Model):
    """
    Model for storing diagram information.
    """
    __tablename__ = 'diagrams'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    name = db.Column(db.String(255), nullable=True)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=False)
    
    def __repr__(self):
        return f"<Diagram id={self.id}, name={self.name}, last_updated={self.last_updated}>"
    
    def to_dict(self):
        """
        Convert the diagram to a dictionary for JSON serialization.
        """
        return {
            'id': self.id,
            'content': self.content,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'name': self.name,
            'folder_id': self.folder_id
        }
