// patharrows.js - Module for handling path direction arrows
// FIXED VERSION - Added gridSize support for different grid dimensions

/**
 * Creates an SVG arrow element pointing in the specified direction
 * @param {string} direction - 'up', 'down', 'left', or 'right'
 * @returns {HTMLElement} - SVG arrow element
 */
function createArrowSVG(direction) {
    const arrowContainer = document.createElement('div');
    arrowContainer.className = `path-arrow ${direction}`;
    
    // Add a custom attribute for easier debugging
    arrowContainer.setAttribute('data-direction', direction);
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Set path data based on direction
    switch(direction) {
        case 'right':
            path.setAttribute('d', 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z');
            break;
        case 'left':
            path.setAttribute('d', 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z');
            break;
        case 'up':
            path.setAttribute('d', 'M4 12l8-8 8 8-1.41 1.41L13 7.83V20h-2V7.83l-5.58 5.59L4 12z');
            break;
        case 'down':
            path.setAttribute('d', 'M20 12l-8 8-8-8 1.41-1.41L11 16.17V4h2v12.17l5.58-5.59L20 12z');
            break;
        default:
            return null;
    }
    
    // Set extra styles to debug
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'currentColor');
    
    svg.appendChild(path);
    arrowContainer.appendChild(svg);
    
    return arrowContainer;
}

/**
 * Determines the direction between two cell indices
 * @param {number} fromIndex - Starting cell index
 * @param {number} toIndex - Ending cell index
 * @param {number} gridSize - Size of the grid (width/height)
 * @returns {string} - 'up', 'down', 'left', 'right', or null if not adjacent
 */
function getDirection(fromIndex, toIndex, gridSize = 10) {
    // Use the provided gridSize parameter for coordinate calculations
    const fromX = fromIndex % gridSize;
    const fromY = Math.floor(fromIndex / gridSize);
    const toX = toIndex % gridSize;
    const toY = Math.floor(toIndex / gridSize);
    
    if (fromX === toX) {
        if (fromY - toY === 1) return 'up';
        if (fromY - toY === -1) return 'down';
    }
    
    if (fromY === toY) {
        if (fromX - toX === 1) return 'left';
        if (fromX - toX === -1) return 'right';
    }
    
    return null; // Not adjacent
}

/**
 * Adds direction arrows to cells based on the path
 * @param {Array} path - Array of cell indices representing the path
 * @param {Function} getCellElement - Function to get cell element by index
 * @param {number} gridSize - Size of the grid (width/height)
 */
function addPathArrows(path, getCellElement, gridSize = 10) {
    // Get current gridSize from gameController if possible
    if (window.gameController && window.gameController.state && window.gameController.state.currentLevel) {
        const config = window.gameController.state && 
                      window.gameController.getLevelConfig ? 
                      window.gameController.getLevelConfig(window.gameController.state.currentLevel) :
                      null;
        
        // If we have config with gridSize, use it
        if (config && config.gridSize) {
            gridSize = config.gridSize;
        }
    }
    
    // Try to get gridSize from data attribute on grid container as fallback
    const gridContainer = document.getElementById('grid-container');
    if (gridContainer && gridContainer.classList.contains('grid-size-6')) {
        gridSize = 6;
    }
    
    // Remove any existing arrows first
    document.querySelectorAll('.path-arrow').forEach(arrow => arrow.remove());
    
    // Add new arrows
    path.forEach((index, position) => {
        // Don't add arrow to the last cell
        if (position >= path.length - 1) return;
        
        const cell = getCellElement(index);
        if (!cell) return;
        
        const nextIndex = path[position + 1];
        const direction = getDirection(index, nextIndex, gridSize);
        
        if (direction) {
            const arrow = createArrowSVG(direction);
            if (arrow) {
                cell.appendChild(arrow);
            }
        }
    });
}

export {
    addPathArrows,
    getDirection
};
