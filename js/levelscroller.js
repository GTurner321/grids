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
        
        // Listen for game controller ready event
        document.addEventListener('gameControllerReady', () => {
            console.log('Game controller is now ready - level scroller notified');
        });
    }
    
    init() {
        this.initializeUI();
        this.attachEventListeners();
        this.addStyles();
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
    
    addStyles() {
        // Check if styles are already added
        if (document.getElementById('level-scroller-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'level-scroller-styles';
        
        styleElement.textContent = `
            /* Level Scroller Styles */
            .level-scroller-container {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                width: 100%;
                max-width: 320px;
                margin: 0 auto;
                padding: 5px 0;
                height: 50px;
            }
            
            .level-display-container {
                position: relative;
                width: 180px;
                height: 48px;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 10px;
            }
            
            .level-btn-scrollable {
                position: absolute;
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 8px;
                background: linear-gradient(to bottom, #60a5fa, #3b82f6, #2563eb);
                color: white;
                font-family: 'Black Ops One', cursive;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
                border: 2px solid #60a5fa;
                border-bottom-width: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .level-btn-scrollable.visible {
                opacity: 1;
                pointer-events: auto;
                transform: translateY(0);
            }
            
            .level-btn-scrollable.visible:hover:not(.locked) {
                background: linear-gradient(to bottom, #93c5fd, #60a5fa, #3b82f6);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            
            .level-btn-scrollable.active {
                background: linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8);
                border-color: #3b82f6;
            }
            
            .level-btn-scrollable.locked {
                opacity: 0.4;
                pointer-events: none;
                background: linear-gradient(to bottom, #60a5fa, #3b82f6, #2563eb);
                border-color: #60a5fa;
                cursor: not-allowed;
            }
            
            .level-btn-scrollable:active:not(.locked) {
                transform: translateY(1px);
                border-bottom-width: 1px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }
            
            .level-arrow {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(to bottom, #60a5fa, #3b82f6, #2563eb);
                color: white;
                border: 2px solid #60a5fa;
                cursor: pointer;
                transition: all 0.3s ease;
                -webkit-tap-highlight-color: transparent;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                z-index: 10;
            }
            
            .level-arrow svg {
                width: 24px;
                height: 24px;
            }
            
            .level-arrow:hover {
                background: linear-gradient(to bottom, #93c5fd, #60a5fa, #3b82f6);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                transform: translateY(-2px);
            }
            
            .level-arrow:active {
                transform: scale(0.95) translateY(1px);
                background: linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8);
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                border-width: 1px;
            }
            
            /* Adjust level selector title margin */
            .level-selector-title {
                margin-bottom: 10px;
            }
            
            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .level-scroller-container {
                    height: 55px;
                }
                
                .level-btn-scrollable {
                    font-size: 1.1rem;
                }
                
                .level-arrow {
                    width: 36px;
                    height: 36px;
                }
                
                .level-arrow svg {
                    width: 22px;
                    height: 22px;
                }
                
                .level-selector-container {
                    margin-bottom: 15px;
                }
            }
            
            /* Touch device optimizations */
            .touch-device .level-arrow {
                min-height: 48px;
                min-width: 48px;
            }
            
            /* Animation for level change */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .level-btn-scrollable.visible.changing {
                animation: pulse 0.3s ease-in-out;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// Initialize the level scroller when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    window.levelScroller = new LevelScroller();
});

// Export both classes to make them available to other modules
export { LevelUnlocker, LevelScroller };
export default LevelScroller;
