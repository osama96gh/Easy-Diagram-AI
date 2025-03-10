"""
Database models for the Diagmarm Builder application.
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()

class Diagram(db.Model):
    """
    Model for storing diagram information.
    """
    __tablename__ = 'diagrams'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    name = db.Column(db.String(255), nullable=True)
    
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
            'name': self.name
        }
