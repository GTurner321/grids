// levelscroller.js - Simplified and fixed for proper centering and visibility

class LevelScroller {
    constructor() {
        this.currentLevel = 1;
        this.maxLevels = 10;
        
        // Initialize the UI once the DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        
        // Make available globally
        window.levelScroller = this;
        
        // Listen for game controller ready event
        document.addEventListener('gameControllerReady', () => {
            console.log('Game controller is now ready - level scroller notified');
        });
        
        // Listen for level tracker updates
        document.addEventListener('levelTrackerReady', () => {
            console.log('Level tracker is ready - updating level scroller');
            this.updateVisibleLevel();
        });
        
        // Add this to the LevelScroller constructor
        window.addEventListener('scoreUpdated', (event) => {
            if (event.detail && event.detail.roundComplete) {
                console.log('Score updated with round complete - refreshing level scroller');
                // Update the visible level to reflect new unlocks
                setTimeout(() => this.updateVisibleLevel(), 100);
            }
        });
    }
    
    init() {
        this.initializeUI();
        this.attachEventListeners();
    }
    
    initializeUI() {
        // Get the level buttons container
        const levelButtonsContainer = document.querySelector('.level-buttons');
        if (!levelButtonsContainer) {
            console.error('Could not find level buttons container');
            return;
        }
        
        // Clear existing buttons
        levelButtonsContainer.innerHTML = '';
        
        // Add new scroller UI with the unified button group
        levelButtonsContainer.innerHTML = `
        <div class="level-scroller-container">
            <div class="level-button-group">
                <button class="level-arrow up-arrow metallic-button" aria-label="Previous level">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
                
                <div class="level-display-container">
                    ${this.createLevelButtons()}
                </div>
                
                <button class="level-arrow down-arrow metallic-button" aria-label="Next level">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>
        </div>
        `;
        
        // Update the visible level (initially level 1)
        this.updateVisibleLevel();
    }
    
    createLevelButtons() {
        let buttonsHtml = '';
        
        for (let i = 1; i <= this.maxLevels; i++) {
            buttonsHtml += `
                <button class="level-btn level-btn-scrollable metallic-button" data-level="${i}">
                    LEVEL ${i}
                </button>
            `;
        }
        
        return buttonsHtml;
    }
    
    attachEventListeners() {
        // Up arrow (decrements level, loops from 1 to 10)
        const upArrow = document.querySelector('.up-arrow');
        if (upArrow) {
            upArrow.addEventListener('click', (e) => {
                // Add clicked class and remove after animation completes
                upArrow.classList.add('clicked');
                setTimeout(() => {
                    upArrow.classList.remove('clicked');
                    // Force reset of any hover styles
                    void upArrow.offsetWidth; // Trigger reflow
                }, 200);
                
                this.currentLevel = this.currentLevel === 1 ? this.maxLevels : this.currentLevel - 1;
                this.updateVisibleLevel();
            });
        }
        
        // Down arrow (increments level, loops from 10 to 1)
        const downArrow = document.querySelector('.down-arrow');
        if (downArrow) {
            downArrow.addEventListener('click', () => {
                // Add clicked class and remove after animation completes
                downArrow.classList.add('clicked');
                setTimeout(() => {
                    downArrow.classList.remove('clicked');
                    // Force reset of any hover styles
                    void downArrow.offsetWidth; // Trigger reflow
                }, 200);
                
                this.currentLevel = this.currentLevel === this.maxLevels ? 1 : this.currentLevel + 1;
                this.updateVisibleLevel();
            });
        }
        
        // Level buttons - use event delegation for better performance
        const levelDisplayContainer = document.querySelector('.level-display-container');
        if (levelDisplayContainer) {
            levelDisplayContainer.addEventListener('click', (event) => {
                const levelBtn = event.target.closest('.level-btn-scrollable');
                if (levelBtn) {
                    // Add clicked class and remove after animation completes
                    levelBtn.classList.add('clicked');
                    setTimeout(() => {
                        levelBtn.classList.remove('clicked');
                        // Force reset of any hover styles
                        void levelBtn.offsetWidth; // Trigger reflow
                    }, 200);
                    
                    const level = parseInt(levelBtn.dataset.level);
                    // Only process if this is the visible button
                    if (level === this.currentLevel) {
                        this.handleLevelSelection(level);
                    }
                }
            });
        }
    }
    
