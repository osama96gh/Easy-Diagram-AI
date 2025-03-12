import React, { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

interface TitleEditorProps {
  title: string;
  onTitleChange?: (title: string) => void;
}

/**
 * TitleEditor component for editing diagram titles
 */
const TitleEditor: React.FC<TitleEditorProps> = ({ title, onTitleChange }) => {
  const [isTitleEditable, setIsTitleEditable] = useState<boolean>(false);
  const [editableTitle, setEditableTitle] = useState<string>(title);

  /**
   * Handles changes to the diagram title in the input field
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTitle(e.target.value);
  };

  /**
   * Toggles title editing mode
   */
  const toggleTitleEdit = () => {
    if (isTitleEditable && onTitleChange) {
      // Save the title when exiting edit mode
      onTitleChange(editableTitle);
    }
    setIsTitleEditable(!isTitleEditable);
  };

  /**
   * Updates the editable title when the prop changes
   */
  useEffect(() => {
    setEditableTitle(title);
  }, [title]);

  return (
    <div className="title-input-container">
      <div className="title-input-wrapper">
        <input
          type="text"
          value={editableTitle}
          onChange={handleTitleChange}
          placeholder="Title: Enter diagram title..."
          className="diagram-title-input"
          aria-label="Diagram title"
          readOnly={!isTitleEditable}
        />
        <button 
          onClick={toggleTitleEdit} 
          className="title-edit-button"
          aria-label={isTitleEditable ? "Save title" : "Edit title"}
          title={isTitleEditable ? "Save title" : "Edit title"}
        >
          {isTitleEditable ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
        </button>
      </div>
    </div>
  );
};

export default TitleEditor;
