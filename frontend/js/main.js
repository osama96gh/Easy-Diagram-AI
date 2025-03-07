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
const aiInput = document.getElementById('ai-input');
const aiSubmitButton = document.getElementById('ai-submit-btn');
const aiStatus = document.getElementById('ai-status');

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

/**
 * Handles AI diagram update requests
 * @returns {Promise<void>}
 */
async function handleAIRequest() {
    // Get the current code and user request
    const currentCode = codeEditor.value.trim();
    const userRequest = aiInput.value.trim();
    
    // Validate inputs
    if (!currentCode) {
        showAIStatus('error', 'Please enter some mermaid code first');
        return;
    }
    
    if (!userRequest) {
        showAIStatus('error', 'Please enter a request');
        return;
    }
    
    try {
        // Show loading state
        aiSubmitButton.disabled = true;
        showAIStatus('loading', 'Processing your request...');
        
        // Send the request to the AI service
        const updatedCode = await updateDiagramWithAI(currentCode, userRequest);
        
        // Update the code editor with the new code
        codeEditor.value = updatedCode;
        
        // Re-render the diagram
        updateDiagram();
        
        // Show success message
        showAIStatus('success', 'Diagram updated successfully!');
        
        // Clear the input field
        aiInput.value = '';
        
    } catch (error) {
        // Show error message
        showAIStatus('error', `Error: ${error.message || 'Failed to update diagram'}`);
        console.error('AI request error:', error);
    } finally {
        // Re-enable the submit button
        aiSubmitButton.disabled = false;
    }
}

/**
 * Shows a status message in the AI assistant panel
 * @param {string} type - The type of status (loading, error, success)
 * @param {string} message - The message to display
 */
function showAIStatus(type, message) {
    // Remove all existing status classes
    aiStatus.classList.remove('loading', 'error', 'success');
    
    // Add the new status class
    aiStatus.classList.add(type);
    
    // Set the message
    aiStatus.textContent = message;
    
    // Show the status
    aiStatus.style.display = 'block';
    
    // If it's a success message, hide it after a few seconds
    if (type === 'success') {
        setTimeout(() => {
            aiStatus.style.display = 'none';
        }, 3000);
    }
}

/**
 * Checks if the AI service is available and updates the UI accordingly
 */
async function checkAIServiceAvailability() {
    try {
        const isAvailable = await checkAPIAvailability();
        
        if (!isAvailable) {
            aiSubmitButton.disabled = true;
            showAIStatus('error', 'AI service is currently unavailable');
        }
    } catch (error) {
        console.error('Error checking AI service availability:', error);
        aiSubmitButton.disabled = true;
        showAIStatus('error', 'AI service is currently unavailable');
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
    
    // AI Assistant event listeners
    aiSubmitButton.addEventListener('click', handleAIRequest);
    aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAIRequest();
        }
    });
    
    // Check if the AI service is available
    checkAIServiceAvailability();
    
    // Handle window resize to adjust the diagram
    window.addEventListener('resize', () => {
        // Re-render the diagram when window is resized
        updateDiagram();
    });
});
