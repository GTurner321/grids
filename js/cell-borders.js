// cell-borders.js - Handles cell border visualization for paths
// This replaces the arrow-based visualization with border-based paths
// Creates a visual "tunnel" through the grid showing the selected path

/**
 * Adds path borders to cells based on the path
 * With strictly delayed rendering: borders only appear for cells that have next cells selected
 * @param {Array} path - Array of cell indices representing the path
 * @param {Function} getCellElement - Function to get cell element by index
 * @param {number} gridSize - Size of the grid (width/height)
 */
export function addPathBorders(path, getCellElement, gridSize = 10) {
    // First clear any existing path borders
    removeAllPathBorders();
    
    // If path is empty, nothing to do
    if (!path || path.length === 0) return;
    
    // Process each cell in the path to determine which should have borders
    for (let position = 0; position < path.length; position++) {
        const cellIndex = path[position];
        const cell = getCellElement(cellIndex);
        if (!cell) continue;
        
        // Get previous and next cells in path (if they exist)
        const prevIndex = position > 0 ? path[position - 1] : null;
        const nextIndex = position < path.length - 1 ? path[position + 1] : null;
        
        // STRICT DELAYED RENDERING LOGIC:
        // 1. For the first cell - only add borders if there is at least a second cell selected
        // 2. For middle cells - only add borders if the next cell is selected
        // 3. For the last cell - only add borders if it's the red final cell (special case)
        
        const isFirstCell = position === 0;
        const isLastCell = position === path.length - 1;
        const isLastCellSelected = isLastCell;
        
        // Only add borders if:
        // - This is the first cell AND there's a next cell already selected, OR
        // - This cell has a next cell already selected, OR
        // - This is the final selected cell (red end cell)
        if ((isFirstCell && nextIndex !== null) || 
            (nextIndex !== null) || 
            isLastCellSelected) {
            
            // Now determine which borders to add
            addCellBordersWithStrictDelay(cell, cellIndex, prevIndex, nextIndex, gridSize, position, path.length - 1);
        }
    }
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
 * With STRICT delay: only shows borders when the next cell has been selected
 * @param {HTMLElement} cell - The cell element
 * @param {number} cellIndex - Index of the current cell
 * @param {number|null} prevIndex - Index of the previous cell in path (or null)
 * @param {number|null} nextIndex - Index of the next cell in path (or null)
 * @param {number} gridSize - Size of the grid
 * @param {number} position - Position of this cell in the path
 * @param {number} lastPosition - Position of the last cell in the path
 */
function addCellBordersWithStrictDelay(cell, cellIndex, prevIndex, nextIndex, gridSize, position, lastPosition) {
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
    
    // Add borders based on cell position
    if (position === 0) {
        // First cell: show borders only on sides not leading to next cell
        if (!connections.top) cell.classList.add('border-top');
        if (!connections.right) cell.classList.add('border-right');
        if (!connections.bottom) cell.classList.add('border-bottom');
        if (!connections.left) cell.classList.add('border-left');
    } 
    else if (position === lastPosition) {
        // Last cell in current path: show borders on all sides except where connected to previous
        if (!connections.top) cell.classList.add('border-top');
        if (!connections.right) cell.classList.add('border-right');
        if (!connections.bottom) cell.classList.add('border-bottom');
        if (!connections.left) cell.classList.add('border-left');
    } 
    else {
        // Middle cell: show borders on sides not connected to path
        if (!connections.top) cell.classList.add('border-top');
        if (!connections.right) cell.classList.add('border-right');
        if (!connections.bottom) cell.classList.add('border-bottom');
        if (!connections.left) cell.classList.add('border-left');
    }
}

/**
 * Updates border styling when the path changes
 * Call this when cells are added/removed from the path
 * @param {Array} path - The current path
 * @param {Function} getCellElement - Function to get a cell element by index
 * @param {number} gridSize - Size of the grid
 */
export function updatePathBorders(path, getCellElement, gridSize = 10) {
    // Use the modified addPathBorders with delayed rendering
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
