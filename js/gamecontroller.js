// gamecontroller.js
import { generatePath } from './pathgenerator.js';
import { generateSequence, sequenceToEntries } from './sequencegenerator.js';
import { renderGrid, updateCell, highlightPath, isStartCell, isEndCell } from './gridrenderer.js';

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
            gameActive: false,
            score: {
                possible: 0,
                bonus: 0,
                total: 0
            }
        };

        this.initializeEventListeners();
        this.initializeGridInteractions();
    }

    initializeEventListeners() {
        // Level selection
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.startLevel(level);
            });
        });

        // Grid cell clicks
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

    handleCellClick(cell) {
        const cellIndex = parseInt(cell.dataset.index);

        // First click must be start cell
        if (this.state.userPath.length === 0) {
            if (isStartCell(cell)) {
                this.state.userPath.push(cellIndex);
                highlightPath(this.state.userPath);
                this.showMessage('Path started! Continue by selecting connected cells.');
            } else {
                this.showMessage('You must start at the green square!', 'error');
            }
            return;
        }

        // Check if cell is adjacent to last selected cell
        if (!this.isValidMove(cellIndex)) {
            this.showMessage('You can only move to adjacent squares!', 'error');
            return;
        }

        // Handle backtracking
        const existingIndex = this.state.userPath.indexOf(cellIndex);
        if (existingIndex !== -1) {
            this.state.userPath = this.state.userPath.slice(0, existingIndex + 1);
        } else {
            this.state.userPath.push(cellIndex);
        }

        highlightPath(this.state.userPath);
        
        // Enable check solution button
        document.getElementById('check-solution').disabled = false;

        // Check if end square reached
        if (isEndCell(cell)) {
            this.checkSolution();
        }
    }

    initializeGridInteractions() {
        const gridContainer = document.getElementById('grid-container');
        let isMouseDown = false;
        let lastSelectedCell = null;

        gridContainer.addEventListener('mousedown', (e) => {
            if (!this.state.gameActive) return;
            isMouseDown = true;
            const cell = e.target.closest('.grid-cell');
            if (cell) {
                this.handleCellInteraction(cell);
            }
        });

        gridContainer.addEventListener('mousemove', (e) => {
            if (!isMouseDown || !this.state.gameActive) return;
            const cell = e.target.closest('.grid-cell');
            if (cell && cell !== lastSelectedCell) {
                this.handleCellInteraction(cell);
                lastSelectedCell = cell;
            }
        });

        gridContainer.addEventListener('mouseup', () => {
            isMouseDown = false;
            lastSelectedCell = null;
        });

        gridContainer.addEventListener('mouseleave', () => {
            isMouseDown = false;
            lastSelectedCell = null;
        });

        // Touch events for mobile
        gridContainer.addEventListener('touchstart', (e) => {
            if (!this.state.gameActive) return;
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY).closest('.grid-cell');
            if (cell) {
                this.handleCellInteraction(cell);
            }
        });

        gridContainer.addEventListener('touchmove', (e) => {
            if (!this.state.gameActive) return;
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY).closest('.grid-cell');
            if (cell && cell !== lastSelectedCell) {
                this.handleCellInteraction(cell);
                lastSelectedCell = cell;
            }
        });
    }

    handleCellInteraction(cell) {
        const cellIndex = parseInt(cell.dataset.index);

        // First click must be start cell
        if (this.state.userPath.length === 0) {
            if (isStartCell(cell)) {
                this.state.userPath.push(cellIndex);
                highlightPath(this.state.userPath);
                this.showMessage('Path started! Continue by selecting connected cells.');
            } else {
                this.showMessage('You must start at the green square!', 'error');
            }
            return;
        }

        // Allow deselection by clicking a cell in the path
        const pathIndex = this.state.userPath.indexOf(cellIndex);
        if (pathIndex !== -1) {
            this.state.userPath = this.state.userPath.slice(0, pathIndex + 1);
            highlightPath(this.state.userPath);
            return;
        }

        // Check if cell is adjacent to last selected cell
        if (!this.isValidMove(cellIndex)) {
            return; // Silent fail for drag operations
        }

        this.state.userPath.push(cellIndex);
        highlightPath(this.state.userPath);
        
        document.getElementById('check-solution').disabled = false;

        if (isEndCell(cell)) {
            this.checkSolution();
        }
    }

    isValidMove(newCellIndex) {
        const lastCellIndex = this.state.userPath[this.state.userPath.length - 1];
        const [x1, y1] = [newCellIndex % 10, Math.floor(newCellIndex / 10)];
        const [x2, y2] = [lastCellIndex % 10, Math.floor(lastCellIndex / 10)];

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
    
        // Update score
        this.state.score.possible = Math.ceil(this.state.score.possible / 2);
        this.updateUI();
        
        this.showMessage(`Removed ${numToRemove} spare cells.`, 'info');
    }

    checkSolution() {
        // Validate current path
        if (this.validatePath()) {
            if (isEndCell(document.querySelector(`[data-index="${this.state.userPath[this.state.userPath.length - 1]}"]`))) {
                this.handlePuzzleSolved();
            } else {
                this.showMessage('Path is mathematically correct! Continue to the end square.', 'info');
            }
        } else {
            this.showMessage('Mathematical error in the path. Try again.', 'error');
            // Reset path to last valid point
            this.state.userPath = [];
            highlightPath(this.state.userPath);
        }

        // Update score
        this.state.score.possible = Math.ceil(this.state.score.possible * 0.75);
        this.updateUI();
    }

    validatePath() {
        // Implementation of path validation logic
        // This should check if the mathematical sequence is correct
        return true; // Placeholder
    }

    handlePuzzleSolved() {
        this.state.gameActive = false;
        this.state.score.total += this.state.score.possible + this.state.score.bonus;
        this.updateUI();
        this.showMessage('Congratulations! Puzzle solved!', 'success');
    }

    updateUI() {
        // Update button states
        document.getElementById('check-solution').disabled = !this.state.gameActive || this.state.userPath.length === 0;
        document.getElementById('remove-spare').disabled = !this.state.gameActive || this.state.removedCells.size >= 2;

        // Update level buttons
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === this.state.currentLevel);
        });

        // Update score display
        const scoreComponent = document.getElementById('score-component');
        if (scoreComponent) {
            scoreComponent.innerHTML = `
                <div class="score-display">
                    <div>Points: ${this.state.score.possible}</div>
                    <div>Bonus: ${this.state.score.bonus}</div>
                    <div>Total: ${this.state.score.total}</div>
                </div>
            `;
        }
    }

    showMessage(text, type = 'info') {
        const messageElement = document.getElementById('game-messages');
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = `message-box ${type}`;
        }
    }
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    new GameController();
});

export default GameController;
