// touch-handler.js
// A specialized module for handling touch interactions with the grid

class TouchHandler {
    constructor(gameController) {
        this.gameController = gameController;
        this.touchStartTime = 0;
        this.touchStartCell = null;
        this.lastTouchedCell = null;
        this.isDragging = false;
        this.dragThreshold = 100; // ms before touch becomes drag
        this.activeTouch = null; // Track the active touch
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) {
            console.error('Grid container not found, touch handler initialization failed');
            return;
        }
        
        console.log('Initializing enhanced touch handler');
        
        // Add touch event listeners
        this.addTouchListeners(gridContainer);
        
        // Add specific handlers for start cell
        this.enhanceStartCell();
        
        // Apply general touch improvements
        this.applyTouchOptimizations();
        
        this.initialized = true;
        this.applyStartCellFix();
    }
    
    addTouchListeners(gridContainer) {
        // Touch start - begin interaction
        gridContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        
        // Touch move - handle dragging
        gridContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        
        // Touch end - complete interaction
        gridContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        
        // Touch cancel - abort interaction
        gridContainer.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: true });
    }
    
    handleTouchStart(e) {
    if (!this.gameController.state.gameActive) {
        console.log('Touch ignored: game not active');
        return;
    }
    
    // Prevent multiple touch tracking - focus on first touch only
    if (this.activeTouch !== null) return;
    
    const touch = e.touches[0];
    this.activeTouch = touch.identifier;
    
    // Find the element at touch point
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    
    const cell = element.closest('.grid-cell');
    if (!cell) return;
    
    console.log('Touch start on cell index:', cell.dataset.index, 'classes:', cell.className);
    
    // Always prevent default to avoid scrolling issues
    e.preventDefault();
    
    // Record touch start data
    this.touchStartCell = cell;
    this.lastTouchedCell = cell;
    this.touchStartTime = Date.now();
    this.isDragging = false;
    
    // Special handling for start cell when path is empty
    if (cell.classList.contains('start-cell') && this.gameController.state.userPath.length === 0) {
        console.log('Touch started on start cell with empty path');
        const startCellIndex = parseInt(cell.dataset.index);
        if (!isNaN(startCellIndex)) {
            console.log('Directly adding start cell to path:', startCellIndex);
            
            // Directly add to path
            this.gameController.state.userPath = [startCellIndex];
            
            // Update UI in multiple ways to ensure it works
            this.gameController.updatePathHighlight();
            
            if (this.gameController.pathManager) {
                this.gameController.pathManager.updatePathHighlight();
            }
            
            // Visual feedback
            this.addVisualFeedback(cell);
            
            // Show message
            this.gameController.showMessage('Path started! Continue by selecting connected cells.');
            
            // Update UI elements like buttons
            if (typeof this.gameController.updateUI === 'function') {
                this.gameController.updateUI();
            }
        }
    }
    
    // Add a visual indication that the cell is being touched
    cell.classList.add('touch-active');
}
    
    handleTouchMove(e) {
        if (!this.gameController.state.gameActive) return;
        
        // Only process the tracked touch
        let activeTouch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.activeTouch) {
                activeTouch = e.changedTouches[i];
                break;
            }
        }
        if (!activeTouch) return;
        
        // Always prevent default to avoid scrolling while interacting
        e.preventDefault();
        
        // Determine if we're in drag mode
        if (Date.now() - this.touchStartTime > this.dragThreshold) {
            this.isDragging = true;
        }
        
        // Find the element under the current touch point
        const element = document.elementFromPoint(activeTouch.clientX, activeTouch.clientY);
        if (!element) return;
        
        const cell = element.closest('.grid-cell');
        if (!cell || cell === this.lastTouchedCell) return;
        
        // Handle drag path building
        if (this.isDragging) {
            this.handleDragToNewCell(cell);
        }
    }
    
    handleDragToNewCell(cell) {
        // Path must be started before dragging can continue
        if (this.gameController.state.userPath.length === 0) {
            // If drag started on start cell, initialize path
            if (this.isStartCell(this.touchStartCell)) {
                const startCellIndex = parseInt(this.touchStartCell.dataset.index);
                if (!isNaN(startCellIndex)) {
                    this.gameController.state.userPath = [startCellIndex];
                    this.gameController.updatePathHighlight();
                    this.lastTouchedCell = this.touchStartCell;
                    this.gameController.showMessage('Path started! Continue by selecting connected cells.');
                }
            } else {
                // Can't start drag from non-start cell
                return;
            }
        }
        
        // Process new cell
        const cellIndex = parseInt(cell.dataset.index);
        if (isNaN(cellIndex)) return;
        
        const lastPathIndex = this.gameController.state.userPath[this.gameController.state.userPath.length - 1];
        
        // For deselection - if we drag back to previous cell
        if (this.gameController.state.userPath.length > 1 && 
            cellIndex === this.gameController.state.userPath[this.gameController.state.userPath.length - 2]) {
            // Remove last cell
            this.gameController.state.userPath.pop();
            this.gameController.updatePathHighlight();
            this.lastTouchedCell = cell;
            return;
        }
        
        // For new cell addition - must be valid move and not already in path
        if (this.isValidMove(cellIndex, lastPathIndex) && 
            !this.gameController.state.userPath.includes(cellIndex)) {
            // Add new cell to path
            this.gameController.state.userPath.push(cellIndex);
            this.gameController.updatePathHighlight();
            
            // Add visual feedback
            this.addVisualFeedback(cell);
            
            // Update button states
            document.getElementById('check-solution').disabled = false;
            
            // If end cell is selected, automatically check the solution
            if (this.isEndCell(cell)) {
                this.gameController.checkSolution();
            }
            
            // Update last touched cell
            this.lastTouchedCell = cell;
        }
    }
    
    handleTouchEnd(e) {
        if (!this.gameController.state.gameActive) return;
        
        // Find our active touch in the changed touches
        let activeTouchEnded = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.activeTouch) {
                activeTouchEnded = true;
                break;
            }
        }
        
        if (!activeTouchEnded) return;
        
        // If it was a short tap (not a drag), treat as click
        if (!this.isDragging && this.touchStartCell && 
            (Date.now() - this.touchStartTime < 300)) {
            this.gameController.handleCellClick(this.touchStartCell);
        }
        
        // Clean up
        this.cleanupTouchState();
    }
    
    handleTouchCancel(e) {
        if (!this.gameController.state.gameActive) return;
        
        // Find if our active touch was canceled
        let activeTouchCanceled = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.activeTouch) {
                activeTouchCanceled = true;
                break;
            }
        }
        
        if (activeTouchCanceled) {
            this.cleanupTouchState();
        }
    }
    
    cleanupTouchState() {
        // Remove any active touch highlights
        document.querySelectorAll('.grid-cell.touch-active').forEach(cell => {
            cell.classList.remove('touch-active');
        });
        
        // Remove any drag targets
        document.querySelectorAll('.drag-target').forEach(cell => {
            cell.classList.remove('drag-target');
        });
        
        // Reset touch tracking state
        this.touchStartCell = null;
        this.lastTouchedCell = null;
        this.isDragging = false;
        this.activeTouch = null;
    }
    
    // Update to touch-handler.js
