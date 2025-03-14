// gamecontroller.js - First Click Fix
import { generatePath } from './pathgenerator.js';
import { generateSequence, sequenceToEntries } from './sequencegenerator.js';
import { renderGrid, updateCell } from './gridrenderer.js';
import { validatePath as validatePathMath, isPathContinuous } from './pathvalidator.js';
import { scoreManager } from './scoremanager.js';
import { addPathArrows } from './patharrows.js';

class GameController {
    constructor() {
        // Store a global reference for easy access
        window.gameController = this;
        
        this.state = {
            currentLevel: null,
            path: [],
            sequence: [],
            sequenceEntries: [],
            userPath: [],
            gridEntries: new Array(100).fill(null),
            removedCells: new Set(),
            gameActive: false,
            lastClickTime: 0 // Track last click time to prevent double clicks
        };
        
        this.messageTimeout = null;
        
        document.querySelector('.game-container')?.classList.remove('game-active');

        this.initializeEventListeners();
        this.initializeGridInteractions();
    }

    initializeEventListeners() {
        console.log('Initializing game event listeners');
        
        // Level selection
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                console.log(`Level ${level} button clicked`);
                this.startLevel(level);
            });
        });

        // Game controls
        const checkButton = document.getElementById('check-solution');
        if (checkButton) {
            checkButton.addEventListener('click', () => {
                console.log('Check solution button clicked');
                if (this.state.userPath.length > 0) {
                    this.checkSolution();
                }
            });
        } else {
            console.error('Check solution button not found');
        }

        const removeButton = document.getElementById('remove-spare');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                console.log('Remove spare button clicked');
                this.removeAllSpareCells();
            });
        } else {
            console.error('Remove spare button not found');
        }
        
        // Add reset path button handler - FIXED
        const resetButton = document.getElementById('reset-path');
        if (resetButton) {
            // Update the button text to "Reset" while preserving the SVG
            const svgContent = resetButton.innerHTML.split('</svg>')[0] + '</svg>';
            resetButton.innerHTML = svgContent + ' Reset';
            
            resetButton.addEventListener('click', (e) => {
                console.log('Reset button clicked');
                e.preventDefault(); // Prevent any default behavior
                this.resetPath(); // Call the resetPath method
            });
        } else {
            console.error('Reset path button not found');
        }   
        
        console.log('Game event listeners initialized');
    }
    
    async startLevel(level) {
        // Reset state
        this.state.currentLevel = level;
        this.state.userPath = [];
        this.state.gridEntries = new Array(100).fill(null);
        this.state.removedCells.clear();
        this.state.gameActive = true;
        
        document.querySelector('.game-container').classList.add('game-active');
        
        scoreManager.startLevel(level);

        try {
            // Generate path and sequence
            this.state.path = await generatePath();
            this.state.sequence = await generateSequence(level);
            this.state.sequenceEntries = sequenceToEntries(this.state.sequence);

            // Place sequence on path
            this.placeMathSequence();
            
            // Fill remaining cells
            this.fillRemainingCells();

            // Render grid
            renderGrid(this.state.gridEntries, {
                startCoord: this.state.path[0],
                endCoord: this.state.path[this.state.path.length - 1]
            });

            // Update UI
            this.updateUI();
            this.showMessage('Find the path by following the mathematical sequence.');

        } catch (error) {
            console.error('Error starting level:', error);
            this.showMessage('Error starting game. Please try again.', 'error');
        }
    }
    
    placeMathSequence() {
        this.state.path.forEach((coord, index) => {
            if (index < this.state.sequenceEntries.length) {
                const cellIndex = coord[1] * 10 + coord[0];
                this.state.gridEntries[cellIndex] = {
                    ...this.state.sequenceEntries[index],
                    isPartOfPath: true,
                    pathIndex: index
                };
            }
        });
    }

    fillRemainingCells() {
        const remainingEntries = this.state.sequenceEntries.slice(this.state.path.length);
        const emptyCells = this.state.gridEntries
            .map((entry, index) => entry === null ? index : null)
            .filter(index => index !== null);

        // Shuffle remaining entries and empty cells
        const shuffledEntries = [...remainingEntries].sort(() => Math.random() - 0.5);
        const shuffledEmptyCells = emptyCells.sort(() => Math.random() - 0.5);

        shuffledEmptyCells.forEach((cellIndex, i) => {
            if (i < shuffledEntries.length) {
                this.state.gridEntries[cellIndex] = {
                    ...shuffledEntries[i],
                    isPartOfPath: false
                };
            } else {
                this.state.gridEntries[cellIndex] = {
                    type: 'number',
                    value: Math.floor(Math.random() * 20) + 1,
                    isPartOfPath: false
                };
            }
        });
    }

    updatePathHighlight() {
        // Clear existing highlights and arrows
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected', 'start-cell-selected', 'end-cell-selected');
        });
        
        document.querySelectorAll('.path-arrow').forEach(arrow => arrow.remove());

        // Highlight path cells
        this.state.userPath.forEach((index, position) => {
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
        addPathArrows(this.state.userPath, (index) => document.querySelector(`[data-index="${index}"]`));
    }

    // Helper method to check if a cell is the end cell
    isEndCell(cell) {
        return cell && cell.classList.contains('end-cell');
    }

    // Helper method to check if a cell is the start cell
    isStartCell(cell) {
        return cell && cell.classList.contains('start-cell');
    }

    handleCellClick(cell) {
        // Early exit if we don't have a valid cell or game is not active
        if (!cell || !this.state.gameActive) return;
        
        // Debounce clicks to prevent accidental double clicks
        const now = Date.now();
        if (now - this.state.lastClickTime < 200) { // 200ms threshold
            return;
        }
        this.state.lastClickTime = now;
        
        const cellIndex = parseInt(cell.dataset.index);
        if (isNaN(cellIndex)) return;

        // Handle deselection of last cell
        const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
        if (cellIndex === lastCellIndex) {
            this.state.userPath.pop();
            this.updatePathHighlight();
            return;
        }
        
        // Don't allow selection of cells already in path (except last cell for deselection)
        if (this.state.userPath.includes(cellIndex)) {
            return;
        }

        // Check if cell is adjacent to last selected cell
        if (!this.isValidMove(cellIndex)) {
            cell.classList.add('invalid-move');
            setTimeout(() => {
                cell.classList.remove('invalid-move');
            }, 300);
            return;
        }

        // Add the new cell to the path
        this.state.userPath.push(cellIndex);

        // Add a visual pulse effect
        cell.classList.add('just-selected');
        setTimeout(() => {
            cell.classList.remove('just-selected');
        }, 200);

        this.updatePathHighlight();

        // Explicitly update reset button state
        const resetButton = document.getElementById('reset-path');
        if (resetButton && this.state.userPath.length > 0) {
            resetButton.disabled = false;
        }

        // Enable check solution button
        document.getElementById('check-solution').disabled = false;

        // If end cell is selected, automatically check the solution
        if (this.isEndCell(cell)) {
            this.checkSolution();
        }
    }

    isValidMove(newCellIndex) {
        const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
        
        // Convert indices to coordinates
        const x1 = newCellIndex % 10;
        const y1 = Math.floor(newCellIndex / 10);
        const x2 = lastCellIndex % 10;
        const y2 = Math.floor(lastCellIndex / 10);

        // Check if cells are adjacent (horizontally or vertically)
        return (Math.abs(x1 - x2) === 1 && y1 === y2) || 
               (Math.abs(y1 - y2) === 1 && x1 === x2);
    }

    initializeGridInteractions() {
        const gridContainer = document.getElementById('grid-container');
        
        // Track touch and drag state
        let touchStartTime = 0;
        let touchStartCell = null;
        let lastTouchedCell = null;
        let isDragging = false;
        
        // Direct click handler for all cells (Fix #4: Single-click handling)
        gridContainer.addEventListener('click', (e) => {
            if (!this.state.gameActive) return;
            
            const cell = e.target.closest('.grid-cell');
            if (!cell) return;
            
            // Handle first click on start cell specially to fix single-click issue
            if (this.isStartCell(cell) && this.state.userPath.length === 0) {
                console.log('Start cell clicked directly');
                const cellIndex = parseInt(cell.dataset.index);
                if (isNaN(cellIndex)) return;
                
                this.state.userPath = [cellIndex];
                this.updatePathHighlight();
                this.showMessage('Path started! Continue by selecting connected cells.');
                return;
            }
            
            // For all other cells, use the regular handler
            this.handleCellClick(cell);
        });
        
        // Mouse down handler - prevent text selection
        gridContainer.addEventListener('mousedown', (e) => {
            if (!this.state.gameActive) return;
            
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                e.preventDefault(); // Prevent text selection
            }
        });
        
        // Touch event handling - optimized for mobile
        gridContainer.addEventListener('touchstart', (e) => {
            if (!this.state.gameActive) return;
            
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!element) return;
            
            const cell = element.closest('.grid-cell');
            if (cell) {
                e.preventDefault(); // Prevent scrolling
                touchStartCell = cell;
                lastTouchedCell = cell;
                touchStartTime = Date.now();
                isDragging = false;
                
                // If starting at the green cell and path is empty, add it to path immediately
                // This makes the cell "selected" so drag can continue from it
                if (this.isStartCell(cell) && this.state.userPath.length === 0) {
                    const startCellIndex = parseInt(cell.dataset.index);
                    this.state.userPath = [startCellIndex];
                    this.updatePathHighlight();
                    this.showMessage('Path started! Continue by selecting connected cells.');
                }
            }
        }, { passive: false });
        
        gridContainer.addEventListener('touchmove', (e) => {
            if (!this.state.gameActive) return;
            e.preventDefault(); // Prevent scrolling
            
            // Mark that we're dragging
            if (Date.now() - touchStartTime > 100) {
                isDragging = true;
            }
            
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!element) return;
            
            const cell = element.closest('.grid-cell');
            if (!cell || cell === lastTouchedCell) return;
            
            // In drag mode, process cells
            if (isDragging) {
                // Start path if needed
                if (this.state.userPath.length === 0) {
                    // If we're dragging from start cell, automatically start the path
                    if (this.isStartCell(touchStartCell)) {
                        // Add start cell to path
                        const startCellIndex = parseInt(touchStartCell.dataset.index);
                        this.state.userPath = [startCellIndex];
                        this.updatePathHighlight();
                        lastTouchedCell = touchStartCell;
                        this.showMessage('Path started! Continue by selecting connected cells.');
                    } else {
                        return; // Can't start drag from non-start cell
                    }
                }
                
                // Validate the new cell
                const cellIndex = parseInt(cell.dataset.index);
                const lastPathIndex = this.state.userPath[this.state.userPath.length - 1];
                
                // For deselection - if we drag back to previous cell
                if (this.state.userPath.length > 1 && 
                    cellIndex === this.state.userPath[this.state.userPath.length - 2]) {
                    this.state.userPath.pop(); // Remove last cell
                    this.updatePathHighlight();
                    lastTouchedCell = cell;
                    return;
                }
                
                // For new cell addition - must be valid move and not already in path
                if (this.isValidMove(cellIndex) && !this.state.userPath.includes(cellIndex)) {
                    this.handleCellClick(cell);
                    lastTouchedCell = cell;
                }
            }
        }, { passive: false });
        
        gridContainer.addEventListener('touchend', (e) => {
            if (!this.state.gameActive) return;
            
            // If it was a short tap (not a drag), treat as click
            if (!isDragging && touchStartCell && Date.now() - touchStartTime < 300) {
                this.handleCellClick(touchStartCell);
            }
            
            // Reset touch tracking
            touchStartCell = null;
            lastTouchedCell = null;
            isDragging = false;
        });
        
        // Clean up any hover states when touch/mouse interaction ends
        const clearDragTargets = () => {
            document.querySelectorAll('.drag-target').forEach(cell => {
                cell.classList.remove('drag-target');
            });
        };
        
        gridContainer.addEventListener('mouseleave', clearDragTargets);
        gridContainer.addEventListener('touchend', clearDragTargets);
        gridContainer.addEventListener('touchcancel', clearDragTargets);
        
        // Add button animation (ADDITIONAL FIX #2: Pulse animation instead of color change)
        const controlButtons = document.querySelectorAll('.game-controls button');
        controlButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Add animation class
                button.classList.add('clicked');
                
                // Remove class after animation completes
                setTimeout(() => {
                    button.classList.remove('clicked');
                }, 500); // 0.5 seconds matching the CSS animation
            });
        });
    }
    
    removeAllSpareCells() {
        const spareCells = this.state.gridEntries
            .map((entry, index) => (!entry?.isPartOfPath && !this.state.removedCells.has(index)) ? index : null)
            .filter(index => index !== null);

        if (spareCells.length === 0) {
            this.showMessage('No spare cells to remove!', 'info');
            return;
        }

        scoreManager.handleSpareRemoval();

        // Remove 50% of spare cells
        const numToRemove = Math.ceil(spareCells.length / 2);
        const cellsToRemove = spareCells
            .sort(() => Math.random() - 0.5)
            .slice(0, numToRemove);

        cellsToRemove.forEach(index => {
            this.state.removedCells.add(index);
            updateCell(index, null);
        });

        // Disable button after use
        document.getElementById('remove-spare').disabled = true;
        this.showMessage(`Removed ${numToRemove} spare cells.`, 'info');
    }

    checkSolution() {
        // First, check if the path meets the required length formula (3n+1)
        if ((this.state.userPath.length - 1) % 3 !== 0) {
            scoreManager.handleCheck(false);
            this.showMessage('Path length must be 4, 7, 10, 13, etc. (3n+1) to represent complete calculations.', 'error', 10000);
            return;
        }
        
        // Check if path ends at the red cell
        const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
        const lastCell = document.querySelector(`[data-index="${lastCellIndex}"]`);
        const endsAtRedCell = this.isEndCell(lastCell);
        
        // Validate mathematical correctness
        const validation = this.validatePath();
        
        if (validation.isValid) {
            if (endsAtRedCell) {
                // Path is valid and ends at the red cell - success!
                scoreManager.handleCheck(true);
                this.handlePuzzleSolved();
            } else {
                scoreManager.handleCheck(false);
                this.showMessage('Path is mathematically correct! Continue to the end square.', 'info');
            }
        } else {
            scoreManager.handleCheck(false);
            
            // Show error message with specific details
            if (validation.error) {
                this.showMessage(validation.error, 'error', 10000);
            } else {
                this.showMessage('Mathematical error in the path. Try again.', 'error', 10000);
            }
            
            // Truncate the path to keep only valid calculations if we know where the error occurred
            if (validation.failedAt !== undefined) {
                this.state.userPath = this.state.userPath.slice(0, validation.failedAt);
                this.updatePathHighlight();
            }
        }
        
        this.updateUI();
    }

    handlePuzzleSolved() {
        // Display success message
        this.showMessage('Congratulations! Puzzle solved!', 'success');
        
        // Update score
        scoreManager.completePuzzle();
        
        // Mark cells in the path as solved, but preserve start and end cell colors
        this.state.userPath.forEach((index, position) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (!cell) return;
            
            // Keep start cell dark green and end cell dark red
            if (position === 0) {
                // Start cell - keep it green/dark green
                cell.classList.add('start-cell-selected');
            } else if (position === this.state.userPath.length - 1) {
                // End cell - keep it red/dark red
                cell.classList.add('end-cell-selected');
            } else {
                // Middle cells - add solved path class for yellow
                cell.classList.add('user-solved-path');
            }
        });
        
        // Delay before enabling next level
        setTimeout(() => {
            // Disable game to prevent further interaction with this puzzle
            this.state.gameActive = false;
            
            // Update UI to reflect completion
            this.updateUI();
            
            // Suggestion for next level if not at max level
            if (this.state.currentLevel < 5) {
                this.showMessage(`Ready for level ${this.state.currentLevel + 1}?`, 'info');
            } else {
                this.showMessage('You completed the highest level! Try again for a better score.', 'info');
            }
        }, 1500);
    }
    
    validatePath() {
        // First check if the path is continuous
        if (!isPathContinuous(this.state.userPath)) {
            return {
                isValid: false,
                error: 'Path must be continuous - cells must be adjacent!'
            };
        }

        // Then validate the mathematical sequence
        return validatePathMath(this.state.userPath, this.state.gridEntries);
    }

    resetPath() {
        console.log('resetPath method called');
        
        try {
            if (!this.state.gameActive) {
                console.log('Game not active, reset path aborted');
                return;
            }
            
            // Reset user path array
            this.state.userPath = [];
            console.log('User path reset to empty array');
            
            // Clear path highlighting from all cells
            document.querySelectorAll('.grid-cell').forEach(cell => {
                cell.classList.remove('selected', 'start-cell-selected', 'end-cell-selected', 'just-selected');
            });
            console.log('Cell highlighting cleared');
            
            // Remove any path arrows
            const arrows = document.querySelectorAll('.path-arrow');
            arrows.forEach(arrow => arrow.remove());
            console.log(`${arrows.length} path arrows removed`);
            
            // Call updatePathHighlight to ensure consistent state
            this.updatePathHighlight();
            
            // Update UI elements (button states, etc.)
            this.updateUI(); // This will disable the button again since the path is now empty
            
            // Show feedback message
            this.showMessage('Path reset. Start again from the green square.');
            console.log('Path reset complete');
        } catch (error) {
            console.error('Error during path reset:', error);
            this.showMessage('Error resetting path. Please try again.', 'error');
        }
    }
    
    updateUI() {
        // Update button states
        const checkButton = document.getElementById('check-solution');
        const removeButton = document.getElementById('remove-spare');
        const resetButton = document.getElementById('reset-path');
        
        if (checkButton) {
            checkButton.disabled = !this.state.gameActive || this.state.userPath.length === 0;
        }
        
        if (removeButton) {
            removeButton.disabled = !this.state.gameActive || this.state.removedCells.size > 0;
        }
        
        if (resetButton) {
            // Only disable when game is not active OR path is empty
            resetButton.disabled = !this.state.gameActive || this.state.userPath.length === 0;
        }

        // Update level buttons
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === this.state.currentLevel);
        });
    }
   
    showMessage(text, type = 'info', duration = null) {
        const messageElement = document.getElementById('game-messages');
        if (messageElement) {
            // Clear any existing timeout
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout);
                this.messageTimeout = null;
            }
            
            // Clear previous content
            messageElement.innerHTML = '';
            
            // Check if this is a message that needs a penalty line
            if (text.includes('Removed')) {
                // Main message
                const mainMessage = document.createElement('div');
                mainMessage.textContent = text;
                messageElement.appendChild(mainMessage);
                
                // Penalty message
                const penaltyMessage = document.createElement('div');
                penaltyMessage.className = 'penalty-message';
                penaltyMessage.textContent = '(-1/3 points)';
                messageElement.appendChild(penaltyMessage);
            } 
            else if (text === 'Path is mathematically correct! Continue to the end square.') {
                // Changed message (ADDITIONAL FIX #1)
                const mainMessage = document.createElement('div');
                mainMessage.textContent = 'Path is mathematically correct!';
                messageElement.appendChild(mainMessage);
                
                // Penalty message
                const penaltyMessage = document.createElement('div');
                penaltyMessage.className = 'penalty-message';
                penaltyMessage.textContent = '(-1/4 points)';
                messageElement.appendChild(penaltyMessage);
            }
            else {
                // Regular message without penalty
                messageElement.textContent = text;
            }
            
            messageElement.className = type ? `message-box ${type}` : 'message-box';
            
            if (duration) {
                this.messageTimeout = setTimeout(() => {
                    messageElement.textContent = '';
                    messageElement.className = 'message-box';
                    this.messageTimeout = null;
                }, duration);
            }
        }
    }
}

