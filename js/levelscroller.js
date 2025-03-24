// levelscroller.js - Fixed timing issues with game controller access

class LevelUnlocker {
    constructor() {
        // Track unlocked levels - start with only levels 1-3 unlocked
        this.unlockedLevels = new Set([1, 2, 3]);
        this.levelTiers = {
            tier1: [1, 2, 3],      // Initially unlocked
            tier2: [4, 5, 6],      // Unlocked after completing any level in tier1
            tier3: [7, 8, 9, 10]   // Unlocked after completing any level in tier2
        };
        
        // Load any saved unlock progress
        this.loadUnlockProgress();
        
        // Make available globally
        window.levelUnlocker = this;
    }
    
    isLevelUnlocked(level) {
        return this.unlockedLevels.has(Number(level));
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
        level = Number(level); // Ensure level is a number
        
        // Check if this completion unlocks new tiers
        if (this.levelTiers.tier1.includes(level) && 
            !this.levelTiers.tier2.some(l => this.unlockedLevels.has(l))) {
            this.unlockTier('tier2');
            return 'Congratulations! Puzzle solved! You have unlocked levels 4 to 6.';
        } 
        else if (this.levelTiers.tier2.includes(level) && 
                !this.levelTiers.tier3.some(l => this.unlockedLevels.has(l))) {
            this.unlockTier('tier3');
            return 'Congratulations! Puzzle solved! You have unlocked levels 7 to 10.';
        }
        
        return 'Congratulations! Puzzle solved!';
    }
    
    saveUnlockProgress() {
        try {
            localStorage.setItem('mathPathUnlockedLevels', JSON.stringify(Array.from(this.unlockedLevels)));
        } catch (error) {
            console.error('Error saving unlock progress:', error);
        }
    }
    
    loadUnlockProgress() {
        try {
            const savedData = localStorage.getItem('mathPathUnlockedLevels');
            if (savedData) {
                const unlockedArray = JSON.parse(savedData);
                this.unlockedLevels = new Set(unlockedArray.map(Number)); // Ensure all values are numbers
            }
        } catch (error) {
            console.error('Error loading unlock progress:', error);
        }
    }
    
    resetProgress() {
        this.unlockedLevels = new Set([1, 2, 3]);
        this.saveUnlockProgress();
        
        // Update level scroller if available
        if (window.levelScroller) {
            window.levelScroller.updateVisibleLevel();
        }
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
                <button class="level-btn-scrollable" data-level="${i}">
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
        
        // Level buttons 
        document.querySelectorAll('.level-btn-scrollable').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(btn.dataset.level);
                // Only process if this is the visible button
                if (level === this.currentLevel) {
                    this.handleLevelSelection(level);
                }
            });
        });
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
            if (startSelectedLevel() || attempts >= 5) {
                clearInterval(retryInterval);
                if (attempts >= 5) {
                    console.error('Game controller not available after multiple attempts');
                    alert('Error starting level. Please refresh the page and try again.');
                }
            }
        }, 100);
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

export default LevelScroller;
