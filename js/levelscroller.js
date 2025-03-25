// levelscroller.js - Fixed timing issues with game controller access

class LevelUnlocker {
    constructor() {
    // Define level tiers
    this.levelTiers = {
        tier1: [1, 2, 3],      // Initially unlocked
        tier2: [4, 5, 6],      // Unlocked after completing any level in tier1
        tier3: [7, 8, 9, 10]   // Unlocked after completing any level in tier2
    };
    
    // Track unlocked levels - start with only levels 1-3 unlocked
    this.unlockedLevels = new Set(this.levelTiers.tier1);
    
    // No need to load from localStorage since we want to reset on page refresh
    // this.loadUnlockProgress(); 
    
    // Listen for level tracker initialization
    document.addEventListener('levelTrackerReady', () => {
        console.log('Level tracker is ready - updating unlocks');
        this.syncWithLevelTracker();
    });
    
    // Make available globally
    window.levelUnlocker = this;
    
    // Check if level tracker is already available
    if (window.levelTracker) {
        this.syncWithLevelTracker();
    }
}
    
isLevelUnlocked(level) {
    level = Number(level);
    
    // Tier 1 is always unlocked
    if (this.levelTiers.tier1.includes(level)) {
        return true;
    }
    
    // Check if level is in our unlockedLevels set (regardless of levelTracker)
    if (this.unlockedLevels.has(level)) {
        return true;
    }
    
    return false;
}
    
syncWithLevelTracker() {
    if (!window.levelTracker || !window.levelTracker.completedLevels) {
        console.log('Level tracker not fully initialized yet');
        return;
    }
    
    console.log('Syncing level unlocks with level tracker');
    
    // Reset to initial state (only tier1 unlocked)
    this.unlockedLevels = new Set(this.levelTiers.tier1);
    
    // Check if any tier1 level is completed to unlock tier2
    const anyTier1Completed = this.levelTiers.tier1.some(lvl => 
        window.levelTracker.completedLevels.has(lvl)
    );
    
    if (anyTier1Completed) {
        this.levelTiers.tier2.forEach(level => {
            this.unlockedLevels.add(level);
        });
    }
    
    // Check if any tier2 level is completed to unlock tier3
    const anyTier2Completed = this.levelTiers.tier2.some(lvl => 
        window.levelTracker.completedLevels.has(lvl)
    );
    
    if (anyTier2Completed) {
        this.levelTiers.tier3.forEach(level => {
            this.unlockedLevels.add(level);
        });
    }
    
    // Update the UI
    this.updateScoreBarSegments();
    
    // Update level scroller if available
    if (window.levelScroller) {
        window.levelScroller.updateVisibleLevel();
    }
}
    
    unlockTier(tier) {
        if (!this.levelTiers[tier]) return;
        
        this.levelTiers[tier].forEach(level => {
            this.unlockedLevels.add(level);
        });
        
        // Save progress
        this.saveUnlockProgress();
        
        // Update level scroller if available
        if (window.levelScroller) {
            window.levelScroller.updateVisibleLevel();
        }
    }
    
handleLevelCompletion(level) {
    level = Number(level);
    
    // Sync with level tracker to ensure we have latest completed levels
    this.syncWithLevelTracker();
    
    // Level tiers
    const tier1 = this.levelTiers.tier1;
    const tier2 = this.levelTiers.tier2;
    
    // Check if this completion unlocks new tiers
    if (tier1.includes(level)) {
        // Unlock tier2 levels
        tier2.forEach(lvl => this.unlockedLevels.add(lvl));
        
        // Schedule follow-up message after 5 seconds
        setTimeout(() => {
            if (window.gameController && window.gameController.showMessage) {
                window.gameController.showMessage('Scroll through and select a new level from 1 to 6 to continue.', 'info', 5000);
            }
        }, 5000);
        
        // Update UI
        this.updateScoreBarSegments();
        if (window.levelScroller) {
            window.levelScroller.updateVisibleLevel();
        }
        
        return 'Congratulations! Puzzle solved! You have unlocked levels 4 to 6.';
    } 
    else if (tier2.includes(level)) {
        // Unlock tier3 levels
        this.levelTiers.tier3.forEach(lvl => this.unlockedLevels.add(lvl));
        
        // Schedule follow-up message after 5 seconds
        setTimeout(() => {
            if (window.gameController && window.gameController.showMessage) {
                window.gameController.showMessage('Scroll through and select a new level from 1 to 10 to continue.', 'info', 5000);
            }
        }, 5000);
        
        // Update UI
        this.updateScoreBarSegments();
        if (window.levelScroller) {
            window.levelScroller.updateVisibleLevel();
        }
        
        return 'Congratulations! Puzzle solved! You have unlocked levels 7 to 10.';
    }
    
    return 'Congratulations! Puzzle solved!';
}
        