// Initialize game and store reference
window.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
    
    // Enhanced touch support for start cell
    setTimeout(function() {
        console.log('Enhancing touch support for cells...');
        
        // Add enhanced touch handling for start cell
        const enhanceStartCell = function() {
            const startCells = document.querySelectorAll('.grid-cell.start-cell');
            if (startCells.length === 0) {
                setTimeout(enhanceStartCell, 100);
                return;
            }
            
            startCells.forEach(cell => {
                // Make start cell more noticeable with CSS
                cell.style.zIndex = '30';
                cell.style.touchAction = 'manipulation';
                cell.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
                
                // Add specific tap handler just for start cell
                cell.addEventListener('touchstart', function(e) {
                    if (!window.gameController || 
                        !window.gameController.state || 
                        !window.gameController.state.gameActive) return;
                    
                    // Directly handle the start cell tap
                    if (window.gameController.state.userPath.length === 0) {
                        e.preventDefault(); // Prevent scrolling
                        e.stopPropagation(); // Stop event bubbling
                        
                        const cellIndex = parseInt(cell.dataset.index);
                        if (isNaN(cellIndex)) return;
                        
                        console.log('Start cell tapped directly via enhanced handler');
                        
                        // Add cell to path
                        window.gameController.state.userPath = [cellIndex];
                        window.gameController.updatePathHighlight();
                        window.gameController.showMessage('Path started! Continue by selecting connected cells.');
                        
                        // Visual feedback
                        cell.classList.add('start-cell-selected');
                        
                        // Add a brief pulse effect for feedback
                        cell.classList.add('just-selected');
                        setTimeout(() => {
                            cell.classList.remove('just-selected');
                        }, 300);
                    }
                }, { passive: false });
                
                // iOS fallback using touchend
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    cell.addEventListener('touchend', function(e) {
                        if (!window.gameController || 
                            !window.gameController.state || 
                            !window.gameController.state.gameActive) return;
                            
                        if (window.gameController.state.userPath.length === 0) {
                            const cellIndex = parseInt(cell.dataset.index);
                            if (isNaN(cellIndex)) return;
                            
                            console.log('iOS fallback: Start cell tapped via touchend');
                            window.gameController.state.userPath = [cellIndex];
                            window.gameController.updatePathHighlight();
                            window.gameController.showMessage('Path started! Continue by selecting connected cells.');
                        }
                    });
                }
            });
            
            console.log('Start cell enhancement applied');
        };
        
        enhanceStartCell();
        
        // Improve all grid cells for better touch response
        const gridCells = document.querySelectorAll('.grid-cell');
        gridCells.forEach(cell => {
            cell.style.touchAction = 'manipulation';
            cell.style.webkitUserSelect = 'none';
            cell.style.userSelect = 'none';
        });
        
    }, 500); // Wait for game to initialize
});

export default GameController;
