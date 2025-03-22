// cell-borders.js - Handles cell border visualization for paths
// With simplified logic for delayed border rendering

/**
 * Adds path borders to cells based on the path
 * @param {Array} path - Array of cell indices representing the path
 * @param {Function} getCellElement - Function to get cell element by index
 * @param {number} gridSize - Size of the grid (width/height)
 */
export function addPathBorders(path, getCellElement, gridSize = 10) {
    // Clear all existing borders first
    removeAllPathBorders();
    
    // If path is empty, nothing to do
    if (!path || path.length === 0) return;
    
    // SIMPLIFIED APPROACH:
    // 1. Only add borders to cells that have a next cell selected (position < path.length - 1)
    // 2. Always add borders to the last cell in the path (position === path.length - 1)
    
    for (let position = 0; position < path.length; position++) {
        const cellIndex = path[position];
        const cell = getCellElement(cellIndex);
        if (!cell) continue;
        
        // Get next and previous indices if they exist
        const prevIndex = position > 0 ? path[position - 1] : null;
        const nextIndex = position < path.length - 1 ? path[position + 1] : null;
        
        // THIS IS THE KEY CHANGE:
        // Only add borders if:
        // - This is NOT the last cell in the path AND there's a next cell selected, OR
        // - This IS the last cell in the path
        
        const isLastCell = position === path.length - 1;
        
        if ((nextIndex !== null) || isLastCell) {
            // Determine cell connections
            const connections = determineConnections(cellIndex, prevIndex, nextIndex, gridSize);
            
            // Apply borders based on connections
            applyBorders(cell, connections);
        }
    }
}

/**
 * Determine which sides of a cell are connected to other path cells
 */
function determineConnections(cellIndex, prevIndex, nextIndex, gridSize) {
    const x = cellIndex % gridSize;
    const y = Math.floor(cellIndex / gridSize);
    
    const connections = {
        top: false,    // Connected to cell above
        right: false,  // Connected to cell to the right
        bottom: false, // Connected to cell below
        left: false    // Connected to cell to the left
    };
    
    // Check previous cell connection
    if (prevIndex !== null) {
        const prevX = prevIndex % gridSize;
        const prevY = Math.floor(prevIndex / gridSize);
        
        if (prevX === x && prevY === y - 1) connections.top = true;
        if (prevX === x + 1 && prevY === y) connections.right = true;
        if (prevX === x && prevY === y + 1) connections.bottom = true;
        if (prevX === x - 1 && prevY === y) connections.left = true;
    }
    
    // Check next cell connection
    if (nextIndex !== null) {
        const nextX = nextIndex % gridSize;
        const nextY = Math.floor(nextIndex / gridSize);
        
        if (nextX === x && nextY === y - 1) connections.top = true;
        if (nextX === x + 1 && nextY === y) connections.right = true;
        if (nextX === x && nextY === y + 1) connections.bottom = true;
        if (nextX === x - 1 && nextY === y) connections.left = true;
    }
    
    return connections;
}

/**
 * Apply borders to a cell based on its connections
 */
function applyBorders(cell, connections) {
    // Add borders to sides that are NOT connected to the path
    if (!connections.top) cell.classList.add('border-top');
    if (!connections.right) cell.classList.add('border-right');
    if (!connections.bottom) cell.classList.add('border-bottom');
    if (!connections.left) cell.classList.add('border-left');
}

/**
 * Removes all path borders from the grid
 */
export function removeAllPathBorders() {
    document.querySelectorAll('.border-top, .border-right, .border-bottom, .border-left')
        .forEach(cell => {
            cell.classList.remove('border-top', 'border-right', 'border-bottom', 'border-left');
        });
}

/**
 * Updates border styling when the path changes
 * @param {Array} path - The current path
 * @param {Function} getCellElement - Function to get a cell element by index
 * @param {number} gridSize - Size of the grid
 */
export function updatePathBorders(path, getCellElement, gridSize = 10) {
    addPathBorders(path, getCellElement, gridSize);
}

/**
 * Adds CSS styles needed for the path borders
 * Call this once during initialization
 */
export function addBorderStyles() {
    // Check if styles are already added
    if (document.getElementById('path-border-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'path-border-styles';
    style.textContent = `
        /* Path border styles - thicker dark blue borders */
        .border-top {
            border-top: 3px solid #1e40af !important;
        }
        
        .border-right {
            border-right: 3px solid #1e40af !important;
        }
        
        .border-bottom {
            border-bottom: 3px solid #1e40af !important;
        }
        
        .border-left {
            border-left: 3px solid #1e40af !important;
        }
        
        /* Ensure borders appear above other content */
        .grid-cell {
            position: relative;
            z-index: 1;
        }
        
        /* Ensure selected cells maintain their original background colors */
        .grid-cell.selected.border-top,
        .grid-cell.selected.border-right,
        .grid-cell.selected.border-bottom,
        .grid-cell.selected.border-left,
        .start-cell-selected.border-top,
        .start-cell-selected.border-right,
        .start-cell-selected.border-bottom,
        .start-cell-selected.border-left,
        .end-cell-selected.border-top,
        .end-cell-selected.border-right,
        .end-cell-selected.border-bottom,
        .end-cell-selected.border-left {
            z-index: 5;
        }
        
        /* Reduce score bar height */
        .score-row {
            height: 35px !important;
        }
    `;
    
    document.head.appendChild(style);
}

// Helper function to determine if two cells are adjacent
export function areAdjacent(index1, index2, gridSize = 10) {
    if (index1 === null || index2 === null) return false;
    
    const x1 = index1 % gridSize;
    const y1 = Math.floor(index1 / gridSize);
    const x2 = index2 % gridSize;
    const y2 = Math.floor(index2 / gridSize);

    return (Math.abs(x1 - x2) === 1 && y1 === y2) || 
           (Math.abs(y1 - y2) === 1 && x1 === x2);
}
