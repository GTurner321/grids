// gamecontroller.js
import { generatePath } from './pathgenerator.js';
import { generateSequence, sequenceToEntries } from './sequencegenerator.js';
import { renderGrid, updateCell, highlightPath, isStartCell, isEndCell } from './gridrenderer.js';
import { validatePath as validatePathMath, isPathContinuous } from './pathvalidator.js';
import { scoreManager } from './scoremanager.js';

class GameController {
    constructor() {
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
        
        this.messageTimeout = null;

        this.addMobileOptimizations();
        this.initializeEventListeners();
        this.initializeGridInteractions();
    }

    addMobileOptimizations() {
        // Prevent double-tap zoom on iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            const DOUBLE_TAP_THRESHOLD = 300; // milliseconds
            
            if (lastTouchEnd && (now - lastTouchEnd) < DOUBLE_TAP_THRESHOLD) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // Disable context menu on long-press, which interferes with swiping on mobile
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.grid-cell')) {
                e.preventDefault();
                return false;
            }
        });
        
        // Add viewport meta tag to prevent unwanted scaling
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
        } else {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
            document.head.appendChild(meta);
        }
        
        // Add device detection for platform-specific optimizations
        const isTouchDevice = 'ontouchstart' in window || 
            navigator.maxTouchPoints > 0 || 
            navigator.msMaxTouchPoints > 0;
        
        // Add a class to the body for touch-specific CSS targeting
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
        }
        
        // On iOS devices, add an additional class for iOS-specific fixes
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            document.body.classList.add('ios-device');
            
            // Fix iOS 100vh issue
            const setAppHeight = () => {
                document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
            };
            window.addEventListener('resize', setAppHeight);
            setAppHeight();
        }
    }
    
    initializeEventListeners() {
        // Level selection
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.startLevel(level);
            });
        });

        // Grid cell clicks - Direct handler for cell clicks
        document.getElementById('grid-container').addEventListener('click', (e) => {
            const cell = e.target.closest('.grid-cell');
            if (cell && this.state.gameActive) {
                this.handleCellClick(cell);
            }
        });

        // Game controls
        document.getElementById('check-solution').addEventListener('click', () => {
            if (this.state.userPath.length > 0) {
                this.checkSolution();
            }
        });

        document.getElementById('remove-spare').addEventListener('click', () => {
            this.removeAllSpareCells();
        });
    }

    async startLevel(level) {
        // Reset state
        this.state.currentLevel = level;
        this.state.userPath = [];
        this.state.gridEntries = new Array(100).fill(null);
        this.state.removedCells.clear();
        this.state.gameActive = true;

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

    // Fixed handleCellClick method
    handleCellClick(cell) {
        // Early exit if we don't have a valid cell
        if (!cell || !cell.classList.contains('grid-cell')) return;

        const cellIndex = parseInt(cell.dataset.index);
        if (isNaN(cellIndex)) return;

        // First cell selection must be start cell
        if (this.state.userPath.length === 0) {
            if (isStartCell(cell)) {
                this.state.userPath = [cellIndex];
                highlightPath(this.state.userPath);
                this.showMessage('Path started! Continue by selecting connected cells.');
            } else {
                this.showMessage('You must start at the green square!', 'error');
            }
            return;
        }

        // Handle deselection of last cell
        const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
        if (cellIndex === lastCellIndex) {
            this.state.userPath.pop();
            highlightPath(this.state.userPath);
            return;
        }
        
        // Don't allow selection of cells already in path (except last cell for deselection)
        if (this.state.userPath.includes(cellIndex)) {
            return;
        }

        // Check if cell is adjacent to last selected cell
        if (!this.isValidMove(cellIndex)) {
            // Give feedback that this isn't a valid move
            cell.classList.add('invalid-move');
            setTimeout(() => cell.classList.remove('invalid-move'), 300);
            return;
        }

        // Add the new cell to the path
        this.state.userPath.push(cellIndex);
        highlightPath(this.state.userPath);
        
        // Add a subtle animation/feedback that cell was selected
        cell.classList.add('just-selected');
        setTimeout(() => cell.classList.remove('just-selected'), 200);
        
        // Enable check solution button
        document.getElementById('check-solution').disabled = false;

        // If end cell is selected, automatically check the solution
        if (isEndCell(cell)) {
            this.checkSolution();
        }
    }

    // Add this missing method to check if a move is valid
    isValidMove(cellIndex) {
        if (this.state.userPath.length === 0) return false;
        
        const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
        
        // Convert indices to coordinates
        const lastX = lastCellIndex % 10;
        const lastY = Math.floor(lastCellIndex / 10);
        
        const newX = cellIndex % 10;
        const newY = Math.floor(cellIndex / 10);
        
        // Check if cells are adjacent (horizontally or vertically)
        return (Math.abs(lastX - newX) === 1 && lastY === newY) || 
               (Math.abs(lastY - newY) === 1 && lastX === newX);
    }

    // Fixed initializeGridInteractions method
    initializeGridInteractions() {
        const gridContainer = document.getElementById('grid-container');
        let isDragging = false;
        let lastSelectedCell = null;
        
        // Variables to track touch interaction
        let touchStartX = 0;
        let touchStartY = 0;
        const touchThreshold = 5; // Minimum distance to consider it a swipe
        
        // Mouse events with improved handling
        gridContainer.addEventListener('mousedown', (e) => {
            if (!this.state.gameActive) return;
            
            isDragging = false;
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                lastSelectedCell = cell;
                // Don't process the cell yet, wait to see if it's a click or drag
            }
        });
        
        gridContainer.addEventListener('mousemove', (e) => {
            if (!lastSelectedCell || !this.state.gameActive) return;
            
            // Calculate distance moved to determine if it's a drag
            const dx = e.clientX - lastSelectedCell.getBoundingClientRect().left - (lastSelectedCell.offsetWidth / 2);
            const dy = e.clientY - lastSelectedCell.getBoundingClientRect().top - (lastSelectedCell.offsetHeight / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > touchThreshold) {
                isDragging = true;
                const cell = e.target.closest('.grid-cell');
                if (cell && cell !== lastSelectedCell) {
                    lastSelectedCell = cell;
                    this.handleCellInteraction(cell);
                }
            }
        });
        
        gridContainer.addEventListener('mouseup', (e) => {
            if (!this.state.gameActive) return;
            
            // Only treat it as a click if we didn't start dragging
            if (!isDragging) {
                const cell = e.target.closest('.grid-cell');
                if (cell) {
                    this.handleCellClick(cell);
                }
            }
            
            isDragging = false;
            lastSelectedCell = null;
        });
        
        // Clean up when mouse leaves container
        gridContainer.addEventListener('mouseleave', () => {
            isDragging = false;
            lastSelectedCell = null;
        });
        
        // Improved touch handling
        gridContainer.addEventListener('touchstart', (e) => {
            if (!this.state.gameActive) return;
            // Don't preventDefault here to allow scrolling if not on a cell
            
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = element.closest('.grid-cell');
            
            if (cell) {
                e.preventDefault(); // Only prevent default if we're on a cell
                lastSelectedCell = cell;
                // First touch - store but don't select yet
            }
        }, { passive: false });
        
        gridContainer.addEventListener('touchmove', (e) => {
            if (!this.state.gameActive || !lastSelectedCell) return;
            
            e.preventDefault(); // Prevent scrolling during cell selection
            
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only count as a swipe/drag if moved past threshold
            if (distance > touchThreshold) {
                isDragging = true;
                const newElement = document.elementFromPoint(touch.clientX, touch.clientY);
                const newCell = newElement?.closest('.grid-cell');
                
                if (newCell && newCell !== lastSelectedCell) {
                    // Immediately process the cell for better swipe responsiveness
                    this.handleCellInteraction(newCell);
                    lastSelectedCell = newCell;
                    
                    // Update touch start positions for smoother continuous swiping
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                }
            }
        }, { passive: false });
        
        gridContainer.addEventListener('touchend', (e) => {
            if (!this.state.gameActive) return;
            
            // Only process as a tap if we didn't drag
            if (!isDragging && lastSelectedCell) {
                this.handleCellClick(lastSelectedCell);
            }
            
            isDragging = false;
            lastSelectedCell = null;
        }, { passive: false });
        
        gridContainer.addEventListener('touchcancel', () => {
            isDragging = false;
            lastSelectedCell = null;
        });
    }
    
    // Fixed handleCellInteraction method
    handleCellInteraction(cell) {
        // This method is primarily for drag/swipe operations
        // Early exit if we don't have a valid cell
        if (!cell || !cell.classList.contains('grid-cell')) return;

        const cellIndex = parseInt(cell.dataset.index);
        if (isNaN(cellIndex)) return;

        // First click must be start cell
        if (this.state.userPath.length === 0) {
            if (isStartCell(cell)) {
                this.state.userPath = [cellIndex]; // Set directly as an array with one item
                highlightPath(this.state.userPath);
                this.showMessage('Path started! Continue by selecting connected cells.');
            } else {
                // During dragging operations, silently ignore invalid start cells
                return;
            }
            return;
        }

        // Check for valid move
        if (!this.isValidMove(cellIndex)) {
            return;
        }

        // Don't allow selection of cells already in path
        if (this.state.userPath.includes(cellIndex)) {
            return;
        }

        // For drag/swipe operations, we want immediate feedback
        this.state.userPath.push(cellIndex);
        highlightPath(this.state.userPath);
        
        // Add haptic feedback if available (will work on iOS, some Android)
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(30); // Short 30ms vibration for feedback
        }
        
        document.getElementById('check-solution').disabled = false;

        // Auto-check on reaching end cell
        if (isEndCell(cell)) {
            this.checkSolution();
        }
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
        // Validate current path
        const validation = this.validatePath();
        
        if (validation.isValid) {
            if (isEndCell(document.querySelector(`[data-index="${this.state.userPath[this.state.userPath.length - 1]}"]`))) {
                scoreManager.handleCheck(true);
                this.handlePuzzleSolved();
            } else {
                scoreManager.handleCheck(false);
                this.showMessage('Path is mathematically correct! Continue to the end square.', 'info');
            }
        } else {
            scoreManager.handleCheck(false);
            
            // Show error message with specific details about the first invalid calculation
            if (validation.error) {
                this.showMessage(validation.error, 'error', 10000); // 10 seconds display time
            } else {
                this.showMessage('Mathematical error in the path. Try again.', 'error', 10000);
            }
            
            // If we know where the error occurred, truncate the path to keep only valid calculations
            if (validation.failedAt !== undefined) {
                // Keep the path up to the last correct calculation
                // failedAt is the index of the first cell in the failing calculation
                // For example: 5-3=2, 2*3=6, 6+5=11 (incorrect)
                // failedAt would be 6 (index in the path array)
                // We want to keep indices 0 through 5 (inclusive)
                this.state.userPath = this.state.userPath.slice(0, validation.failedAt);
                highlightPath(this.state.userPath);
            }
        }
        
        this.updateUI();
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

    handlePuzzleSolved() {
        this.state.gameActive = false;
        scoreManager.completePuzzle();
        this.updateUI();
        this.showMessage('Congratulations! Puzzle solved!', 'success');
    }

    updateUI() {
        // Update button states
        document.getElementById('check-solution').disabled = !this.state.gameActive || this.state.userPath.length === 0;
        document.getElementById('remove-spare').disabled = !this.state.gameActive || this.state.removedCells.size > 0;

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
            
            messageElement.textContent = text;
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

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    new GameController();
});

export default GameController;
