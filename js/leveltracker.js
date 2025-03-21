// leveltracker.js - Tracks completed levels through score bar segments

class LevelTracker {
    constructor() {
        // Store which levels have been completed
        this.completedLevels = new Set();
        
        // Flag to track if all levels have been completed before
        this.hasCompletedAllLevels = false;
        
        // Add the level tracking styles
        this.addStyles();
        
        // Initialize when DOM is ready
        this.initWhenReady();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Make available globally
        window.levelTracker = this;
        
        console.log('Level tracker initialized');
    }
    
    initWhenReady() {
        // Check if score row exists now
        const scoreRow = document.querySelector('.score-row');
        if (scoreRow) {
            this.initializeScoreBar(scoreRow);
            this.loadProgress();
        } else {
            // If not, wait a bit and try again
            setTimeout(() => this.initWhenReady(), 500);
        }
    }
    
    initializeScoreBar(scoreRow) {
        console.log('Initializing score bar level segments...');
        
        // Skip if already initialized
        if (scoreRow.querySelector('.score-level-segments')) {
            return;
        }
        
        // Create level indicator segments container
        const segmentsContainer = document.createElement('div');
        segmentsContainer.className = 'score-level-segments';
        
        // Add 10 segments for the 10 levels
        for (let i = 1; i <= 10; i++) {
            const segment = document.createElement('div');
            segment.className = 'score-level-segment';
            segment.dataset.level = i;
            segmentsContainer.appendChild(segment);
        }
        
        // Insert the segments container at the beginning of the score row
        // This ensures it's at the back (lowest z-index)
        scoreRow.insertBefore(segmentsContainer, scoreRow.firstChild);
        
        // Make sure the text content is above the segments
        const leftContent = scoreRow.querySelector('.score-left');
        const rightContent = scoreRow.querySelector('.score-right');
        
        if (leftContent) leftContent.style.position = 'relative';
        if (rightContent) rightContent.style.position = 'relative';
    }
    
    setupEventListeners() {
        // Listen for score updates which happen on level completion
        window.addEventListener('scoreUpdated', (event) => {
            // Only track when a round is complete
            if (event.detail && event.detail.roundComplete) {
                const level = event.detail.level;
                
                if (level >= 1 && level <= 10) {
                    this.markLevelCompleted(level);
                    
                    // Check if this is the first level completion
                    if (this.completedLevels.size === 1) {
                        // Show the message
                        setTimeout(() => {
                            if (window.gameController) {
                                window.gameController.showMessage('Complete all the levels to turn the score bar green!', 'info', 5000);
                            }
                        }, 2000);
                    }
                    
                    // Check if all levels are complete
                    if (this.completedLevels.size === 10 && !this.hasCompletedAllLevels) {
                        this.handleAllLevelsComplete();
                        this.hasCompletedAllLevels = true;
                        this.saveProgress();
                    }
                }
            }
        });
        
        // Also observe the DOM for when the score row is added or changed
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const scoreRow = document.querySelector('.score-row');
                    if (scoreRow && !scoreRow.querySelector('.score-level-segments')) {
                        this.initializeScoreBar(scoreRow);
                        this.loadProgress();
                        break;
                    }
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Also handle fixing 6x6 grid size if needed
        document.addEventListener('click', (event) => {
            if (event.target.closest('.level-btn')) {
                // Check if we need to enforce 6x6 grid size
                setTimeout(() => this.enforceGridSizes(), 500);
            }
        });
    }
    
    markLevelCompleted(level) {
        // Add to our set of completed levels
        this.completedLevels.add(level);
        
        // Save progress
        this.saveProgress();
        
        // Update the visual segment
        const segment = document.querySelector(`.score-level-segment[data-level="${level}"]`);
        if (segment) {
            segment.classList.add('completed');
        }
        
        console.log(`Level ${level} marked as completed`);
    }
    
    handleAllLevelsComplete() {
        // Show a congratulatory message when all levels are complete
        setTimeout(() => {
            if (window.gameController) {
                window.gameController.showMessage('Congratulations! You have completed all levels!', 'success', 8000);
            }
        }, 3000);
        
        // Add a celebration effect to the segments
        document.querySelectorAll('.score-level-segment').forEach(segment => {
            segment.classList.add('celebrate');
        });
        
        console.log('All levels complete!');
    }
    
    stopCelebration() {
        // Remove celebration effect from segments
        document.querySelectorAll('.score-level-segment').forEach(segment => {
            segment.classList.remove('celebrate');
        });
    }
    
    // Optional: Enforce 6x6 grid to match 10x10 size
    enforceGridSizes() {
        // Check if we have a grid container
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;
        
        // For 6x6 grid, enforce larger cell size
        if (gridContainer.classList.contains('grid-size-6')) {
            console.log('Applying size fix for 6x6 grid');
            
            // Calculate the proper cell size
            const properCellSize = 67; // (10*40 + 9*1 + 2)/6 = 67px
            
            // Set explicit grid template columns
            gridContainer.style.width = '411px'; // Same as 10x10 grid
            gridContainer.style.gridTemplateColumns = `repeat(6, ${properCellSize}px)`;
            
            // Set all cells to the proper size
            const cells = gridContainer.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                cell.style.width = `${properCellSize}px`;
                cell.style.height = `${properCellSize}px`;
                
                // Make text bigger
                cell.style.fontSize = '1.2rem';
            });
            
