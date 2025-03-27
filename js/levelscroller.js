// levelscroller.js - Modified to properly enforce level locking

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
    
    // Add new scroller UI
    levelButtonsContainer.innerHTML = `
    <div class="level-scroller-container">
        <!-- Left/Up Arrow Button -->
        <button class="level-arrow left-arrow up-arrow metallic-button" aria-label="Previous level">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        </button>
        
        <!-- Level Buttons Container -->
        ${this.createLevelButtons()}
        
        <!-- Right/Down Arrow Button -->
        <button class="level-arrow right-arrow down-arrow metallic-button" aria-label="Next level">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
    </div>
    `;
    
    // Update the visible level (initially level 1)
    this.updateVisibleLevel();
}
    
createLevelButtons() {
    // Create a container for the level buttons
    let html = '<div class="level-btn-container">';
    
    // Create the level buttons
    for (let i = 1; i <= this.maxLevels; i++) {
        html += `
            <button class="level-btn level-btn-scrollable metallic-button" data-level="${i}">
                LEVEL ${i}
            </button>
        `;
    }
    
    // Close the container
    html += '</div>';
    
    return html;
}
    
attachEventListeners() {
    // Up/Left arrow (decrements level, loops from 1 to 10)
    const upArrow = document.querySelector('.up-arrow, .left-arrow');
    if (upArrow) {
        upArrow.addEventListener('click', () => {
            this.currentLevel = this.currentLevel === 1 ? this.maxLevels : this.currentLevel - 1;
            this.updateVisibleLevel();
        });
    }
    
    // Down/Right arrow (increments level, loops from 10 to 1)
    const downArrow = document.querySelector('.down-arrow, .right-arrow');
    if (downArrow) {
        downArrow.addEventListener('click', () => {
            this.currentLevel = this.currentLevel === this.maxLevels ? 1 : this.currentLevel + 1;
            this.updateVisibleLevel();
        });
    }
    
    // Level buttons - use event delegation for better performance
    const levelBtnContainer = document.querySelector('.level-btn-container');
    if (levelBtnContainer) {
        levelBtnContainer.addEventListener('click', (event) => {
            const levelBtn = event.target.closest('.level-btn-scrollable');
            if (levelBtn) {
                const level = parseInt(levelBtn.dataset.level);
                // Only process if this is the visible button
                if (level === this.currentLevel) {
                    this.handleLevelSelection(level);
                }
            }
        });
    }
}
    
    updateVisibleLevel() {
        const buttons = document.querySelectorAll('.level-btn-scrollable');
        if (!buttons || buttons.length === 0) return;
        
        // First, hide all buttons and reset their classes
        buttons.forEach(btn => {
            btn.classList.remove('active', 'visible', 'locked');
        });
        
        // Show only the current level button
        const currentButton = document.querySelector(`.level-btn-scrollable[data-level="${this.currentLevel}"]`);
        if (currentButton) {
            // Make the current button visible
            currentButton.classList.add('visible');
            
            // Check if this level is unlocked
            const level = this.currentLevel;
            let isUnlocked = false;
            
            // Levels 1-3 are always unlocked
            if (level >= 1 && level <= 3) {
                isUnlocked = true;
            }
            // Levels 4-6 are unlocked if any level from 1-3 is completed IN THIS SESSION
            else if (level >= 4 && level <= 6) {
                isUnlocked = window.levelTracker && 
                    [1, 2, 3].some(lvl => window.levelTracker.completedLevels.has(lvl));
            }
            // Levels 7-10 are unlocked if any level from 4-6 is completed IN THIS SESSION
            else if (level >= 7 && level <= 10) {
                isUnlocked = window.levelTracker && 
                    [4, 5, 6].some(lvl => window.levelTracker.completedLevels.has(lvl));
            }
            
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
            
            let isUnlocked = false;
            
            // Levels 1-3 are always unlocked
            if (level >= 1 && level <= 3) {
                isUnlocked = true;
            }
            // Levels 4-6 are unlocked if any level from 1-3 is completed
            else if (level >= 4 && level <= 6) {
                isUnlocked = window.levelTracker && 
                    [1, 2, 3].some(lvl => window.levelTracker.completedLevels.has(lvl));
            }
            // Levels 7-10 are unlocked if any level from 4-6 is completed
            else if (level >= 7 && level <= 10) {
                isUnlocked = window.levelTracker && 
                    [4, 5, 6].some(lvl => window.levelTracker.completedLevels.has(lvl));
            }
            
            // Apply background color based on unlock status
            segment.style.backgroundColor = isUnlocked ? '#b7aec5': '#dfdbe5';
        });
    }
    
    handleLevelSelection(level) {
    // Check if this level is unlocked using the same logic as updateVisibleLevel
    let isUnlocked = false;
    
    // Levels 1-3 are always unlocked
    if (level >= 1 && level <= 3) {
        isUnlocked = true;
    }
    // Levels 4-6 are unlocked if any level from 1-3 is completed
    else if (level >= 4 && level <= 6) {
        isUnlocked = window.levelTracker && 
            [1, 2, 3].some(lvl => window.levelTracker.completedLevels.has(lvl));
    }
    // Levels 7-10 are unlocked if any level from 4-6 is completed
    else if (level >= 7 && level <= 10) {
        isUnlocked = window.levelTracker && 
            [4, 5, 6].some(lvl => window.levelTracker.completedLevels.has(lvl));
    }
    
    if (!isUnlocked) {
        // Show message that level is locked
        if (window.gameController && window.gameController.showMessage) {
            window.gameController.showMessage(`Level ${level} is locked. Complete earlier levels to unlock it.`, 'error', 3000);
        } else {
            console.log(`Level ${level} is locked. Complete earlier levels to unlock it.`);
        }
        return;
    }
    
    // Critical fix: Handle game controller access with retries
    const startSelectedLevel = () => {
        if (window.gameController && typeof window.gameController.startLevel === 'function') {
            // Activate the game
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.classList.add('game-active');
            }
            
            // Make grid container visible
            const gridContainer = document.getElementById('grid-container');
            if (gridContainer) {
                gridContainer.style.visibility = 'visible';
                gridContainer.style.height = 'auto';
                gridContainer.style.backgroundColor = '#94a3b8';
            }
            
            // Start the level
            window.gameController.startLevel(level);
            
            // Update appearance
            this.updateVisibleLevel();
            return true;
        }
        return false;
    };
    
    // Try immediately first
    if (startSelectedLevel()) {
        console.log('Level started successfully, exiting retry loop'); // ADD THIS LINE
        return;
    }
    
    // If not available, try a few more times with short delays
    let attempts = 0;
    const retryInterval = setInterval(() => {
        attempts++;
        console.log(`Attempt ${attempts} to find game controller...`);
        
        if (startSelectedLevel() || attempts >= 10) { // Max 10 attempts
            clearInterval(retryInterval);
            if (attempts >= 10) {
                console.error('Game controller not available after multiple attempts');
                alert('Error starting level. Please refresh the page and try again.');
            }
        }
    }, 200);
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
