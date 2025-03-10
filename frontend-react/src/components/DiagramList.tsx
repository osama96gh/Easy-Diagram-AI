import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { usePanelContext } from '../contexts/PanelContext';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';

interface DiagramListProps {
  onSelectDiagram: (diagramId: number) => void;
  onCreateDiagram?: () => void;
  currentDiagramId: number | null;
  panelId: string;
  refreshTrigger?: number; // A value that changes to trigger a refresh
}

interface DiagramItem {
  id: number;
  name: string;
  last_updated: string;
}

const DiagramList: React.FC<DiagramListProps> = ({ 
  onSelectDiagram, 
  onCreateDiagram, 
  currentDiagramId, 
  panelId,
  refreshTrigger = 0 
}) => {
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getPanelStyle, isPanelExpanded, togglePanelExpansion } = usePanelContext();
  
  // Function to fetch diagrams
  const fetchDiagrams = async () => {
    try {
      setIsLoading(true);
      const diagramsList = await apiService.getAllDiagrams();
      setDiagrams(diagramsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching diagrams:', err);
      setError('Failed to load diagrams');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch diagrams when component mounts or refreshTrigger changes
  useEffect(() => {
    fetchDiagrams();
    
    // Set up interval to refresh the list periodically
    const intervalId = setInterval(fetchDiagrams, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshTrigger]); // Re-run when refreshTrigger changes
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const isExpanded = isPanelExpanded(panelId);
  
  return (
    <div className={`diagram-list-panel ${isExpanded ? '' : 'collapsed'}`} style={getPanelStyle(panelId)}>
      <div className="diagram-list-panel-header">
        <h2>Saved Diagrams</h2>
        <div className="diagram-list-panel-controls">
          {isExpanded && onCreateDiagram && (
            <button
              className="new-diagram-button"
              onClick={onCreateDiagram}
              aria-label="Create new diagram"
              title="Create new diagram"
            >
              <AddIcon />
            </button>
          )}
          <button 
            className="toggle-arrow" 
            onClick={() => togglePanelExpansion(panelId)}
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            {isExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="diagram-list-content">
          {isLoading ? (
            <div className="loading-indicator">Loading diagrams...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : diagrams.length === 0 ? (
            <div className="empty-list-message">No saved diagrams found</div>
          ) : (
            <ul className="diagrams-list">
              {diagrams.map((diagram) => (
                <li 
                  key={diagram.id} 
                  className={`diagram-item ${currentDiagramId === diagram.id ? 'selected' : ''}`}
                  onClick={() => onSelectDiagram(diagram.id)}
                >
                  <div className="diagram-item-name">
                    {diagram.name || `Untitled Diagram ${diagram.id}`}
                  </div>
                  <div className="diagram-item-date">
                    {formatDate(diagram.last_updated)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagramList;
