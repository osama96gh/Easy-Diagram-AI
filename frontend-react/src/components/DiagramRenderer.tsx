import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface DiagramRendererProps {
  code: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

/**
 * DiagramRenderer component for rendering mermaid diagrams
 */
const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, isVisible, onToggleVisibility }) => {
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`render-panel ${isVisible ? '' : 'collapsed'}`}>
      <div className="render-panel-header">
        <h2>Diagram Preview</h2>
        <button 
          className="toggle-arrow" 
          onClick={onToggleVisibility}
          aria-label={isVisible ? "Hide diagram preview" : "Show diagram preview"}
        >
          {isVisible ? '►' : '◄'}
        </button>
      </div>
      {isVisible && (
        <>
          {error && <div className="error-display">{`Error: ${error}`}</div>}
          <div ref={diagramRef} className="diagram-output" />
        </>
      )}
    </div>
  );
};

export default DiagramRenderer;
