// cell-borders.js - Complete rewrite with delayed border rendering

/**
 * Calculate the borders for all cells in the path, but only render borders
 * for cells that have a next cell selected.
 * 
 * @param {Array} path - Array of cell indices representing the path
 * @param {Function} getCellElement - Function to get cell element by index
 * @param {number} gridSize - Size of the grid (width/height)
 */
export function addPathBorders(path, getCellElement, gridSize = 10) {
    // Clear all existing borders first
    removeAllPathBorders();
    
    // If path is empty or just one cell, nothing to do
    if (!path || path.length <= 1) return;
    
    // Pre-calculate all borders for all cells
    const cellBorders = calculateAllBorders(path, gridSize);
    
    // Now apply the borders, but only for cells that have a next cell
    // (i.e., all cells except the last one)
    for (let i = 0; i < path.length - 1; i++) {
        const cellIndex = path[i];
        const cell = getCellElement(cellIndex);
        if (!cell) continue;
        
        // Apply the pre-calculated borders for this cell
        const borders = cellBorders[cellIndex];
        if (borders.top) cell.classList.add('border-top');
        if (borders.right) cell.classList.add('border-right');
        if (borders.bottom) cell.classList.add('border-bottom');
        if (borders.left) cell.classList.add('border-left');
    }
    
    // Special handling for the last cell - only add borders if it's an end cell
    const lastCellIndex = path[path.length - 1];
    const lastCell = getCellElement(lastCellIndex);
    
    if (lastCell && (lastCell.classList.contains('end-cell') || 
                    lastCell.classList.contains('end-cell-selected'))) {
        // Apply pre-calculated borders for the end cell
        const borders = cellBorders[lastCellIndex];
        if (borders.top) lastCell.classList.add('border-top');
        if (borders.right) lastCell.classList.add('border-right');
        if (borders.bottom) lastCell.classList.add('border-bottom');
        if (borders.left) lastCell.classList.add('border-left');
    }
}

/**
 * Calculate which borders each cell in the path should have
 * 
 * @param {Array} path - Array of cell indices representing the path
 * @param {number} gridSize - Size of the grid
 * @returns {Object} Object mapping cell indices to border configurations
 */
function calculateAllBorders(path, gridSize) {
    const cellBorders = {};
    
    // Initialize all cells with all borders
    for (const cellIndex of path) {
        cellBorders[cellIndex] = {
            top: true,
            right: true,
            bottom: true,
            left: true
        };
    }
    
    // Remove borders between adjacent cells in the path
    for (let i = 0; i < path.length - 1; i++) {
        const currentIndex = path[i];
        const nextIndex = path[i + 1];
        
        const currentX = currentIndex % gridSize;
        const currentY = Math.floor(currentIndex / gridSize);
        const nextX = nextIndex % gridSize;
        const nextY = Math.floor(nextIndex / gridSize);
        
        // Remove borders between these adjacent cells
        if (nextX > currentX) {
            // Next cell is to the right
            cellBorders[currentIndex].right = false;
            cellBorders[nextIndex].left = false;
        } else if (nextX < currentX) {
            // Next cell is to the left
            cellBorders[currentIndex].left = false;
            cellBorders[nextIndex].right = false;
        } else if (nextY > currentY) {
            // Next cell is below
            cellBorders[currentIndex].bottom = false;
            cellBorders[nextIndex].top = false;
        } else if (nextY < currentY) {
            // Next cell is above
            cellBorders[currentIndex].top = false;
            cellBorders[nextIndex].bottom = false;
        }
    }
    
    return cellBorders;
}

/**
 * Complete the borders for the entire path at once
 * Used after the puzzle is solved
 * 
 * @param {Array} path - Array of cell indices representing the path
 * @param {Function} getCellElement - Function to get cell element by index
 * @param {number} gridSize - Size of the grid (width/height)
 */
export function drawCompleteBorders(path, getCellElement, gridSize = 10) {
    // Clear all existing borders first
    removeAllPathBorders();
    
    // Pre-calculate borders for all cells
    const cellBorders = calculateAllBorders(path, gridSize);
    
    // Apply borders to ALL cells in the path
    for (const cellIndex of path) {
        const cell = getCellElement(cellIndex);
        if (!cell) continue;
        
        // Apply the pre-calculated borders
        const borders = cellBorders[cellIndex];
        if (borders.top) cell.classList.add('border-top');
        if (borders.right) cell.classList.add('border-right');
        if (borders.bottom) cell.classList.add('border-bottom');
        if (borders.left) cell.classList.add('border-left');
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
