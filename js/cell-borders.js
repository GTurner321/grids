// cell-borders.js - Fixed to ensure no borders between adjacent path cells

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
    
    // Process each cell in the path
    for (let position = 0; position < path.length; position++) {
        const cellIndex = path[position];
        const cell = getCellElement(cellIndex);
        if (!cell) continue;
        
        // Determine this cell's coordinates
        const x = cellIndex % gridSize;
        const y = Math.floor(cellIndex / gridSize);
        
        // Get previous and next cells in path (if they exist)
        const prevIndex = position > 0 ? path[position - 1] : null;
        const nextIndex = position < path.length - 1 ? path[position + 1] : null;
        
        // Initialize all borders as needed
        let needsTopBorder = true;
        let needsRightBorder = true;
        let needsBottomBorder = true;
        let needsLeftBorder = true;
        
        // Remove borders where cell connects to previous cell
        if (prevIndex !== null) {
            const prevX = prevIndex % gridSize;
            const prevY = Math.floor(prevIndex / gridSize);
            
            if (prevX === x && prevY === y - 1) needsTopBorder = false;
            if (prevX === x + 1 && prevY === y) needsRightBorder = false;
            if (prevX === x && prevY === y + 1) needsBottomBorder = false;
            if (prevX === x - 1 && prevY === y) needsLeftBorder = false;
        }
        
        // Remove borders where cell connects to next cell
        if (nextIndex !== null) {
            const nextX = nextIndex % gridSize;
            const nextY = Math.floor(nextIndex / gridSize);
            
            if (nextX === x && nextY === y - 1) needsTopBorder = false;
            if (nextX === x + 1 && nextY === y) needsRightBorder = false;
            if (nextX === x && nextY === y + 1) needsBottomBorder = false;
            if (nextX === x - 1 && nextY === y) needsLeftBorder = false;
        }
        
        // DELAYED BORDER RENDERING LOGIC:
        // Only apply borders if:
        // 1. This is NOT the last cell in the path AND there's a next cell, OR
        // 2. This IS the last cell in the path AND it's an end cell
        
        const isLastCell = position === path.length - 1;
        const isEndCell = cell.classList.contains('end-cell') || cell.classList.contains('end-cell-selected');
        
        if (!isLastCell || (isLastCell && isEndCell)) {
            // Apply needed borders
            if (needsTopBorder) cell.classList.add('border-top');
            if (needsRightBorder) cell.classList.add('border-right');
            if (needsBottomBorder) cell.classList.add('border-bottom');
            if (needsLeftBorder) cell.classList.add('border-left');
        }
    }
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
 * Function to draw complete borders for the solved path
 * Used when the puzzle is solved
 * @param {Array} path - The completed path
 * @param {Function} getCellElement - Function to get cell element by index
 * @param {number} gridSize - Size of the grid
 */
export function drawCompleteBorders(path, getCellElement, gridSize = 10) {
    // Clear existing borders
    removeAllPathBorders();
    
    if (!path || path.length <= 1) return;
    
    // For each cell in the path, add borders except where connected to adjacent path cells
    for (let position = 0; position < path.length; position++) {
        const cellIndex = path[position];
        const cell = getCellElement(cellIndex);
        if (!cell) continue;
        
        // Determine this cell's coordinates
        const x = cellIndex % gridSize;
        const y = Math.floor(cellIndex / gridSize);
        
        // Initialize all borders as needed
        let needsTopBorder = true;
        let needsRightBorder = true;
        let needsBottomBorder = true;
        let needsLeftBorder = true;
        
        // Check if previous cell removes need for a border
        if (position > 0) {
            const prevIndex = path[position - 1];
            const prevX = prevIndex % gridSize;
            const prevY = Math.floor(prevIndex / gridSize);
            
            if (prevX === x && prevY === y - 1) needsTopBorder = false;
            if (prevX === x + 1 && prevY === y) needsRightBorder = false;
            if (prevX === x && prevY === y + 1) needsBottomBorder = false;
            if (prevX === x - 1 && prevY === y) needsLeftBorder = false;
        }
        
        // Check if next cell removes need for a border
        if (position < path.length - 1) {
            const nextIndex = path[position + 1];
            const nextX = nextIndex % gridSize;
            const nextY = Math.floor(nextIndex / gridSize);
            
            if (nextX === x && nextY === y - 1) needsTopBorder = false;
            if (nextX === x + 1 && nextY === y) needsRightBorder = false;
            if (nextX === x && nextY === y + 1) needsBottomBorder = false;
            if (nextX === x - 1 && nextY === y) needsLeftBorder = false;
        }
        
        // Add the necessary borders
        if (needsTopBorder) cell.classList.add('border-top');
        if (needsRightBorder) cell.classList.add('border-right');
        if (needsBottomBorder) cell.classList.add('border-bottom');
        if (needsLeftBorder) cell.classList.add('border-left');
    }
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
        
        /* Add style for solved path cells (yellow) */
        .grid-cell.user-solved-path {
            background-color: #f0e68c !important;
            z-index: 15;
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
