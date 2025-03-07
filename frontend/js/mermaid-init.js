/**
 * Mermaid.js initialization and configuration
 * This file handles the setup and configuration of the mermaid library
 */

// Initialize mermaid with configuration options
mermaid.initialize({
    startOnLoad: false,  // We'll manually render the diagram
    theme: 'default',    // Theme for the diagrams
    securityLevel: 'loose',  // Required for some diagram features
    logLevel: 'error',   // Only show errors in console
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

/**
 * Renders a mermaid diagram from the provided code
 * @param {string} code - The mermaid syntax code to render
 * @param {string} outputElementId - The ID of the element where the diagram should be rendered
 * @param {string} errorElementId - The ID of the element where errors should be displayed
 * @returns {Promise<void>} - A promise that resolves when rendering is complete
 */
async function renderMermaidDiagram(code, outputElementId, errorElementId) {
    const outputElement = document.getElementById(outputElementId);
    const errorElement = document.getElementById(errorElementId);
    
    // Clear previous content
    outputElement.innerHTML = '';
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    try {
        // Generate a unique ID for this render
        const id = `mermaid-diagram-${Date.now()}`;
        
        // Create the SVG using mermaid's render method
        const { svg } = await mermaid.render(id, code);
        
        // Insert the SVG into the output element
        outputElement.innerHTML = svg;
        
        // Make sure the SVG is responsive
        const svgElement = outputElement.querySelector('svg');
        if (svgElement) {
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            svgElement.style.maxWidth = '100%';
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
    } catch (error) {
        // Display the error message
        errorElement.textContent = `Error: ${error.message || 'Failed to render diagram'}`;
        errorElement.style.display = 'block';
        console.error('Mermaid rendering error:', error);
    }
}
