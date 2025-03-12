import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mermaid from 'mermaid';
import { BasePanel, StatusMessage } from '../../common';
import ZoomControls from './ZoomControls';
import './DiagramRenderer.css';

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
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // Render the diagram whenever the code changes
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

    renderDiagram();
  }, [code]);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale + ZOOM_STEP, ZOOM_MAX));
  }, []);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale - ZOOM_STEP, ZOOM_MIN));
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
      // Only process keyboard events when the component is mounted
      if (!containerRef.current) return;
      
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
  }, [handleZoomIn, handleZoomOut, handleResetView]);

  return (
    <BasePanel
      title="Center Panel - Diagram Preview"
      panelId={panelId}
      orientation="horizontal"
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <StatusMessage 
          message={error ? `Error: ${error}` : null}
          type="error"
        />
        
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
        
        {/* Zoom Controls Component */}
        <ZoomControls 
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onDownloadImage={handleDownloadImage}
          onFullScreen={handleFullScreen}
        />
      </div>
    </BasePanel>
  );
};

export default DiagramRenderer;
