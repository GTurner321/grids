// leveltracker.js - Track completed levels in the score bar
class LevelTracker {
    constructor() {
        // Store which levels have been completed
        this.completedLevels = new Set();
        
        // Flag to track if all levels have been completed before
        this.hasCompletedAllLevels = false;
        
        // We'll initialize the DOM references after a delay
        // to ensure the DOM is fully loaded
        setTimeout(() => {
            this.initializeDOM();
            
            // Load saved progress from localStorage if available
            this.loadProgress();
        }, 1000); // Longer delay to ensure game elements are ready
        
        // Listen for level completion events
        this.setupEventListeners();
        
        // Make available globally
        window.levelTracker = this;
    }
    
    initializeDOM() {
        // Find the score row element
        this.scoreRow = document.querySelector('.score-row');
        
        if (!this.scoreRow) {
            console.error('Score row not found! Level tracker could not be initialized.');
            return;
        }
        
        // Add the CSS if it's not already added
        this.addStyles();
        
        // Create and add level indicators
        this.initializeLevelIndicators();
    }
    
    initializeLevelIndicators() {
        // Check if we already added indicators
        if (document.querySelector('.level-indicators-container')) {
            return;
        }
        
        // Add the level tracker container to the score row
        const levelIndicatorsContainer = document.createElement('div');
        levelIndicatorsContainer.className = 'level-indicators-container';
        
        // Create 10 level indicators (one for each level)
        for (let i = 1; i <= 10; i++) {
            const levelIndicator = document.createElement('div');
            levelIndicator.className = 'level-indicator';
            levelIndicator.dataset.level = i;
            levelIndicator.title = `Level ${i}`;
            levelIndicatorsContainer.appendChild(levelIndicator);
        }
        
        // Insert the indicators into the score row
        this.scoreRow.appendChild(levelIndicatorsContainer);
        
        console.log('Level indicators initialized');
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
                        }, 2000); // Delay to show after the completion message
                    }
                    
                    // Check if all levels are complete for the first time
                    if (this.completedLevels.size === 10 && !this.hasCompletedAllLevels) {
                        this.handleAllLevelsComplete();
                        // Update flag so animation only happens once
                        this.hasCompletedAllLevels = true;
                        this.saveProgress();
                    }
                }
            }
        });
        
        // Listen for level button clicks to stop any celebration animation
        window.addEventListener('click', (event) => {
            if (event.target.closest('.level-btn')) {
                this.stopCelebrationAnimation();
            }
        });
        
        console.log('Level tracker event listeners set up');
    }
    
    markLevelCompleted(level) {
        // Add to our set of completed levels
        this.completedLevels.add(level);
        
        // Save progress
        this.saveProgress();
        
        // Update the visual indicator
        const indicator = document.querySelector(`.level-indicator[data-level="${level}"]`);
        if (indicator) {
            indicator.classList.add('completed');
        }
        
        console.log(`Level ${level} marked as completed`);
    }
    
    handleAllLevelsComplete() {
        // Show a congratulatory message when all levels are complete
        setTimeout(() => {
            if (window.gameController) {
                window.gameController.showMessage('Congratulations! You have completed all levels!', 'success', 8000);
            }
        }, 3000); // Delay to show after other messages
        
        // Add a special class to all indicators for the celebration effect
        document.querySelectorAll('.level-indicator').forEach(indicator => {
            indicator.classList.add('celebrate');
        });
        
        console.log('All levels complete celebration started');
    }
    
    stopCelebrationAnimation() {
        // Remove the celebration animation classes
        document.querySelectorAll('.level-indicator').forEach(indicator => {
            indicator.classList.remove('celebrate');
        });
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
                        
                        // Update visual indicator
                        const indicator = document.querySelector(`.level-indicator[data-level="${level}"]`);
                        if (indicator) {
                            indicator.classList.add('completed');
                        }
                    });
                    
                    // Restore the flag for all levels completed
                    this.hasCompletedAllLevels = !!progressData.hasCompletedAllLevels;
                } else if (Array.isArray(progressData)) {
                    // Old format (just an array of levels)
                    progressData.forEach(level => {
                        this.completedLevels.add(level);
                        
                        // Update visual indicator
                        const indicator = document.querySelector(`.level-indicator[data-level="${level}"]`);
                        if (indicator) {
                            indicator.classList.add('completed');
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
    
    resetProgress() {
        // Clear stored progress
        this.completedLevels.clear();
        this.hasCompletedAllLevels = false;
        localStorage.removeItem('mathPathCompletedLevels');
        
        // Reset visual indicators
        document.querySelectorAll('.level-indicator').forEach(indicator => {
            indicator.classList.remove('completed', 'celebrate');
        });
        
        console.log('Level progress reset');
    }
    
    addStyles() {
        // Check if we already added the styles
        if (document.getElementById('level-tracker-styles')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'level-tracker-styles';
        styleElement.textContent = `
            /* Level indicators container */
            .level-indicators-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-columns: repeat(10, 1fr);
                z-index: 0;
                pointer-events: none;
            }
            
            /* Individual level indicators */
            .level-indicator {
                height: 100%;
                background-color: transparent;
                border-right: 1px solid rgba(148, 163, 184, 0.3);
                transition: background-color 0.3s ease;
            }
            
            .level-indicator:last-child {
                border-right: none;
            }
            
            /* Completed level style */
            .level-indicator.completed {
                background-color: rgba(34, 197, 94, 0.3); /* Semi-transparent green */
            }
            
            /* Ensure score text remains visible */
            .score-left, .score-right {
                position: relative;
                z-index: 2;
            }
            
            /* Celebration animation */
            .level-indicator.celebrate {
                animation: pulse-green 2s infinite alternate;
            }
            
            @keyframes pulse-green {
                0% { background-color: rgba(34, 197, 94, 0.3); }
                100% { background-color: rgba(21, 128, 61, 0.4); }
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log('Level tracker styles added');
    }
}

// Initialize the level tracker when the page loads
// Use a longer delay to ensure all game elements are loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Check if game is initialized
        if (window.gameController) {
            console.log('Initializing level tracker...');
            window.levelTracker = new LevelTracker();
        } else {
            console.warn('Game controller not found, retrying in 1 second...');
            // Try again after another delay
            setTimeout(() => {
                console.log('Second attempt to initialize level tracker...');
                window.levelTracker = new LevelTracker();
            }, 1000);
        }
    }, 1000);
});

export default LevelTracker;
