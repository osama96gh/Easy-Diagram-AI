/**
 * Main application logic for Diagmarm Builder
 * Handles user interactions and diagram updates
 */

// DOM elements
const codeEditor = document.getElementById('code-editor');
const clearButton = document.getElementById('clear-btn');
const copyButton = document.getElementById('copy-btn');
const diagramOutput = document.getElementById('diagram-output');
const errorDisplay = document.getElementById('error-display');

// Default mermaid code (same as in the textarea)
const defaultMermaidCode = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;

/**
 * Updates the diagram based on the current code in the editor
 */
function updateDiagram() {
    const code = codeEditor.value.trim();
    
    if (code) {
        renderMermaidDiagram(code, 'diagram-output', 'error-display');
    } else {
        errorDisplay.textContent = 'Please enter some mermaid code';
        errorDisplay.style.display = 'block';
        diagramOutput.innerHTML = '';
    }
}

/**
 * Clears the code editor and resets to default example
 */
function clearEditor() {
    codeEditor.value = defaultMermaidCode;
    updateDiagram();
}

/**
 * Copies the current code to clipboard
 */
function copyCode() {
    codeEditor.select();
    document.execCommand('copy');
    
    // Visual feedback
    const originalText = copyButton.textContent;
    copyButton.textContent = 'Copied!';
    
    setTimeout(() => {
        copyButton.textContent = originalText;
    }, 1500);
}

/**
 * Handles tab key in the textarea to insert tabs instead of changing focus
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleTabKey(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        
        // Insert tab at cursor position
        const start = this.selectionStart;
        const end = this.selectionEnd;
        
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        
        // Move cursor after the inserted tab
        this.selectionStart = this.selectionEnd = start + 4;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Render the initial diagram
    updateDiagram();
    
    // Set up event listeners
    codeEditor.addEventListener('input', updateDiagram);
    codeEditor.addEventListener('keydown', handleTabKey);
    clearButton.addEventListener('click', clearEditor);
    copyButton.addEventListener('click', copyCode);
    
    // Handle window resize to adjust the diagram
    window.addEventListener('resize', () => {
        // Re-render the diagram when window is resized
        updateDiagram();
    });
});
