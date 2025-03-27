// gamecontroller.js - Updated for border-based path visualization with improved initialization
import { generatePath } from './pathgenerator.js';
import { generateSequence, sequenceToEntries, getLevelConfig } from './sequencegenerator.js';
import { renderGrid, updateCell } from './gridrenderer.js';
import { validatePath as validatePathMath, isPathContinuous } from './pathvalidator.js';
import { scoreManager } from './scoremanager.js';
import { addPathBorders, addBorderStyles, removeAllPathBorders, drawCompleteBorders } from './cell-borders.js';

class GameController {
    constructor() {
        console.log('Initializing game controller...');
        
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
            lastClickTime: 0, // Track last click time to prevent double clicks
            touchStartTime: 0, // Track when a touch started
            touchMoved: false // Track if touch moved (for distinguishing taps from swipes)
        };
        
        this.messageTimeout = null;

        // Initialize border styles
        addBorderStyles();
        
        document.querySelector('.game-container')?.classList.remove('game-active');

        // Only initialize event listeners if DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
                this.initializeGridInteractions();
                this.initializeButtonAnimations();
                
                // Signal that controller is fully initialized
                this.signalReady();
            });
        } else {
            this.initializeEventListeners();
            this.initializeGridInteractions();
            this.initializeButtonAnimations();
            
            // Signal that controller is fully initialized
            this.signalReady();
        }
    }

    // Signal that the game controller is fully initialized and ready
    signalReady() {
        console.log('Game controller initialized and ready');
        document.dispatchEvent(new CustomEvent('gameControllerReady'));
    }

