// gamecontroller.js - Fixed Touch Handling
import { generatePath } from './pathgenerator.js';
import { generateSequence, sequenceToEntries, getLevelConfig } from './sequencegenerator.js';
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
            lastClickTime: 0,
            touchStartTime: 0,
            touchMoved: false
        };
        
        this.messageTimeout = null;
        
        document.querySelector('.game-container')?.classList.remove('game-active');

        this.initializeEventListeners();
        this.initializeGridInteractions();
        
        // Announce that game controller is ready
        console.log('Game controller initialized and ready');
        document.dispatchEvent(new CustomEvent('gameControllerReady'));
        
        // Listen for level start requests from level-selector
        document.addEventListener('startLevelRequest', (event) => {
            if (event.detail && typeof event.detail.level === 'number') {
                console.log(`Received startLevelRequest event for level ${event.detail.level}`);
                this.startLevel(event.detail.level);
            }
        });
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
        
        // Add reset path button handler
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
    
    // Get grid size from config
    const config = getLevelConfig(level);
    const gridSize = config.gridSize || 10;
    
    // Create appropriate sized grid entries array
    this.state.gridEntries = new Array(gridSize * gridSize).fill(null);
    this.state.removedCells.clear();
    this.state.gameActive = true;
    
    document.querySelector('.game-container').classList.add('game-active');
    
    scoreManager.startLevel(level);

    try {
        // Generate path with appropriate grid size
        this.state.path = await generatePath(gridSize);
        this.state.sequence = await generateSequence(level);
        this.state.sequenceEntries = sequenceToEntries(this.state.sequence);

        // Place sequence on path
        this.placeMathSequence();
        
        // For level 1, remove all spare cells
        if (level === 1) {
            this.removeAllSpareCells(true); // true for remove ALL
        } 
        // Otherwise fill remaining cells
        else {
            this.fillRemainingCells();
        }

        // For level 2, show suggestion to remove spare cells
        if (level === 2) {
            setTimeout(() => {
                this.showMessage('Hint: Consider removing spare cells to make the puzzle easier!', 'info', 5000);
            }, 1000);
        }

        // Render grid with appropriate size
        renderGrid(this.state.gridEntries, {
            startCoord: this.state.path[0],
            endCoord: this.state.path[this.state.path.length - 1],
            gridSize: gridSize
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
    // Get the current grid size
    const config = getLevelConfig(this.state.currentLevel);
    const gridSize = config.gridSize || 10;
    
    this.state.path.forEach((coord, index) => {
        if (index < this.state.sequenceEntries.length) {
            const cellIndex = coord[1] * gridSize + coord[0];
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

    // Helper method to check if a cell is the end cell
    isEndCell(cell) {
        return cell && cell.classList.contains('end-cell');
    }

    // Helper method to check if a cell is the start cell
    isStartCell(cell) {
        return cell && cell.classList.contains('start-cell');
    }

    // Simplified handling of cell click - works for both touch and mouse
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

        // Special handling for start cell when path is empty
        if (this.isStartCell(cell) && this.state.userPath.length === 0) {
            console.log('Start cell selected for new path');
            this.state.userPath = [cellIndex];
            this.updatePathHighlight();
            
            // Add a visual pulse effect
            cell.classList.add('just-selected');
            setTimeout(() => {
                cell.classList.remove('just-selected');
            }, 200);
            
            this.showMessage('Path started! Continue by selecting connected cells.');
            return;
        }

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
    if (this.state.userPath.length === 0) return true; // Any cell is valid as first cell
    
    const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
    
    // Get current grid size
    const config = getLevelConfig(this.state.currentLevel);
    const gridSize = config.gridSize || 10;
    
    // Convert indices to coordinates
    const x1 = newCellIndex % gridSize;
    const y1 = Math.floor(newCellIndex / gridSize);
    const x2 = lastCellIndex % gridSize;
    const y2 = Math.floor(lastCellIndex / gridSize);

    // Check if cells are adjacent (horizontally or vertically)
    return (Math.abs(x1 - x2) === 1 && y1 === y2) || 
           (Math.abs(y1 - y2) === 1 && x1 === x2);
}
    
    initializeGridInteractions() {
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;
        
        // IMPROVED: Direct and more reliable touch and click handlers
        
        // 1. Mouse click handler (simple and direct)
        gridContainer.addEventListener('click', (e) => {
            if (!this.state.gameActive) return;
            
            // Only handle clicks if this wasn't part of a drag/swipe
            if (this.state.touchMoved) {
                this.state.touchMoved = false;
                return;
            }
            
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                this.handleCellClick(cell);
            }
        });
        
        // 2. Touch handling (simplified and more reliable)
        gridContainer.addEventListener('touchstart', (e) => {
            if (!this.state.gameActive) return;
            
            // Store touch start info
            this.state.touchStartTime = Date.now();
            this.state.touchMoved = false;
            
            // Prevent page scrolling on grid
            e.preventDefault();
            
            // Get the initial touch target
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = element?.closest('.grid-cell');
            
            // Store the cell reference for touchend
            this.touchStartCell = cell;
            
            // CRITICAL FIX: For start cell, we need immediate visual feedback
            if (cell && this.isStartCell(cell) && this.state.userPath.length === 0) {
                cell.classList.add('touch-active');
            }
        }, { passive: false });
        
        // Track movement for swipe detection
        gridContainer.addEventListener('touchmove', (e) => {
            if (!this.state.gameActive) return;
            
            // Mark that we're dragging/swiping
            this.state.touchMoved = true;
            
            // Remove immediate touch feedback if present
            if (this.touchStartCell) {
                this.touchStartCell.classList.remove('touch-active');
            }
            
            // Continue with swipe path creation logic...
            // (existing touch drag logic remains largely unchanged)
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!element) return;
            
            const cell = element.closest('.grid-cell');
            if (!cell || cell === this.lastTouchedCell) return;
            
            // Handle path creation during swipe
            if (this.state.userPath.length === 0) {
                // If swiping from start cell, start path
                if (this.isStartCell(this.touchStartCell)) {
                    const startCellIndex = parseInt(this.touchStartCell.dataset.index);
                    this.state.userPath = [startCellIndex];
                    this.updatePathHighlight();
                    this.lastTouchedCell = this.touchStartCell;
                }
            } else {
                // Add new cells to path during swipe
                const cellIndex = parseInt(cell.dataset.index);
                const lastPathIndex = this.state.userPath[this.state.userPath.length - 1];
                
                // Handle backtracking
                if (this.state.userPath.length > 1 && 
                    cellIndex === this.state.userPath[this.state.userPath.length - 2]) {
                    this.state.userPath.pop();
                    this.updatePathHighlight();
                    this.lastTouchedCell = cell;
                    return;
                }
                
                // Add new cell if valid
                if (this.isValidMove(cellIndex) && !this.state.userPath.includes(cellIndex)) {
                    this.handleCellClick(cell);
                    this.lastTouchedCell = cell;
                }
            }
            
            e.preventDefault(); // Prevent scrolling during swipe
        }, { passive: false });
        
        // Handle touch end for tap detection
        gridContainer.addEventListener('touchend', (e) => {
            if (!this.state.gameActive) return;
            
            // Remove touch feedback
            if (this.touchStartCell) {
                this.touchStartCell.classList.remove('touch-active');
            }
            
            // If this was a short tap without much movement, handle as a click
            const touchDuration = Date.now() - this.state.touchStartTime;
            if (!this.state.touchMoved && touchDuration < 300 && this.touchStartCell) {
                this.handleCellClick(this.touchStartCell);
            }
            
            // Reset touch tracking
            this.touchStartCell = null;
            this.lastTouchedCell = null;
            
            // Reset touchMoved after a short delay to not interfere with click event
            setTimeout(() => {
                this.state.touchMoved = false;
            }, 50);
        });
        
        // 3. Add direct focus on the start cell (very important fix)
        setTimeout(() => {
            const startCells = document.querySelectorAll('.grid-cell.start-cell');
            startCells.forEach(cell => {
                // Enhance start cell for better touch detection
                cell.style.zIndex = '30';
                cell.style.position = 'relative';
                cell.style.touchAction = 'none';
                
                // Add dedicated tap handling for start cell
                cell.addEventListener('touchstart', (e) => {
                    if (!this.state.gameActive) return;
                    
                    // Add visual feedback
                    cell.classList.add('touch-active');
                    
                    // Prevent default to avoid any browser handling
                    e.preventDefault();
                    e.stopPropagation();
                }, { passive: false });
                
                cell.addEventListener('touchend', (e) => {
                    if (!this.state.gameActive) return;
                    
                    // Remove visual feedback
                    cell.classList.remove('touch-active');
                    
                    // If path is empty, handle start cell selection
                    if (this.state.userPath.length === 0) {
                        const cellIndex = parseInt(cell.dataset.index);
                        if (!isNaN(cellIndex)) {
                            console.log('Start cell selected via direct handler');
                            this.state.userPath = [cellIndex];
                            this.updatePathHighlight();
                            this.showMessage('Path started! Continue by selecting connected cells.');
                            
                            // Add visual feedback
                            cell.classList.add('just-selected');
                            setTimeout(() => {
                                cell.classList.remove('just-selected');
                            }, 200);
                        }
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                }, { passive: false });
            });
        }, 500);
        
        // Add button animation
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
        
        // Add CSS for touch active state
        const style = document.createElement('style');
        style.textContent = `
            .grid-cell.touch-active {
                transform: scale(1.1);
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
                z-index: 40;
                transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;
            }
            .grid-cell.start-cell.touch-active {
                background-color: #15803d;
            }
        `;
        document.head.appendChild(style);
    }
    
    removeAllSpareCells(removeAll = false) {
    const spareCells = this.state.gridEntries
        .map((entry, index) => (!entry?.isPartOfPath && !this.state.removedCells.has(index)) ? index : null)
        .filter(index => index !== null);

    if (spareCells.length === 0) {
        this.showMessage('No spare cells to remove!', 'info');
        return;
    }

    scoreManager.handleSpareRemoval();

    // Remove either all or 50% of spare cells
    const numToRemove = removeAll ? spareCells.length : Math.ceil(spareCells.length / 2);
    const cellsToRemove = spareCells
        .sort(() => Math.random() - 0.5)
        .slice(0, numToRemove);

    cellsToRemove.forEach(index => {
        this.state.removedCells.add(index);
        updateCell(index, null);
    });

    // Disable button after use or if level 1 (where all cells are already removed)
    document.getElementById('remove-spare').disabled = true;
    
    if (!removeAll) {
        this.showMessage(`Removed ${numToRemove} spare cells.`, 'info');
    }
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
            if (this.state.currentLevel < 10) {
                this.showMessage(`Ready for level ${this.state.currentLevel + 1}?`, 'info');
            } else {
                this.showMessage('You completed the highest level! Try again for a better score.', 'info');
            }
        }, 1500);
    }
    
    // Note: This is not the entire gamecontroller.js file, just the modifications needed
// to ensure grid size is properly handled for all grid operations in 6x6 grid levels.

// Modifications for the updatePathHighlight method
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
    
    // Get current grid size for proper arrow placement
    const config = getLevelConfig(this.state.currentLevel);
    const gridSize = config.gridSize || 10;
    
    // Add path direction arrows with the current grid size
    addPathArrows(this.state.userPath, 
                 (index) => document.querySelector(`[data-index="${index}"]`), 
                 gridSize);
}

// Modification for the checkSolution method
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
    
    // Get current grid size
    const config = getLevelConfig(this.state.currentLevel);
    const gridSize = config.gridSize || 10;
    
    // Validate mathematical correctness - pass current level explicitly
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

// Make getLevelConfig available directly on gameController for usage in patharrows.js
getLevelConfig(level) {
    // Re-export the function from sequencegenerator.js
    return getLevelConfig(level);
}

// Make validatePath method properly pass the current level
validatePath() {
    // Pass the current level to isPathContinuous
    if (!isPathContinuous(this.state.userPath, this.state.currentLevel)) {
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