// Focus on the enhanceStartCell method to ensure the start cell is clickable

// Replace the enhanceStartCell method in touch-handler.js with this updated version

// Replace the enhanceStartCell method in touch-handler.js with this version

enhanceStartCell() {
    console.log('TouchHandler: Enhancing start cell for better touch response');
    
    // This function applies special handling for the start cell
    const enhanceStartCellElements = () => {
        const startCells = document.querySelectorAll('.grid-cell.start-cell');
        
        if (startCells.length === 0) {
            // If start cells aren't found yet, try again later
            console.log('No start cells found, retrying in 100ms');
            setTimeout(enhanceStartCellElements, 100);
            return;
        }
        
        console.log(`Found ${startCells.length} start cells to enhance`);
        
        startCells.forEach(cell => {
            // Apply enhanced styling for better touch response
            cell.style.zIndex = '100';
            cell.style.position = 'relative';
            cell.style.touchAction = 'manipulation';
            cell.style.webkitTapHighlightColor = 'transparent';
            cell.style.transform = 'translateZ(0)'; // Hardware acceleration
            
            // Add multiple event listeners to ensure the start cell works reliably
            
            // 1. Direct click handler with minimal dependencies
            cell.onclick = (e) => {
                console.log('Start cell direct onclick handler triggered');
                
                if (!this.gameController.state.gameActive) {
                    console.log('Game not active, ignoring start cell click');
                    return;
                }
                
                // Only handle first selection
                if (this.gameController.state.userPath.length === 0) {
                    const cellIndex = parseInt(cell.dataset.index);
                    if (isNaN(cellIndex)) {
                        console.log('Invalid cell index, ignoring start cell click');
                        return;
                    }
                    
                    console.log('Adding start cell to path with index:', cellIndex);
                    
                    // Directly modify the path - CRITICAL PART
                    this.gameController.state.userPath = [cellIndex];
                    
                    // Update both ways
                    this.gameController.updatePathHighlight();
                    
                    if (this.gameController.pathManager) {
                        this.gameController.pathManager.updatePathHighlight();
                    }
                    
                    // Add visual feedback
                    this.addVisualFeedback(cell);
                    
                    // Show message
                    this.gameController.showMessage('Path started! Continue by selecting connected cells.');
                    
                    // Update UI (button states, etc)
                    if (typeof this.gameController.updateUI === 'function') {
                        this.gameController.updateUI();
                    }
                    
                    // Stop propagation
                    e.stopPropagation();
                    e.preventDefault();
                    
                    return false;
                }
            };
            
            // 2. Direct touchstart handler
            cell.addEventListener('touchstart', (e) => {
                console.log('Start cell direct touchstart handler triggered');
                
                if (!this.gameController.state.gameActive) {
                    console.log('Game not active, ignoring start cell touch');
                    return;
                }
                
                // Only handle first selection
                if (this.gameController.state.userPath.length === 0) {
                    const cellIndex = parseInt(cell.dataset.index);
                    if (isNaN(cellIndex)) {
                        console.log('Invalid cell index, ignoring start cell touch');
                        return;
                    }
                    
                    console.log('Adding start cell to path with index:', cellIndex);
                    
                    // Directly modify the path
                    this.gameController.state.userPath = [cellIndex];
                    
                    // Update both ways
                    this.gameController.updatePathHighlight();
                    
                    if (this.gameController.pathManager) {
                        this.gameController.pathManager.updatePathHighlight();
                    }
                    
                    // Add visual feedback
                    this.addVisualFeedback(cell);
                    
                    // Show message
                    this.gameController.showMessage('Path started! Continue by selecting connected cells.');
                    
                    // Update UI (button states, etc)
                    if (typeof this.gameController.updateUI === 'function') {
                        this.gameController.updateUI();
                    }
                    
                    // Stop propagation
                    e.stopPropagation();
                    e.preventDefault();
                    
                    return false;
                }
            }, { passive: false });
            
            // 3. Add mousedown and touchstart for immediate feedback
            cell.addEventListener('mousedown', () => {
                cell.classList.add('touch-active');
            });
            
            cell.addEventListener('mouseup', () => {
                cell.classList.remove('touch-active');
            });
            
            // Add a blinking animation to draw attention to the start cell
            setTimeout(() => {
                cell.classList.add('start-pulse');
                setTimeout(() => {
                    cell.classList.remove('start-pulse');
                }, 2000);
            }, 500);
        });
        
        // Add special styling for start cell
        const style = document.createElement('style');
        style.textContent = `
            .grid-cell.start-cell {
                position: relative !important;
                z-index: 100 !important;
                cursor: pointer !important;
            }
            
            .grid-cell.start-cell::after {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                border: 2px solid rgba(34, 197, 94, 0.6);
                border-radius: 4px;
                z-index: -1;
            }
            
            .grid-cell.start-cell.start-pulse {
                animation: start-cell-attention 1s 3;
            }
            
            @keyframes start-cell-attention {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                50% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }
            
            .grid-cell.touch-active {
                transform: scale(0.95) !important;
                transition: transform 0.1s ease-out !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('Start cell enhancement complete');
    };
    
    // Start the enhancement process
    enhanceStartCellElements();
}

// Add this method to your TouchHandler class to add additional initialization
// This should be called at the end of your init() method
applyStartCellFix() {
    console.log('Applying start cell fix');
    
    // Select all grid cells
    const gridCells = document.querySelectorAll('.grid-cell');
    
    // Add direct event handlers to all cells
    gridCells.forEach(cell => {
        // Check if it's a start cell
        if (cell.classList.contains('start-cell')) {
            // Direct handling of start cell when path is empty
            cell.addEventListener('click', (e) => {
                console.log('Start cell clicked (from fix)');
                
                if (!this.gameController.state.gameActive) return;
                
                if (this.gameController.state.userPath.length === 0) {
                    const cellIndex = parseInt(cell.dataset.index);
                    if (isNaN(cellIndex)) return;
                    
                    // Direct path modification
                    this.gameController.state.userPath = [cellIndex];
                    
                    // Update UI in multiple ways
                    this.gameController.updatePathHighlight();
                    
                    if (this.gameController.pathManager) {
                        this.gameController.pathManager.updatePathHighlight();
                    }
                    
                    // Add visual feedback
                    cell.classList.add('just-selected');
                    setTimeout(() => {
                        cell.classList.remove('just-selected');
                    }, 300);
                    
                    // Show message
                    this.gameController.showMessage('Path started! Continue by selecting connected cells.');
                    
                    // Stop event propagation
                    e.stopPropagation();
                    e.preventDefault();
                }
            });
        }
    });
    
    // Directly expose a method on window for emergency start cell handling
    window.addStartCell = (cellIndex) => {
        if (this.gameController && this.gameController.state) {
            if (this.gameController.state.userPath.length === 0) {
                this.gameController.state.userPath = [cellIndex];
                this.gameController.updatePathHighlight();
                
                if (this.gameController.pathManager) {
                    this.gameController.pathManager.updatePathHighlight();
                }
                
                // Update UI
                if (typeof this.gameController.updateUI === 'function') {
                    this.gameController.updateUI();
                }
                
                console.log('Emergency start cell handler added cell:', cellIndex);
                return true;
            }
        }
        return false;
    };
}
    
    applyTouchOptimizations() {
        // Improve all cells for better touch response
        document.querySelectorAll('.grid-cell').forEach(cell => {
            // Optimize for touch
            cell.style.touchAction = 'manipulation';
            cell.style.webkitTapHighlightColor = 'transparent';
            cell.style.userSelect = 'none';
            cell.style.webkitUserSelect = 'none';
            
            // Add touch-active style
            const touchActiveStyle = document.createElement('style');
            touchActiveStyle.textContent = `
                .grid-cell.touch-active {
                    transform: scale(0.95);
                    transition: transform 0.1s ease-out;
                }
                
                .grid-cell.just-selected {
                    animation: cell-pulse 0.3s ease-out;
                }
                
                @keyframes cell-pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(touchActiveStyle);
        });
    }
    
    addVisualFeedback(cell) {
        // Add a visual pulse effect
        cell.classList.add('just-selected');
        setTimeout(() => {
            cell.classList.remove('just-selected');
        }, 300);
    }
    
    // Helper methods
    isStartCell(cell) {
        return cell && cell.classList.contains('start-cell');
    }
    
    isEndCell(cell) {
        return cell && cell.classList.contains('end-cell');
    }
    
    isValidMove(newCellIndex, lastCellIndex) {
        // Convert indices to coordinates
        const x1 = newCellIndex % 10;
        const y1 = Math.floor(newCellIndex / 10);
        const x2 = lastCellIndex % 10;
        const y2 = Math.floor(lastCellIndex / 10);

        // Check if cells are adjacent (horizontally or vertically)
        return (Math.abs(x1 - x2) === 1 && y1 === y2) || 
               (Math.abs(y1 - y2) === 1 && x1 === x2);
    }
}

export default TouchHandler;
