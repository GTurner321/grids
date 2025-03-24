// levelscroller.js - Replaces level buttons with a vertical scrolling interface

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
        return this.unlockedLevels.has(level);
    }
    
    unlockTier(tier) {
        if (!this.levelTiers[tier]) return;
        
        this.levelTiers[tier].forEach(level => {
            this.unlockedLevels.add(level);
        });
        
        // Save progress
        this.saveUnlockProgress();
    }
    
    handleLevelCompletion(level) {
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
                this.unlockedLevels = new Set(unlockedArray);
            }
        } catch (error) {
            console.error('Error loading unlock progress:', error);
        }
    }
    
    resetProgress() {
        this.unlockedLevels = new Set([1, 2, 3]);
        this.saveUnlockProgress();
    }
}

class LevelScroller {
    constructor() {
    this.currentLevel = 1;
    this.maxLevels = 10;
    
    // Initialize level unlocker
    this.levelUnlocker = new LevelUnlocker();
    
    this.initializeUI();
    this.attachEventListeners();
    
    // Make available globally
    window.levelScroller = this;
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
        
        // Add the styles
        this.addStyles();
        
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
        
        // Level buttons - use event delegation to handle clicks
        const levelDisplayContainer = document.querySelector('.level-display-container');
        if (levelDisplayContainer) {
            levelDisplayContainer.addEventListener('click', (event) => {
                const levelBtn = event.target.closest('.level-btn');
                if (levelBtn) {
                    const level = parseInt(levelBtn.dataset.level);
                    this.handleLevelSelection(level);
                }
            });
        }
    }
    
    updateVisibleLevel() {
        const buttons = document.querySelectorAll('.level-btn-scrollable');
        if (!buttons || buttons.length === 0) return;
        
        // Hide all buttons
        buttons.forEach(btn => {
            btn.classList.remove('active', 'visible');
        });
        
        // Show only the current level button
        const currentButton = document.querySelector(`.level-btn-scrollable[data-level="${this.currentLevel}"]`);
        if (currentButton) {
            currentButton.classList.add('visible');
            
            // If this level is the active level in the game, add active class
            if (window.gameController && window.gameController.state && 
                window.gameController.state.currentLevel === this.currentLevel) {
                currentButton.classList.add('active');
            }
        }
    }
    
    handleLevelSelection(level) {
        // Only allow selecting the visible level
        if (level !== this.currentLevel) return;
        
        // Find the game controller
        if (window.gameController && window.gameController.startLevel) {
            window.gameController.startLevel(level);
            
            // Update appearance
            this.updateVisibleLevel();
        } else {
            console.error('Game controller not found or missing startLevel method');
        }
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
                background-color: #3b82f6;
                color: white;
                font-family: 'Black Ops One', cursive;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease, transform 0.3s ease;
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
            
            .level-btn-scrollable.active {
                background-color: #1d4ed8;
            }
            
            .level-arrow {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #3b82f6;
                color: white;
                border: none;
                cursor: pointer;
                transition: background-color 0.3s ease, transform 0.1s ease;
                -webkit-tap-highlight-color: transparent;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                border: 2px solid #60a5fa;
                z-index: 10;
            }
            
            .level-arrow svg {
                width: 24px;
                height: 24px;
            }
            
            .level-arrow:hover {
                background-color: #2563eb;
            }
            
            .level-arrow:active {
                transform: scale(0.95);
                background-color: #1d4ed8;
            }
            
            /* Position indicator dots removed as per request */
            
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
                    width: 48px;
                    height: 48px;
                }
                
                .level-arrow svg {
                    width: 28px;
                    height: 28px;
                }
                
                /* Position indicator removed - no need for spacing adjustments */
                .level-selector-container {
                    margin-bottom: 15px;
                }
            }
            
            /* Touch device optimizations */
            .touch-device .level-arrow {
                min-height: 48px;
                min-width: 48px;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// Initialize the level scroller when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    window.levelScroller = new LevelScroller();
    
    // Patch the game controller to update level scroller when level changes
    const checkInterval = setInterval(() => {
        if (window.gameController) {
            clearInterval(checkInterval);
            
            // Store the original startLevel method
            const originalStartLevel = window.gameController.startLevel;
            
            // Replace with a patched version that also updates the scroller
            window.gameController.startLevel = function(level) {
                // Call the original method
                originalStartLevel.call(this, level);
                
                // Update the level scroller
                if (window.levelScroller) {
                    window.levelScroller.setCurrentLevel(level);
                }
            };
        }
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
});

export default LevelScroller;
