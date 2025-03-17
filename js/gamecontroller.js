// gamecontroller.js - Rewritten with improved modular architecture
import { generatePath } from './pathgenerator.js';
import { generateSequence, sequenceToEntries } from './sequencegenerator.js';
import { renderGrid, updateCell } from './gridrenderer.js';
import { scoreManager } from './scoremanager.js';
import PathManager from './path-manager.js';
import GridInteractionManager from './grid-interaction-manager.js';

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
            gameActive: false
        };
        
        // Initialize modular components
        this.pathManager = new PathManager(this);
        this.interactionManager = new GridInteractionManager(this);
        
        this.messageTimeout = null;
        
        document.querySelector('.game-container')?.classList.remove('game-active');

        this.initializeEventListeners();
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
        
        // Reset path button handler
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
        
        // Initialize the interaction manager after event listeners are set up
        // This loads the touch and mouse handlers for the grid
        document.addEventListener('DOMContentLoaded', () => {
            this.interactionManager.init();
        });
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

            // Reset path manager
            this.pathManager.resetPath();
            
            // Update UI
            this.updateUI();
            this.showMessage('Find the path by following the mathematical sequence.');

            // Reinitialize grid interactions for the new grid
            setTimeout(() => {
                this.interactionManager.init();
            }, 200);

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
        this.pathManager.updatePathHighlight();
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
        return this.pathManager.validatePath();
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

// Export the GameController for initialization
export default GameController;
