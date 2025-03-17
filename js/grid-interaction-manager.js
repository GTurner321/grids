// grid-interaction-manager.js
// A modular manager for all grid interactions - mouse, touch, and keyboard

import TouchHandler from './touch-handler.js';

class GridInteractionManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.gridContainer = null;
        this.touchHandler = new TouchHandler(gameController);
        this.lastClickTime = 0; // For debouncing clicks
        this.clickDebounceTime = 200; // ms
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    init() {
        console.log('Initializing grid interaction manager');
        this.gridContainer = document.getElementById('grid-container');
        
        if (!this.gridContainer) {
            console.error('Grid container not found, interaction manager initialization failed');
            return;
        }
        
        // Detect device capabilities
        this.detectDeviceCapabilities();
        
        // Initialize mouse event handlers
        this.initMouseHandlers();
        
        // Initialize touch handlers if on a touch device
        if (this.isTouchDevice) {
            this.touchHandler.init();
        }
        
        // Initialize keyboard handlers (for accessibility)
        this.initKeyboardHandlers();
        
        // Add CSS optimizations
        this.addInteractionOptimizations();
    }
    
    detectDeviceCapabilities() {
        // Add classes to body for device-specific styling
        if (this.isTouchDevice) {
            document.body.classList.add('touch-device');
            console.log('Touch device detected');
            
            if (this.isIOS) {
                document.body.classList.add('ios-device');
                console.log('iOS device detected');
            }
        }
    }
    
    // Update the initMouseHandlers method in grid-interaction-manager.js
// Find the initMouseHandlers method and replace it with this version:

initMouseHandlers() {
    // Direct click handler for grid cells
    this.gridContainer.addEventListener('click', (e) => {
        if (!this.gameController.state.gameActive) return;
        
        // Debounce clicks
        const now = Date.now();
        if (now - this.lastClickTime < this.clickDebounceTime) {
            return;
        }
        this.lastClickTime = now;
        
        // Find the clicked cell
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;
        
        // Special handling for first click on start cell
        const isStartCell = cell.classList.contains('start-cell');
        if (isStartCell && this.gameController.state.userPath.length === 0) {
            console.log('Start cell clicked directly in grid-interaction-manager');
            const cellIndex = parseInt(cell.dataset.index);
            if (isNaN(cellIndex)) return;
            
            // Directly modify the path - USING MORE VERBOSE DEBUGGING
            console.log('Adding start cell to path, index:', cellIndex);
            this.gameController.state.userPath = [cellIndex];
            
            // Make multiple attempts to update the path highlight
            this.gameController.updatePathHighlight();
            
            // Also try the direct method on pathManager if available
            if (this.gameController.pathManager && this.gameController.pathManager.updatePathHighlight) {
                this.gameController.pathManager.updatePathHighlight();
            }
            
            // Add visual feedback
            this.addVisualFeedback(cell);
            
            // Show message
            this.gameController.showMessage('Path started! Continue by selecting connected cells.');
            
            // Stop event propagation
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        
        // For all other cells, use the regular handler
        this.gameController.handleCellClick(cell);
    });
    
    // Prevent text selection on mouse down
    this.gridContainer.addEventListener('mousedown', (e) => {
        if (!this.gameController.state.gameActive) return;
        
        const cell = e.target.closest('.grid-cell');
        if (cell) {
            e.preventDefault(); // Prevent text selection
        }
    });
    
    // Clean up hover states when mouse leaves
    this.gridContainer.addEventListener('mouseleave', () => {
        document.querySelectorAll('.drag-target').forEach(cell => {
            cell.classList.remove('drag-target');
        });
    });
    
    // Add a helper method for visual feedback if it doesn't exist
    if (!this.addVisualFeedback) {
        this.addVisualFeedback = (cell) => {
            // Add a visual pulse effect
            cell.classList.add('just-selected');
            setTimeout(() => {
                cell.classList.remove('just-selected');
            }, 300);
        };
    }
    
    // Also add additional style for start cell to make it more noticeable
    const style = document.createElement('style');
    style.textContent = `
        .grid-cell.start-cell {
            position: relative;
            z-index: 50;
        }
        
        .grid-cell.start-cell.just-selected {
            animation: cell-pulse-stronger 0.3s ease-out;
        }
        
        @keyframes cell-pulse-stronger {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}
        
    initKeyboardHandlers() {
        // Add keyboard navigation for accessibility
        // This is a good practice but may not be required for all games
        
        // Focus handling for grid cells to enable keyboard navigation
        this.gridContainer.querySelectorAll('.grid-cell').forEach(cell => {
            cell.setAttribute('tabindex', '0'); // Make cells focusable
            
            // Handle keyboard activation
            cell.addEventListener('keydown', (e) => {
                if (!this.gameController.state.gameActive) return;
                
                // Spacebar or Enter activates cell
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.gameController.handleCellClick(cell);
                }
            });
        });
    }
    
    addInteractionOptimizations() {
        // Add CSS optimizations for better interaction experience
        const style = document.createElement('style');
        style.textContent = `
            /* Optimize grid cells for interaction */
            .grid-cell {
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                -webkit-user-select: none;
                cursor: pointer;
                transition: transform 0.1s ease-out;
            }
            
            /* Enhanced visual feedback */
            .grid-cell.just-selected {
                animation: cell-pulse 0.3s ease-out;
            }
            
            /* Make start cell more prominent for touch */
            .grid-cell.start-cell {
                z-index: 30;
                position: relative;
            }
            
            /* Pulse animation */
            @keyframes cell-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            /* iOS-specific optimizations */
            .ios-device .grid-cell {
                min-height: 44px;
                min-width: 44px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    addVisualFeedback(cell) {
        // Add a visual pulse effect
        cell.classList.add('just-selected');
        setTimeout(() => {
            cell.classList.remove('just-selected');
        }, 300);
    }
}

export default GridInteractionManager;
