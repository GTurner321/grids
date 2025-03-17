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
        if (!this.gameController.state.gameActive) return;
        
        // Prevent multiple touch tracking - focus on first touch only
        if (this.activeTouch !== null) return;
        
        const touch = e.touches[0];
        this.activeTouch = touch.identifier;
        
        // Find the element at touch point
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return;
        
        const cell = element.closest('.grid-cell');
        if (!cell) return;
        
        // Always prevent default to avoid scrolling issues
        e.preventDefault();
        
        // Record touch start data
        this.touchStartCell = cell;
        this.lastTouchedCell = cell;
        this.touchStartTime = Date.now();
        this.isDragging = false;
        
        // Special handling for start cell when path is empty
        if (this.isStartCell(cell) && this.gameController.state.userPath.length === 0) {
            console.log('Touch started on start cell with empty path');
            const startCellIndex = parseInt(cell.dataset.index);
            if (!isNaN(startCellIndex)) {
                // Directly add to path
                this.gameController.state.userPath = [startCellIndex];
                this.gameController.updatePathHighlight();
                
                // Visual feedback
                this.addVisualFeedback(cell);
                
                // Show message
                this.gameController.showMessage('Path started! Continue by selecting connected cells.');
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
    
    enhanceStartCell() {
        // This function ensures the start cell is especially responsive to touch
        const enhanceStartCellElements = () => {
            const startCells = document.querySelectorAll('.grid-cell.start-cell');
            if (startCells.length === 0) {
                // If start cells aren't found yet, try again later
                setTimeout(enhanceStartCellElements, 100);
                return;
            }
            
            startCells.forEach(cell => {
                // Make the start cell more responsive
                cell.style.zIndex = '50'; // Higher z-index for priority
                cell.style.touchAction = 'manipulation';
                cell.style.webkitTapHighlightColor = 'transparent';
                
                // Add a dedicated touch handler just for start cell
                // This ensures the first touch is always registered
                cell.addEventListener('touchstart', (e) => {
                    if (!this.gameController.state.gameActive) return;
                    
                    // For first selection only
                    if (this.gameController.state.userPath.length === 0) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const cellIndex = parseInt(cell.dataset.index);
                        if (isNaN(cellIndex)) return;
                        
                        console.log('Direct start cell handler activated');
                        
                        // Directly modify the path
                        this.gameController.state.userPath = [cellIndex];
                        this.gameController.updatePathHighlight();
                        
                        // Visual feedback
                        this.addVisualFeedback(cell);
                        
                        // Show message
                        this.gameController.showMessage('Path started! Continue by selecting connected cells.');
                    }
                }, { passive: false });
                
                // Add click handler as fallback
                cell.addEventListener('click', (e) => {
                    if (!this.gameController.state.gameActive) return;
                    
                    // For first selection only
                    if (this.gameController.state.userPath.length === 0) {
                        const cellIndex = parseInt(cell.dataset.index);
                        if (isNaN(cellIndex)) return;
                        
                        console.log('Direct start cell click handler activated');
                        
                        // Direct path modification
                        this.gameController.state.userPath = [cellIndex];
                        this.gameController.updatePathHighlight();
                        
                        // Visual feedback
                        this.addVisualFeedback(cell);
                        
                        // Show message
                        this.gameController.showMessage('Path started! Continue by selecting connected cells.');
                        
                        // Prevent event propagation
                        e.stopPropagation();
                    }
                });
            });
            
            console.log('Start cell enhancement applied');
        };
        
        // Start the enhancement process
        enhanceStartCellElements();
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