initializeEventListeners() {
    console.log('Initializing game event listeners');
    
    const levelButtons = document.querySelectorAll('.level-btn');
    console.log(`Found ${levelButtons.length} level buttons to attach listeners to`);
    
    // Original level button listeners (can keep these for direct buttons)
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const level = parseInt(btn.dataset.level);
            console.log(`Level ${level} button clicked`);
            this.startLevel(level);
        });
    });
    
    // ADD THE NEW EVENT DELEGATION CODE HERE
    document.addEventListener('click', (event) => {
        const levelBtn = event.target.closest('.level-btn, .level-btn-scrollable');
        if (levelBtn && levelBtn.dataset.level) {
            const level = parseInt(levelBtn.dataset.level);
            console.log(`Level ${level} button clicked via delegation`);
            this.startLevel(level);
        }
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
        
        // Initialize button animations for pulse effect without persistent states
        this.initializeButtonAnimations();
        
        console.log('Game event listeners initialized');
    }
    
    async startLevel(level) {
        console.log(`Starting level ${level}`);
        
        // Reset state for the new level
        this.state.currentLevel = level;
        this.state.userPath = [];
        
        // Get grid size from config
        const config = getLevelConfig(level);
        const gridSize = config.gridSize || 10;
        
        // Create appropriate sized grid entries array
        this.state.gridEntries = new Array(gridSize * gridSize).fill(null);
        this.state.removedCells.clear();
        this.state.gameActive = true;
        
        // Mark the game container as active
        document.querySelector('.game-container')?.classList.add('game-active');
        
        // Initialize scoring for the level
        scoreManager.startLevel(level);

        // Reset the remove-spare button state
        const removeButton = document.getElementById('remove-spare');
        if (removeButton) {
            // Reset visibility and state
            removeButton.classList.remove('used');
            removeButton.disabled = false;
            
            // Reset the game controls layout
            const gameControls = document.querySelector('.game-controls');
            if (gameControls) {
                gameControls.classList.remove('two-buttons');
            }
            
            // Handle level-specific button visibility
            if (level === 1) {
                // Hide the button for level 1 where it's not needed
                removeButton.style.display = 'none';
            } else {
                // Show the button for all other levels
                removeButton.style.display = '';
            }
        }

        try {
            // Generate path with appropriate grid size
            this.state.path = await generatePath(gridSize);
            this.state.sequence = await generateSequence(level);
            this.state.sequenceEntries = sequenceToEntries(this.state.sequence);

            // Place sequence on path
            this.placeMathSequence();
            
            // Level-specific setup
            if (level === 1) {
                // For level 1, remove all spare cells automatically
                this.removeAllSpareCells(true); // true for remove ALL
            } else {
                // For other levels, fill remaining cells with numbers
                this.fillRemainingCells();
            }

            // For level 2, show suggestion to remove spare cells
            if (level === 2) {
                setTimeout(() => {
                    this.showMessage('Hint: the 'X SPARES' button removes some of the spare cells and makes the puzzle easier!', 'info', 10000);
                }, 0);
            }

            // Ensure grid container visibility is set properly
            const gridContainer = document.getElementById('grid-container');
            if (gridContainer) {
                gridContainer.style.visibility = 'visible';
                gridContainer.style.height = 'auto';
                gridContainer.style.backgroundColor = '#94a3b8';
            }

            // Render grid with appropriate size
            renderGrid(this.state.gridEntries, {
                startCoord: this.state.path[0],
                endCoord: this.state.path[this.state.path.length - 1],
                gridSize: gridSize
            });

            // Update UI elements and buttons
            this.updateUI();
            this.showMessage('Find the path by following the mathematical sequence.');
            
            console.log(`Level ${level} started successfully`);
            
            // Update level scroller if available
            if (window.levelScroller && typeof window.levelScroller.setCurrentLevel === 'function') {
                window.levelScroller.setCurrentLevel(level);
            }

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

    updatePathHighlight() {
        // Clear existing highlights
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected', 'start-cell-selected', 'end-cell-selected');
        });

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
        
        // Get current grid size for proper border placement
        const config = getLevelConfig(this.state.currentLevel);
        const gridSize = config.gridSize || 10;
        
        // Add path borders with the current grid size
        addPathBorders(this.state.userPath, 
                     (index) => document.querySelector(`[data-index="${index}"]`), 
                     gridSize);
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
    
    initializeButtonAnimations() {
    const controlButtons = document.querySelectorAll('.game-controls button');
    controlButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Add animation class
            button.classList.add('clicked');
            
            // Remove ALL state classes after animation completes
            setTimeout(() => {
                button.classList.remove('clicked', 'active', 'selected');
            }, 300); // Reduced from 500ms to match animation duration
        });
    });
}
    
    initializeGridInteractions() {
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) {
            console.warn('Grid container not found, will try to initialize later');
            // Set a retry for when the DOM might be ready
            setTimeout(() => this.initializeGridInteractions(), 500);
            return;
        }
        
        console.log('Initializing grid interactions');
        
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
        this.enhanceStartCells();
        
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
        
        console.log('Grid interactions initialized');
    }
    
    // Separate method to enhance start cells for better touch handling
    enhanceStartCells() {
        // Wait for DOM to be fully loaded
        setTimeout(() => {
            const startCells = document.querySelectorAll('.grid-cell.start-cell');
            if (startCells.length === 0) {
                // No start cells found yet, try again later
                console.log('No start cells found, will try again');
                setTimeout(() => this.enhanceStartCells(), 500);
                return;
            }
            
            console.log(`Enhancing ${startCells.length} start cells for touch handling`);
            
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
    }
    
    removeAllSpareCells(removeAll = false) {
        // Find all spare cells that can be removed
        const spareCells = this.state.gridEntries
            .map((entry, index) => (!entry?.isPartOfPath && !this.state.removedCells.has(index)) ? index : null)
            .filter(index => index !== null);

        // Check if there are any spare cells to remove
        if (spareCells.length === 0) {
            this.showMessage('No spare cells to remove!', 'info');
            return;
        }

        // Handle score penalty for using this feature
        scoreManager.handleSpareRemoval();

        // Determine how many cells to remove (all or 50%)
        const numToRemove = removeAll ? spareCells.length : Math.ceil(spareCells.length / 2);
        
        // Randomly select cells to remove
        const cellsToRemove = spareCells
            .sort(() => Math.random() - 0.5)
            .slice(0, numToRemove);

        // Remove the selected cells
        cellsToRemove.forEach(index => {
            this.state.removedCells.add(index);
            updateCell(index, null);
        });

        // Disable the button after use
        const removeButton = document.getElementById('remove-spare');
        if (removeButton) {
            // Disable the button functionally
            removeButton.disabled = true;
            
            // Add 'used' class to visually hide the button with transition
            removeButton.classList.add('used');
            
            // Adjust the game controls layout 
            const gameControls = document.querySelector('.game-controls');
            if (gameControls) {
                gameControls.classList.add('two-buttons');
            }
        }
        
        // Show feedback message unless this is an automatic removal (level 1)
        if (!removeAll) {
            this.showMessage(`Removed ${numToRemove} spare cells.`, 'info');
        }
    }
    
// Modified checkSolution method to handle partial paths
checkSolution() {
    // First, determine the largest 3n+1 value that fits within the current path length
    const pathLength = this.state.userPath.length;
    const maxCompleteSteps = Math.floor((pathLength - 1) / 3);
    const maxValidLength = maxCompleteSteps * 3 + 1;
    const remainingCells = pathLength - maxValidLength;
    
    // Get current grid size
    const config = getLevelConfig(this.state.currentLevel);
    const gridSize = config.gridSize || 10;
    
    // Check if path ends at the red cell
    const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
    const lastCell = document.querySelector(`[data-index="${lastCellIndex}"]`);
    const endsAtRedCell = this.isEndCell(lastCell);
    
    // If path is too short to even have one complete calculation
    if (maxCompleteSteps === 0) {
        scoreManager.handleCheck(false);
        this.showMessage('Path is too short. You need at least 4 cells to form a complete calculation.', 'error', 10000);
        return;
    }
    
    // If path is a perfect 3n+1 length
    const isPerfectLength = (pathLength - 1) % 3 === 0;
    
    // Validate the path calculations (only checking the valid portion)
    const validation = this.validatePartialPath(maxValidLength);
    
    if (validation.isValid) {
        // Path is mathematically correct up to the valid length
        if (isPerfectLength) {
            // Path is a perfect 3n+1 length and valid
            if (endsAtRedCell) {
                // Path ends at red cell - complete success!
                scoreManager.handleCheck(true);
                this.handlePuzzleSolved();
            } else {
                scoreManager.handleCheck(false);
                this.showMessage('Path is mathematically correct! Continue to the end square.', 'info');
            }
        } else {
            // Path is valid but has extra cells in an incomplete calculation
            scoreManager.handleCheck(false);
            this.showMessage(`The path is mathematically correct until the ${maxValidLength}th cell, but you haven't completed your last sum.`, 'info', 10000);
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

// New method to validate a partial path
validatePartialPath(maxValidLength) {
    // Get a slice of the path up to maxValidLength
    const validPathSlice = this.state.userPath.slice(0, maxValidLength);
    
    // Get the current grid size from the level config
    const config = getLevelConfig(this.state.currentLevel);
    const gridSize = config.gridSize || 10;
    
    // First manually check path continuity with the correct grid size
    for (let i = 1; i < validPathSlice.length; i++) {
        const prevIndex = validPathSlice[i-1];
        const currIndex = validPathSlice[i];
        
        const prevX = prevIndex % gridSize;
        const prevY = Math.floor(prevIndex / gridSize);
        const currX = currIndex % gridSize;
        const currY = Math.floor(currIndex / gridSize);
        
        const isAdjacent = (Math.abs(prevX - currX) === 1 && prevY === currY) || 
                    (Math.abs(prevY - currY) === 1 && prevX === currX);
        
        if (!isAdjacent) {
            return {
                isValid: false,
                error: 'Path must be continuous - cells must be adjacent!'
            };
        }
    }
    
    // Use the existing validatePath function but with the sliced path
    return validatePathMath(validPathSlice, this.state.gridEntries);
}

// Modified handlePuzzleSolved method for GameController

handlePuzzleSolved() {
    console.log("PUZZLE SOLVED! Congratulations message and score updates coming next...");
    
    // Immediately disable all game control buttons when puzzle is solved
    const checkButton = document.getElementById('check-solution');
    const removeButton = document.getElementById('remove-spare');
    const resetButton = document.getElementById('reset-path');
    
    if (checkButton) checkButton.disabled = true;
    if (removeButton) removeButton.disabled = true;
    if (resetButton) resetButton.disabled = true;
    
    // Important: First update level tracker's completed levels
    if (window.levelTracker) {
        console.log(`Marking level ${this.state.currentLevel} as completed in level tracker`);
        window.levelTracker.markLevelCompleted(this.state.currentLevel);
    }
    
    // Unlock message based on completed level
    let successMessage = 'Congratulations! Puzzle solved!';
    
    // If level unlocker exists, handle level completion
    if (window.levelUnlocker) {
        successMessage = window.levelUnlocker.handleLevelCompletion(this.state.currentLevel);
    }
    
    // Directly update level scroller to reflect newly unlocked levels
    if (window.levelScroller) {
        window.levelScroller.updateVisibleLevel();
    }
    
    // Display success message
    this.showMessage(successMessage, 'success');
    
    // Update score
    scoreManager.completePuzzle();
    
    // Mark cells in the path as solved
    this.state.userPath.forEach((index, position) => {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (!cell) return;
        
        // Don't change the start and end cell colors
        if (position === 0) {
            // Start cell - keep it green/dark green
            cell.classList.add('start-cell-selected');
        } else if (position === this.state.userPath.length - 1) {
            // End cell - keep it red/dark red
            cell.classList.add('end-cell-selected');
        } else {
            // Middle cells - add solved path class for yellow
            cell.classList.add('user-solved-path');
            
            // Remove 'selected' class to ensure the yellow color shows
            cell.classList.remove('selected');
        }
    });
    
    // Ensure ALL borders are fully drawn on the completed path
    const config = getLevelConfig(this.state.currentLevel);
    const gridSize = config.gridSize || 10;
    
    // Use drawCompleteBorders instead of addPathBorders to ensure all appropriate borders are shown
    drawCompleteBorders(this.state.userPath, 
                 (index) => document.querySelector(`[data-index="${index}"]`), 
                 gridSize);
    
    // Disable game to prevent further interaction with this puzzle
    this.state.gameActive = false;
    
    // Update UI to reflect completion
    this.updateUI();
    
    // Delay the suggestion for next level
    setTimeout(() => {
        // Suggestion for next level if not at max level
        if (this.state.currentLevel < 10) {
            this.showMessage(`Ready for level ${this.state.currentLevel + 1}? Scroll through and select your level.`, 'info');
        } else {
            this.showMessage('You completed the highest level! Select a level of your choice for a better score.', 'info');
        }
    }, 5000);
}
    
    getLevelConfig(level) {
        // Re-export the function from sequencegenerator.js
        return getLevelConfig(level);
    }
    
    validatePath() {
        // Get the current grid size from the level config
        const config = getLevelConfig(this.state.currentLevel);
        const gridSize = config.gridSize || 10;
        
        // First manually check path continuity with the correct grid size
        for (let i = 1; i < this.state.userPath.length; i++) {
            const prevIndex = this.state.userPath[i-1];
            const currIndex = this.state.userPath[i];
            
            const prevX = prevIndex % gridSize;
            const prevY = Math.floor(prevIndex / gridSize);
            const currX = currIndex % gridSize;
            const currY = Math.floor(currIndex / gridSize);
            
            const isAdjacent = (Math.abs(prevX - currX) === 1 && prevY === currY) || 
                        (Math.abs(prevY - currY) === 1 && prevX === currX);
            
            if (!isAdjacent) {
                return {
                    isValid: false,
                    error: 'Path must be continuous - cells must be adjacent!'
                };
            }
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
            
            // Remove all path borders
            removeAllPathBorders();
            console.log('Path borders removed');
            
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
            // Hide the button for level 1 where all cells are automatically removed
            if (this.state.currentLevel === 1) {
                removeButton.style.display = 'none';
            } else {
                removeButton.style.display = '';
                removeButton.disabled = !this.state.gameActive || this.state.removedCells.size > 0;
            }
        }
                
        if (resetButton) {
            // Only disable when game is not active OR path is empty
            resetButton.disabled = !this.state.gameActive || this.state.userPath.length === 0;
        }

        // Update level buttons - both traditional and scrollable buttons
        document.querySelectorAll('.level-btn, .level-btn-scrollable').forEach(btn => {
            if (parseInt(btn.dataset.level) === this.state.currentLevel) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
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
                // Changed message
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

// Replace the initializeGameController function
function initializeGameController() {
    console.log('Initializing game controller...');
    
    // Create the controller
    if (!window.gameController) {
        window.gameController = new GameController();
        console.log('Game controller initialized and stored globally');
    }
}

// Make initialization function globally available
window.initializeGameController = initializeGameController;

// Call initialization immediately
initializeGameController();