            // Make operator text even bigger
            const operatorCells = gridContainer.querySelectorAll('.grid-cell.operator');
            operatorCells.forEach(cell => {
                cell.style.fontSize = '1.4rem';
            });
            
            // Ensure score row has matching width
            const scoreRow = document.querySelector('.score-row');
            if (scoreRow) {
                scoreRow.style.width = '411px';
            }
        }
    }
    
    saveProgress() {
        try {
            // Convert Set to Array for storage
            const completedArray = Array.from(this.completedLevels);
            
            // Save progress data along with the flag for completed all levels
            const progressData = {
                completedLevels: completedArray,
                hasCompletedAllLevels: this.hasCompletedAllLevels
            };
            
            localStorage.setItem('mathPathCompletedLevels', JSON.stringify(progressData));
        } catch (error) {
            console.error('Error saving level progress:', error);
        }
    }
    
    loadProgress() {
        try {
            const savedProgress = localStorage.getItem('mathPathCompletedLevels');
            if (savedProgress) {
                const progressData = JSON.parse(savedProgress);
                
                // Handle both the new format and the old format for backward compatibility
                if (progressData && typeof progressData === 'object' && progressData.completedLevels) {
                    // New format
                    progressData.completedLevels.forEach(level => {
                        this.completedLevels.add(level);
                        
                        // Update visual segment
                        const segment = document.querySelector(`.score-level-segment[data-level="${level}"]`);
                        if (segment) {
                            segment.classList.add('completed');
                        }
                    });
                    
                    // Restore the flag for all levels completed
                    this.hasCompletedAllLevels = !!progressData.hasCompletedAllLevels;
                } else if (Array.isArray(progressData)) {
                    // Old format (just an array of levels)
                    progressData.forEach(level => {
                        this.completedLevels.add(level);
                        
                        // Update visual segment
                        const segment = document.querySelector(`.score-level-segment[data-level="${level}"]`);
                        if (segment) {
                            segment.classList.add('completed');
                        }
                    });
                    
                    // Check if all levels are complete to set the flag
                    this.hasCompletedAllLevels = this.completedLevels.size === 10;
                }
                
                console.log('Level progress loaded successfully');
            }
        } catch (error) {
            console.error('Error loading level progress:', error);
        }
    }
    
    addStyles() {
        // Skip if already added
        if (document.getElementById('level-tracker-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'level-tracker-styles';
        styleEl.textContent = `
            /* Score bar level segments container */
            .score-level-segments {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-columns: repeat(10, 1fr);
                z-index: 0;
            }
            
            /* Individual level segments */
            .score-level-segment {
                height: 100%;
                border-right: 1px solid rgba(148, 163, 184, 0.3);
                /* Start with normal score bar background */
                background-color: #e6f2ff;
            }
            
            /* No border on last segment */
            .score-level-segment:last-child {
                border-right: none;
            }
            
            /* Completed segment style - solid green */
            .score-level-segment.completed {
                background-color: #22c55e;
            }
            
            /* Ensure score text is above segments */
            .score-row .score-left,
            .score-row .score-right {
                position: relative;
                z-index: 1;
            }
            
            /* Celebration animation for all levels complete */
            .score-level-segment.celebrate {
                animation: pulse-green 2s infinite alternate;
            }
            
            @keyframes pulse-green {
                0% { background-color: #22c55e; }
                100% { background-color: #15803d; }
            }
            
            /* Optional: 6x6 grid size enforcement */
            #grid-container.grid-size-6 {
                width: 411px !important;
                grid-template-columns: repeat(6, 67px) !important;
            }
            
            #grid-container.grid-size-6 .grid-cell {
                width: 67px !important;
                height: 67px !important;
                font-size: 1.2rem !important;
            }
            
            #grid-container.grid-size-6 .grid-cell.operator {
                font-size: 1.4rem !important;
            }
            
            /* Mobile responsive styles */
            @media (max-width: 768px) {
                .score-row {
                    width: var(--container-width) !important;
                }
                
                #grid-container.grid-size-6 {
                    width: var(--container-width) !important;
                    grid-template-columns: repeat(6, calc(var(--container-width) / 6 - 1px)) !important;
                }
                
                #grid-container.grid-size-6 .grid-cell {
                    width: calc(var(--container-width) / 6 - 1px) !important;
                    height: calc(var(--container-width) / 6 - 1px) !important;
                    font-size: 1.5rem !important;
                }
                
                #grid-container.grid-size-6 .grid-cell.operator {
                    font-size: 1.8rem !important;
                }
            }
        `;
        
        document.head.appendChild(styleEl);
        console.log('Level tracker styles added');
    }
    
    resetProgress() {
        // Clear stored progress
        this.completedLevels.clear();
        this.hasCompletedAllLevels = false;
        localStorage.removeItem('mathPathCompletedLevels');
        
        // Reset visual segments
        document.querySelectorAll('.score-level-segment').forEach(segment => {
            segment.classList.remove('completed', 'celebrate');
        });
        
        console.log('Level progress reset');
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting level tracker initialization...');
    window.levelTracker = new LevelTracker();
});

export default LevelTracker;