    // Updated updateVisibleLevel method to properly handle locked states
    updateVisibleLevel() {
        const buttons = document.querySelectorAll('.level-btn-scrollable');
        if (!buttons || buttons.length === 0) return;
        
        // First, hide all buttons and reset their classes
        buttons.forEach(btn => {
            btn.classList.remove('active', 'visible', 'locked');
            btn.style.visibility = 'hidden';
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        });
        
        // Show only the current level button
        const currentButton = document.querySelector(`.level-btn-scrollable[data-level="${this.currentLevel}"]`);
        if (currentButton) {
            // Make the current button visible
            currentButton.classList.add('visible');
            currentButton.style.visibility = 'visible';
            currentButton.style.opacity = '1';
            currentButton.style.pointerEvents = 'auto';
            
            // Check if this level is unlocked
            const level = this.currentLevel;
            let isUnlocked = this.isLevelUnlocked(level);
            
            // Add locked class if needed
            if (!isUnlocked) {
                currentButton.classList.add('locked');
                console.log(`Level ${level} is locked`);
            } else {
                console.log(`Level ${level} is unlocked`);
            }
            
            // If this level is the active level in the game, add active class
            if (window.gameController && window.gameController.state && 
                window.gameController.state.currentLevel === this.currentLevel) {
                currentButton.classList.add('active');
            }
        }
        
        // Update score bar segments 
        this.updateScoreBarSegments();
    }
    
    updateScoreBarSegments() {
        const segments = document.querySelectorAll('.level-segment');
        if (!segments.length) return;
        
        // For each segment, check if level should be unlocked
        segments.forEach(segment => {
            const level = parseInt(segment.dataset.level);
            
            // Skip if already completed
            if (segment.classList.contains('completed')) return;
            
            let isUnlocked = this.isLevelUnlocked(level);
            
            // Apply background color based on unlock status
            segment.style.backgroundColor = isUnlocked ? '#b7aec5': '#dfdbe5';
        });
    }

    isLevelUnlocked(level) {
        // Levels 1-3 are always unlocked
        if (level >= 1 && level <= 3) {
            return true;
        }
        // Levels 4-6 are unlocked if any level from 1-3 is completed
        else if (level >= 4 && level <= 6) {
            return window.levelTracker && 
                [1, 2, 3].some(lvl => window.levelTracker.completedLevels.has(lvl));
        }
        // Levels 7-10 are unlocked if any level from 4-6 is completed
        else if (level >= 7 && level <= 10) {
            return window.levelTracker && 
                [4, 5, 6].some(lvl => window.levelTracker.completedLevels.has(lvl));
        }
        return false;
    }
    
handleLevelSelection(level) {
    // Check if this level is unlocked
    let isUnlocked = this.isLevelUnlocked(level);
    
    if (!isUnlocked) {
        if (window.gameController && window.gameController.showMessage) {
            window.gameController.showMessage(`Level ${level} is locked. Complete earlier levels to unlock it.`, 'error', 3000);
        }
        return;
    }
    
    // Function to actually start the level once controller is available
    const startSelectedLevel = () => {
        console.log(`Starting level ${level} with game controller`);
        
        // Activate game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('game-active');
        }
        
        // CRITICAL: Force grid visibility with stronger overrides
        const gridContainer = document.getElementById('grid-container');
        if (gridContainer) {
            gridContainer.style.cssText = "visibility: visible !important; height: auto !important; display: grid !important; background-color: #94a3b8 !important; border: 1px solid #94a3b8 !important;";
            console.log('Grid visibility forced by level scroller');
        }
        
        // Start the level
        window.gameController.startLevel(level);
        
        // Update appearance
        this.updateVisibleLevel();
        return true;
    };
    
    // Try to start level immediately if controller is available
    if (window.gameController && typeof window.gameController.startLevel === 'function') {
        startSelectedLevel();
        return;
    }
    