    resetProgress() {
        this.unlockedLevels = new Set([1, 2, 3]);
        this.saveUnlockProgress();
        
        // Update level scroller if available
        if (window.levelScroller) {
            window.levelScroller.updateVisibleLevel();
        }
    }

updateScoreBarSegments() {
    const segments = document.querySelectorAll('.level-segment');
    if (!segments.length) return;
    
    // Apply styles based on our unlockedLevels set
    segments.forEach(segment => {
        const level = parseInt(segment.dataset.level);
        
        // Skip if already completed
        if (segment.classList.contains('completed')) return;
        
        if (this.unlockedLevels.has(level)) {
            // Unlocked levels get darker blue background
            segment.style.backgroundColor = '#dbeafe';
        } else {
            // Locked levels get lighter blue background
            segment.style.backgroundColor = '#e6f2ff';
        }
    });
}
    
}

class LevelScroller {
    constructor() {
        this.currentLevel = 1;
        this.maxLevels = 10;
        
        // Initialize level unlocker
        this.levelUnlocker = new LevelUnlocker();
        
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
                <button class="level-arrow up-arrow" aria-label="Previous level">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
                
                <div class="level-display-container">
                    ${this.createLevelButtons()}
                </div>
                
                <button class="level-arrow down-arrow" aria-label="Next level">
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
        let buttonsHtml = '';
        
        for (let i = 1; i <= this.maxLevels; i++) {
            buttonsHtml += `
                <button class="level-btn level-btn-scrollable" data-level="${i}">
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
            upArrow.addEventListener('click', () => {
                this.currentLevel = this.currentLevel === 1 ? this.maxLevels : this.currentLevel - 1;
                this.updateVisibleLevel();
            });
        }
        
        // Down arrow (increments level, loops from 10 to 1)
        const downArrow = document.querySelector('.down-arrow');
        if (downArrow) {
            downArrow.addEventListener('click', () => {
                this.currentLevel = this.currentLevel === this.maxLevels ? 1 : this.currentLevel + 1;
                this.updateVisibleLevel();
            });
        }
        
        // Level buttons - use event delegation for better performance
        const levelDisplayContainer = document.querySelector('.level-display-container');
        if (levelDisplayContainer) {
            levelDisplayContainer.addEventListener('click', (event) => {
                const levelBtn = event.target.closest('.level-btn');
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
            const isUnlocked = this.levelUnlocker.isLevelUnlocked(this.currentLevel);
            
            // Add locked class if needed
            if (!isUnlocked) {
                currentButton.classList.add('locked');
            }
            
            // If this level is the active level in the game, add active class
            if (window.gameController && window.gameController.state && 
                window.gameController.state.currentLevel === this.currentLevel) {
                currentButton.classList.add('active');
            }
        }
    }
    
    handleLevelSelection(level) {
        // Check if this level is unlocked
        const isUnlocked = this.levelUnlocker.isLevelUnlocked(level);
        
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
        if (startSelectedLevel()) return;
        
        // If not available, try a few more times with short delays
        let attempts = 0;
        const retryInterval = setInterval(() => {
            attempts++;
            console.log(`Attempt ${attempts} to find game controller...`);
            
            if (startSelectedLevel() || attempts >= 10) { // Increased max attempts to 10
                clearInterval(retryInterval);
                if (attempts >= 10) {
                    console.error('Game controller not available after multiple attempts');
                    alert('Error starting level. Please refresh the page and try again.');
                }
            }
        }, 200); // Increased delay between attempts to 200ms
    }
    
    // Set the current level from external sources (like game controller)
    setCurrentLevel(level) {
        if (level >= 1 && level <= this.maxLevels) {
            this.currentLevel = level;
            this.updateVisibleLevel();
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
