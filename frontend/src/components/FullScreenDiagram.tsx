import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mermaid from 'mermaid';
import { apiService } from '../services/api';
import './FullScreenDiagram.css';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Constants for zoom and pan
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

/**
 * FullScreenDiagram component for rendering a diagram in full screen mode
 */
const FullScreenDiagram: React.FC = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState<{ content: string; name: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for zoom and pan
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  
  const diagramRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load diagram data
  useEffect(() => {
    const fetchDiagram = async () => {
      try {
        if (!diagramId) {
          setError('No diagram ID provided');
          setLoading(false);
          return;
        }
        
        const id = parseInt(diagramId, 10);
        if (isNaN(id)) {
          setError('Invalid diagram ID');
          setLoading(false);
          return;
        }
        
        const diagramData = await apiService.getDiagram(id);
        setDiagram({
          content: diagramData.content,
          name: diagramData.name
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load diagram');
        setLoading(false);
      }
    };
    
    fetchDiagram();
  }, [diagramId]);
  
  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      logLevel: 'error',
      fontFamily: 'monospace',
      flowchart: {
        htmlLabels: true,
        curve: 'linear'
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65
      },
      gantt: {
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        leftPadding: 75
      }
    });
  }, []);
  
  // Render diagram when data is loaded
  useEffect(() => {
    if (!diagram || !diagramRef.current) return;
    
    const renderDiagram = async () => {
      if (!diagramRef.current) return;
      
      try {
        // Clear previous content and error
        diagramRef.current.innerHTML = '';
        setError(null);
        
        // Generate a unique ID for this render
        const id = `full-screen-diagram-${Date.now()}`;
        
        // Create the SVG using mermaid's render method
        const { svg } = await mermaid.render(id, diagram.content);
        
        // Insert the SVG into the output element
        diagramRef.current.innerHTML = svg;
        
        // Make SVG responsive
        const svgElement = diagramRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.maxWidth = '100%';
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        console.error('Mermaid rendering error:', err);
      }
    };
    
    renderDiagram();
  }, [diagram]);
  
  // Handle zoom in
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + ZOOM_STEP, ZOOM_MAX));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - ZOOM_STEP, ZOOM_MIN));
  };

  // Handle reset view
  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle exit full screen
  const handleExitFullScreen = () => {
    navigate('/');
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale(prevScale => {
      const newScale = prevScale + delta;
      return Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);
    });
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave to end dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse up globally
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);
  
  return (
    <div className="fullscreen-container">
      {loading && <div className="fullscreen-loading">Loading diagram...</div>}
      {error && <div className="fullscreen-error">{error}</div>}
      
      {diagram && (
        <>
          {diagram.name && <div className="fullscreen-diagram-title">{diagram.name}</div>}
          
          <div 
            ref={containerRef}
            className="fullscreen-diagram-container"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            <div 
              ref={diagramRef} 
              className="fullscreen-diagram-output"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            />
          </div>
          
          <div className="fullscreen-diagram-controls">
            <div className="fullscreen-zoom-controls">
              <button 
                onClick={handleZoomOut} 
                className="fullscreen-control-button"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <RemoveIcon fontSize="small" />
              </button>
              <span className="fullscreen-zoom-level">{Math.round(scale * 100)}%</span>
              <button 
                onClick={handleZoomIn} 
                className="fullscreen-control-button"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <AddIcon fontSize="small" />
              </button>
              <button 
                onClick={handleResetView} 
                className="fullscreen-control-button"
                aria-label="Reset view"
                title="Reset view"
              >
                <RestartAltIcon fontSize="small" />
              </button>
              <button 
                onClick={handleExitFullScreen} 
                className="fullscreen-control-button"
                aria-label="Exit full screen"
                title="Exit full screen"
              >
                <FullscreenExitIcon fontSize="small" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FullScreenDiagram;
