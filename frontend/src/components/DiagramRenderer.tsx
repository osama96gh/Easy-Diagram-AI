import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mermaid from 'mermaid';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { usePanelContext } from '../contexts/PanelContext';

interface DiagramRendererProps {
  code: string;
  title?: string;
  panelId: string;
  diagramId?: number | null;
}

// Constants for zoom and pan
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const PAN_STEP = 50;

/**
 * DiagramRenderer component for rendering mermaid diagrams in the center panel
 * with zoom, pan, and navigation capabilities
 */
const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, title, panelId, diagramId }) => {
  const navigate = useNavigate();
  const { isPanelExpanded, togglePanelExpansion, getPanelStyle } = usePanelContext();
  const isVisible = isPanelExpanded(panelId);
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for zoom and pan
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

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

  // Render the diagram whenever the code changes or when visibility changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramRef.current || !code.trim()) {
        return;
      }

      try {
        // Clear previous content and error
        diagramRef.current.innerHTML = '';
        setError(null);

        // Generate a unique ID for this render
        const id = `mermaid-diagram-${Date.now()}`;
        
        // Create the SVG using mermaid's render method
        const { svg } = await mermaid.render(id, code);
        
        // Insert the SVG into the output element
        diagramRef.current.innerHTML = svg;
        
        // Make sure the SVG is responsive
        const svgElement = diagramRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.maxWidth = '100%';
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
      } catch (err) {
        // Display the error message
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        console.error('Mermaid rendering error:', err);
      }
    };

    // Only render if the diagram is visible
    if (isVisible) {
      renderDiagram();
    }
  }, [code, isVisible]);

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

  // Handle full screen view
  const handleFullScreen = () => {
    if (!diagramId) {
      setError('Cannot open full screen view: Diagram has not been saved');
      return;
    }
    
    // Open a new window with the full screen view
    const fullScreenUrl = `${window.location.origin}/diagram/${diagramId}`;
    window.open(fullScreenUrl, '_blank');
  };

  // Handle download diagram as SVG
  const handleDownloadImage = () => {
    if (!diagramRef.current) return;
    
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) {
      setError('No diagram found to download');
      return;
    }

    try {
      // Create a clone of the SVG to avoid modifying the displayed one
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      
      // Set explicit width and height attributes
      const bbox = svgElement.getBBox();
      const width = bbox.width;
      const height = bbox.height;
      
      svgClone.setAttribute('width', `${width}`);
      svgClone.setAttribute('height', `${height}`);
      
      // Convert SVG to a data URL
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Create a downloadable SVG file
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${title || 'diagram'}.svg`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up
      URL.revokeObjectURL(svgUrl);
    } catch (err) {
      setError('Failed to download diagram: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Download error:', err);
    }
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
    <div 
      className={`render-panel ${isVisible ? '' : 'collapsed'}`}
      style={getPanelStyle(panelId)}
    >
      <div className="render-panel-header">
        <h2>Center Panel - Diagram Preview</h2>
        <button 
          className="toggle-arrow" 
          onClick={() => togglePanelExpansion(panelId)}
          aria-label={isVisible ? "Hide diagram preview" : "Show diagram preview"}
        >
          {isVisible ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
      <div style={{ display: isVisible ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}>
        {error && <div className="error-display">{`Error: ${error}`}</div>}
        
        {/* Display diagram title if available */}
        {title && (
          <div className="diagram-title">
            {title}
          </div>
        )}
        
        {/* Diagram container with zoom and pan */}
        <div 
          ref={containerRef}
          className="diagram-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative'
          }}
        >
          <div 
            ref={diagramRef} 
            className="diagram-output"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              pointerEvents: 'auto' // Allow interactions with the diagram
            }}
          />
        </div>
        
        {/* Diagram controls as separate element outside the diagram container */}
        {isVisible && (
          <div className="diagram-controls-fixed">
            <div className="zoom-controls">
              <button 
                onClick={handleZoomOut} 
                className="control-button"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <RemoveIcon fontSize="small" />
              </button>
              <span className="zoom-level">{Math.round(scale * 100)}%</span>
              <button 
                onClick={handleZoomIn} 
                className="control-button"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <AddIcon fontSize="small" />
              </button>
              <button 
                onClick={handleResetView} 
                className="control-button"
                aria-label="Reset view"
                title="Reset view"
              >
                <RestartAltIcon fontSize="small" />
              </button>
              <button 
                onClick={handleDownloadImage} 
                className="control-button"
                aria-label="Download as SVG"
                title="Download as SVG"
              >
                <DownloadIcon fontSize="small" />
              </button>
              <button 
                onClick={handleFullScreen} 
                className="control-button"
                aria-label="Full screen"
                title="Full screen"
              >
                <FullscreenIcon fontSize="small" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagramRenderer;
