import React, { useEffect, useRef, useState, useCallback } from 'react';
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
const ZOOM_MAX = 10;
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
  const zoomInIntervalRef = useRef<number | null>(null);
  const zoomOutIntervalRef = useRef<number | null>(null);
  
  // State for zoom and pan
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

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
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale + ZOOM_STEP, ZOOM_MAX));
  }, []);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale - ZOOM_STEP, ZOOM_MIN));
  }, []);
  
  // Start continuous zoom in
  const startZoomIn = useCallback(() => {
    // Clear any existing interval
    if (zoomInIntervalRef.current) {
      window.clearInterval(zoomInIntervalRef.current);
    }
    
    // Perform initial zoom immediately
    handleZoomIn();
    
    // Set up continuous zooming
    zoomInIntervalRef.current = window.setInterval(() => {
      handleZoomIn();
    }, 100); // Adjust timing for smooth zooming
  }, [handleZoomIn]);
  
  // Stop zoom in continuous action
  const stopZoomIn = useCallback(() => {
    if (zoomInIntervalRef.current) {
      window.clearInterval(zoomInIntervalRef.current);
      zoomInIntervalRef.current = null;
    }
  }, []);
  
  // Start continuous zoom out
  const startZoomOut = useCallback(() => {
    // Clear any existing interval
    if (zoomOutIntervalRef.current) {
      window.clearInterval(zoomOutIntervalRef.current);
    }
    
    // Perform initial zoom immediately
    handleZoomOut();
    
    // Set up continuous zooming
    zoomOutIntervalRef.current = window.setInterval(() => {
      handleZoomOut();
    }, 100); // Adjust timing for smooth zooming
  }, [handleZoomOut]);
  
  // Stop zoom out continuous action
  const stopZoomOut = useCallback(() => {
    if (zoomOutIntervalRef.current) {
      window.clearInterval(zoomOutIntervalRef.current);
      zoomOutIntervalRef.current = null;
    }
  }, []);

  // Handle reset view
  const handleResetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

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

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Handle touch start for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      setTouchDistance(getTouchDistance(e.touches));
    }
  };
  
  // Handle touch move for pinch-to-zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance !== null) {
      e.preventDefault();
      e.stopPropagation();
      
      const newDistance = getTouchDistance(e.touches);
      const delta = newDistance - touchDistance;
      
      // Adjust sensitivity of pinch zoom
      const zoomDelta = delta * 0.01;
      
      setScale(prevScale => {
        const newScale = prevScale + zoomDelta;
        return Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);
      });
      
      setTouchDistance(newDistance);
    }
  };
  
  // Handle touch end
  const handleTouchEnd = () => {
    setTouchDistance(null);
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only process wheel events that originated from our container
    if (containerRef.current && containerRef.current.contains(e.target as Node)) {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setScale(prevScale => {
        const newScale = prevScale + delta;
        return Math.min(Math.max(newScale, ZOOM_MIN), ZOOM_MAX);
      });
    }
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
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process keyboard events when the component is visible/mounted
      if (!containerRef.current || !isVisible) return;
      
      // Check if the event target is an input element (to avoid capturing keyboard events when typing)
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Handle zoom in: + key or = key (same physical key)
      if (e.key === '+' || e.key === '=' || 
          (e.key === '+' && (e.ctrlKey || e.metaKey)) || 
          (e.key === '=' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        handleZoomIn();
      }
      
      // Handle zoom out: - key
      if (e.key === '-' || 
          (e.key === '-' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        handleZoomOut();
      }
      
      // Reset view with 0 key
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetView();
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleZoomIn, handleZoomOut, handleResetView, isVisible]);
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (zoomInIntervalRef.current) {
        window.clearInterval(zoomInIntervalRef.current);
      }
      if (zoomOutIntervalRef.current) {
        window.clearInterval(zoomOutIntervalRef.current);
      }
    };
  }, []);

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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative',
            touchAction: 'none', // Prevent browser handling of touch gestures
            WebkitOverflowScrolling: 'touch' // Improve scrolling on iOS
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
                onMouseDown={startZoomOut}
                onMouseUp={stopZoomOut}
                onMouseLeave={stopZoomOut}
                onTouchStart={startZoomOut}
                onTouchEnd={stopZoomOut}
                className="control-button"
                aria-label="Zoom out (- key)"
                title="Zoom out (- key)"
              >
                <RemoveIcon fontSize="small" />
              </button>
              <span className="zoom-level">{Math.round(scale * 100)}%</span>
              <button 
                onMouseDown={startZoomIn}
                onMouseUp={stopZoomIn}
                onMouseLeave={stopZoomIn}
                onTouchStart={startZoomIn}
                onTouchEnd={stopZoomIn}
                className="control-button"
                aria-label="Zoom in (+ key)"
                title="Zoom in (+ key)"
              >
                <AddIcon fontSize="small" />
              </button>
              <button 
                onClick={handleResetView} 
                className="control-button"
                aria-label="Reset view (Ctrl+0)"
                title="Reset view (Ctrl+0)"
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