    console.log('Game controller not available, will retry...');
    
    // Use increasing retry intervals (more robust approach from previous version)
    let attempts = 0;
    const maxAttempts = 10;
    const waitInterval = setInterval(() => {
        attempts++;
        console.log(`Attempt ${attempts} to access game controller...`);
        
        if (window.gameController && typeof window.gameController.startLevel === 'function') {
            clearInterval(waitInterval);
            startSelectedLevel();
        } else if (attempts >= maxAttempts) {
            clearInterval(waitInterval);
            console.error('Game controller not available after multiple attempts');
            alert('Error starting level. Please refresh the page and try again.');
        }
    }, 200); // Try every 200ms
}
    
    // Set the current level from external sources (like game controller)
    setCurrentLevel(level) {
        if (level >= 1 && level <= this.maxLevels) {
            this.currentLevel = level;
            this.updateVisibleLevel();
        }
    }
    
    // Handle level completion - updates UI and returns appropriate message
    handleLevelCompletion(level) {
        level = Number(level);
        
        // Update UI to reflect newly completed level
        this.updateVisibleLevel();
        
        // Level tiers
        const tier1 = [1, 2, 3];
        const tier2 = [4, 5, 6];
        
        // Check if this completion unlocks new tiers
        if (tier1.includes(level)) {
            // Schedule follow-up message after 5 seconds
            setTimeout(() => {
                if (window.gameController && window.gameController.showMessage) {
                    window.gameController.showMessage('Scroll through and select a new level from 1 to 6 to continue.', 'info', 5000);
                }
            }, 5000);
            
            // Return the combined message including the "complete all levels" encouragement
            return 'Congratulations! Puzzle solved! You have unlocked levels 4 to 6. Complete all levels to turn the score bar green.';
        } 
        else if (tier2.includes(level)) {
            // Schedule follow-up message after 5 seconds
            setTimeout(() => {
                if (window.gameController && window.gameController.showMessage) {
                    window.gameController.showMessage('Scroll through and select a new level from 1 to 10 to continue.', 'info', 5000);
                }
            }, 5000);
            
            return 'Congratulations! Puzzle solved! You have unlocked levels 7 to 10.';
        }
        
        return 'Congratulations! Puzzle solved!';
    }
}

// Create the levelUnlocker reference for backward compatibility
class LevelUnlocker {
    constructor() {
        // This class is now a thin wrapper that delegates to level scroller
        console.log('LevelUnlocker is now a compatibility wrapper');
        
        // Make available globally for backward compatibility
        window.levelUnlocker = this;
    }
    
    // Compatibility method - delegates to level scroller
    isLevelUnlocked(level) {
        if (window.levelScroller) {
            return window.levelScroller.isLevelUnlocked(level);
        }
        
        // Fallback implementation if levelScroller isn't available
        level = Number(level);
        
        // Levels 1-3 are always unlocked
        if (level >= 1 && level <= 3) {
            return true;
        }
        // Levels 4-6 are unlocked if any level from 1-3 is completed
        else if (level >= 4 && level <= 6) {
            return window.levelTracker && 
                [1, 2, 3].some(lvl => window.levelTracker.completedLevels.has(lvl));
        }
        // Levels 7-10 are unlocked if any level from 4-6 is completed
        else if (level >= 7 && level <= 10) {
            return window.levelTracker && 
                [4, 5, 6].some(lvl => window.levelTracker.completedLevels.has(lvl));
        }
        
        return false;
    }
    
    // Compatibility method - delegates to level scroller
    handleLevelCompletion(level) {
        if (window.levelScroller) {
            return window.levelScroller.handleLevelCompletion(level);
        }
        return 'Congratulations! Puzzle solved!';
    }
    
    // Compatibility method - updates score bar segments
    updateScoreBarSegments() {
        if (window.levelScroller) {
            window.levelScroller.updateScoreBarSegments();
        }
    }
}

// Initialize the level scroller when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    window.levelScroller = new LevelScroller();
});

// Export both classes to make them available to other modules
export { LevelUnlocker, LevelScroller };
export default LevelScroller;
