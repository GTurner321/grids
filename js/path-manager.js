// path-manager.js
// Handles path state and path validation logic

import { addPathArrows } from './patharrows.js';
import { validatePath as validatePathMath, isPathContinuous } from './pathvalidator.js';

class PathManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.path = [];
    }
    
    // Initialize path
    resetPath() {
        this.path = [];
        this.updateUI();
        
        // Clear any path highlighting
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected', 'start-cell-selected', 'end-cell-selected', 'just-selected');
        });
        
        // Remove any path arrows
        document.querySelectorAll('.path-arrow').forEach(arrow => arrow.remove());
    }
    
    // Get current path
    getPath() {
        return this.path;
    }
    
    // Set path directly (useful for loading saved state)
    setPath(newPath) {
        this.path = [...newPath];
        this.updateUI();
        this.updatePathHighlight();
    }
    
    // Add cell to path
    addCell(cellIndex) {
        // Don't allow adding cells that are already in the path
        if (this.path.includes(cellIndex)) {
            // Unless it's the last cell, which would be deselection
            if (cellIndex === this.path[this.path.length - 1]) {
                this.removeLastCell();
                return true;
            }
            return false;
        }
        
        // Validate if the move is legal
        if (this.path.length > 0 && !this.isValidMove(cellIndex)) {
            return false;
        }
        
        // Add to path
        this.path.push(cellIndex);
        this.updateUI();
        this.updatePathHighlight();
        return true;
    }
    
    // Remove last cell from path
    removeLastCell() {
        if (this.path.length === 0) return false;
        
        this.path.pop();
        this.updateUI();
        this.updatePathHighlight();
        return true;
    }
    
    // Check if move from last cell to new cell is valid
    isValidMove(newCellIndex) {
        if (this.path.length === 0) return true;
        
        const lastCellIndex = this.path[this.path.length - 1];
        
        // Convert indices to coordinates
        const x1 = newCellIndex % 10;
        const y1 = Math.floor(newCellIndex / 10);
        const x2 = lastCellIndex % 10;
        const y2 = Math.floor(lastCellIndex / 10);
        
        // Check if cells are adjacent (horizontally or vertically)
        return (Math.abs(x1 - x2) === 1 && y1 === y2) || 
               (Math.abs(y1 - y2) === 1 && x1 === x2);
    }
    
    // Update path highlighting in the UI
    updatePathHighlight() {
        // Clear existing highlights and arrows
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected', 'start-cell-selected', 'end-cell-selected');
        });
        
        document.querySelectorAll('.path-arrow').forEach(arrow => arrow.remove());
        
        // Highlight path cells
        this.path.forEach((index, position) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (!cell) return;
            
            if (cell.classList.contains('start-cell')) {
                cell.classList.add('start-cell-selected');
            } else if (cell.classList.contains('end-cell')) {
                cell.classList.add('end-cell-selected');
            } else {
                cell.classList.add('selected');
            }
        });
        
        // Add path direction arrows
        addPathArrows(this.path, (index) => document.querySelector(`[data-index="${index}"]`));
    }
    
    // Validate entire path mathematically
    validatePath() {
        // First check if the path is continuous
        if (!isPathContinuous(this.path)) {
            return {
                isValid: false,
                error: 'Path must be continuous - cells must be adjacent!'
            };
        }
        
        // Then validate the mathematical sequence
        return validatePathMath(this.path, this.gameController.state.gridEntries);
    }
    
    // Update game UI elements based on path state
    updateUI() {
        // Update button states
        const checkButton = document.getElementById('check-solution');
        const resetButton = document.getElementById('reset-path');
        
        if (checkButton) {
            checkButton.disabled = this.path.length === 0;
        }
        
        if (resetButton) {
            resetButton.disabled = this.path.length === 0;
        }
    }
    
    // Check if the current path ends at the end cell
    endsAtEndCell() {
        if (this.path.length === 0) return false;
        
        const lastCellIndex = this.path[this.path.length - 1];
        const lastCell = document.querySelector(`[data-index="${lastCellIndex}"]`);
        
        return lastCell && lastCell.classList.contains('end-cell');
    }
    
    // Get the length of the current path
    getLength() {
        return this.path.length;
    }
    
    // Check if path length is valid for calculations (3n+1)
    hasValidMathLength() {
        return (this.path.length - 1) % 3 === 0;
    }
    
    // Mark the path as solved in the UI
    markAsSolved() {
        this.path.forEach((index, position) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (!cell) return;
            
            // Keep start cell dark green and end cell dark red
            if (position === 0) {
                // Start cell - keep it green/dark green
                cell.classList.add('start-cell-selected');
            } else if (position === this.path.length - 1) {
                // End cell - keep it red/dark red
                cell.classList.add('end-cell-selected');
            } else {
                // Middle cells - add solved path class for yellow
                cell.classList.add('user-solved-path');
            }
        });
    }
}

export default PathManager;
