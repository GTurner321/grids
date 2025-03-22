// cell-borders.js - Handles cell border visualization for paths
// This replaces the arrow-based visualization with border-based paths
// Creates a visual "tunnel" through the grid showing the selected path

/**
 * Adds path borders to cells based on the path
 * With delayed rendering: borders only appear once the player has moved past a cell
 * @param {Array} path - Array of cell indices representing the path
 * @param {Function} getCellElement - Function to get cell element by index
 * @param {number} gridSize - Size of the grid (width/height)
 */
export function addPathBorders(path, getCellElement, gridSize = 10) {
    // First clear any existing path borders
    removeAllPathBorders();
    
    // If path is empty, nothing to do
    if (!path || path.length === 0) return;
    
    // For each cell in the path, determine which borders to show
    path.forEach((cellIndex, position) => {
        const cell = getCellElement(cellIndex);
        if (!cell) return;
        
        // Get previous and next cells in path (if they exist)
        const prevIndex = position > 0 ? path[position - 1] : null;
        const nextIndex = position < path.length - 1 ? path[position + 1] : null;
        
        // Implement delayed border rendering logic:
        // 1. For first cell (green), always show borders
        // 2. For middle cells, only show borders if nextIndex exists (player has moved past this cell)
        // 3. For last cell in current path (red if final, or current end of selection), always show borders
        const isFirstCell = position === 0;
        const isLastSelectedCell = position === path.length - 1;
        
        // Only add borders in these cases:
        if (isFirstCell || nextIndex !== null || isLastSelectedCell) {
            addCellBordersWithDelay(cell, cellIndex, prevIndex, nextIndex, gridSize, position, path.length - 1);
        }
    });
}

/**
 * Removes all path borders from the grid
 * Can be called directly to clear all borders
 */
export function removeAllPathBorders() {
    document.querySelectorAll('.border-top, .border-right, .border-bottom, .border-left')
        .forEach(cell => {
            cell.classList.remove('border-top', 'border-right', 'border-bottom', 'border-left');
        });
}

/**
 * Add appropriate border classes to a cell based on its connections
 * @param {HTMLElement} cell - The cell element
 * @param {number} cellIndex - Index of the current cell
 * @param {number|null} prevIndex - Index of the previous cell in path (or null)
 * @param {number|null} nextIndex - Index of the next cell in path (or null)
 * @param {number} gridSize - Size of the grid
 * @param {number} position - Position of this cell in the path
 * @param {number} lastPosition - Position of the last cell in the path
 */
function addCellBordersWithDelay(cell, cellIndex, prevIndex, nextIndex, gridSize, position, lastPosition) {
    // Get coordinates for current cell
    const x = cellIndex % gridSize;
    const y = Math.floor(cellIndex / gridSize);
    
    // Determine which neighboring cells are part of the path
    const connections = {
        top: false,    // Is connected to cell above
        right: false,  // Is connected to cell to the right
        bottom: false, // Is connected to cell below
        left: false    // Is connected to cell to the left
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
    
    // Add borders to sides that are not connected to the path
    if (position === 0) {
        // First cell: Only add borders on sides that aren't connected to the next cell
        // This creates an "opening" toward the next cell
        if (!connections.top) cell.classList.add('border-top');
        if (!connections.right) cell.classList.add('border-right');
        if (!connections.bottom) cell.classList.add('border-bottom');
        if (!connections.left) cell.classList.add('border-left');
    } 
    else if (position === lastPosition) {
        // Last cell: Add all borders except where it connects to the previous cell
        // This "closes" the path at the end
        if (!connections.top) cell.classList.add('border-top');
        if (!connections.right) cell.classList.add('border-right');
        if (!connections.bottom) cell.classList.add('border-bottom');
        if (!connections.left) cell.classList.add('border-left');
    } 
    else if (prevIndex !== null && nextIndex !== null) {
        // Middle cell: Only add borders on sides that don't connect to other path cells
        if (!connections.top) cell.classList.add('border-top');
        if (!connections.right) cell.classList.add('border-right');
        if (!connections.bottom) cell.classList.add('border-bottom');
        if (!connections.left) cell.classList.add('border-left');
    }
    // For cells that have a previous but no next (current end of an incomplete path),
    // we don't add any borders to show it's still open for continuation (if not the last cell)
}

/**
 * Updates border styling when the path changes
 * Call this when cells are added/removed from the path
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
