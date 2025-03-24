// levelscroller.js - Enhanced implementation with game activation fix

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
        
        console.log('Level unlocker initialized with levels:', Array.from(this.unlockedLevels));
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
        
        console.log(`Unlocked tier ${tier}:`, this.levelTiers[tier]);
    }
    
    handleLevelCompletion(level) {
        level = Number(level); // Ensure level is a number
        console.log(`Handling completion of level ${level}`);
        
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
            console.log('Saved unlock progress:', Array.from(this.unlockedLevels));
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
                console.log('Loaded unlock progress:', Array.from(this.unlockedLevels));
            } else {
                console.log('No saved unlock progress found, using defaults');
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
        
        console.log('Reset progress to default levels 1-3');
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
        console.log('Initializing level scroller UI');
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
        
        console.log('Level scroller UI created');
        
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
            upArrow.addEventListener('click', (e) => {
                console.log('Up arrow clicked');
                e.preventDefault(); // Prevent default behavior
                this.currentLevel = this.currentLevel === 1 ? this.maxLevels : this.currentLevel - 1;
                this.updateVisibleLevel();
            });
        } else {
            console.error('Up arrow not found');
        }
        
        // Down arrow (increments level, loops from 10 to 1)
        const downArrow = document.querySelector('.down-arrow');
        if (downArrow) {
            downArrow.addEventListener('click', (e) => {
                console.log('Down arrow clicked');
                e.preventDefault(); // Prevent default behavior
                this.currentLevel = this.currentLevel === this.maxLevels ? 1 : this.currentLevel + 1;
                this.updateVisibleLevel();
            });
        } else {
            console.error('Down arrow not found');
        }
        
        // Level buttons - use direct click handlers for better reliability
        document.querySelectorAll('.level-btn-scrollable').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default behavior
                const level = parseInt(btn.dataset.level);
                console.log(`Level button ${level} clicked directly`);
                this.handleLevelSelection(level);
            });
        });
        
        console.log('Level scroller event listeners attached');
    }
    
    updateVisibleLevel() {
        const buttons = document.querySelectorAll('.level-btn-scrollable');
        if (!buttons || buttons.length === 0) {
            console.error('No level buttons found to update');
            return;
        }
        
        console.log(`Updating visible level to ${this.currentLevel}`);
        
        // First, hide all buttons and reset their classes
        buttons.forEach(btn => {
            btn.classList.remove('active', 'visible', 'locked', 'changing');
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        });
        
        // Show only the current level button
        const currentButton = document.querySelector(`.level-btn-scrollable[data-level="${this.currentLevel}"]`);
        if (currentButton) {
            // Add changing class briefly for animation
            currentButton.classList.add('changing');
            
            // Make the current button visible
            currentButton.classList.add('visible');
            currentButton.style.opacity = '1';
            currentButton.style.pointerEvents = 'auto';
            
            // Check if this level is unlocked
            const isUnlocked = this.levelUnlocker.isLevelUnlocked(this.currentLevel);
            console.log(`Level ${this.currentLevel} is ${isUnlocked ? 'unlocked' : 'locked'}`);
            
            // Add locked class if needed
            if (!isUnlocked) {
                currentButton.classList.add('locked');
                currentButton.style.opacity = '0.4';
                currentButton.style.pointerEvents = 'none';
            }
            
            // If this level is the active level in the game, add active class
            if (window.gameController && window.gameController.state && 
                window.gameController.state.currentLevel === this.currentLevel) {
                currentButton.classList.add('active');
            }
            
            // Remove changing class after animation completes
            setTimeout(() => {
                currentButton.classList.remove('changing');
            }, 300);
        } else {
            console.error(`Button for level ${this.currentLevel} not found`);
        }
    }
    
    handleLevelSelection(level) {
        console.log(`Handling level selection: ${level}`);
        
        // Only allow selecting the visible level
        if (level !== this.currentLevel) {
            console.log(`Level ${level} is not the current visible level (${this.currentLevel})`);
            return;
        }
        
        // Check if this level is unlocked
        const isUnlocked = this.levelUnlocker.isLevelUnlocked(level);
        
        if (!isUnlocked) {
            // Show message that level is locked
            if (window.gameController && window.gameController.showMessage) {
                window.gameController.showMessage(`Level ${level} is locked. Complete earlier levels to unlock it.`, 'error', 3000);
            } else {
                console.log(`Level ${level} is locked. Complete earlier levels to unlock it.`);
                alert(`Level ${level} is locked. Complete earlier levels to unlock it.`);
            }
            return;
        }
        
        console.log(`Starting level ${level}`);
        
        // Make sure the game container gets the active class
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('game-active');
            
            // Make sure rules box is hidden
            const rulesBox = document.querySelector('.rules-box');
            if (rulesBox) {
                rulesBox.style.display = 'none';
                rulesBox.style.visibility = 'hidden';
                rulesBox.style.opacity = '0';
            }
        }
        
        // Make sure grid container is visible and has proper styles
        const gridContainer = document.getElementById('grid-container');
        if (gridContainer) {
            gridContainer.style.visibility = 'visible';
            gridContainer.style.height = 'auto';
            gridContainer.style.overflow = 'visible';
            gridContainer.style.backgroundColor = '#94a3b8'; // Set grid lines color
            gridContainer.style.border = '1px solid #94a3b8';
        }
        
        // Find the game controller
        if (window.gameController && window.gameController.startLevel) {
            console.log(`Starting level ${level} via game controller`);
            window.gameController.startLevel(level);
            
            // Update appearance
            this.updateVisibleLevel();
        } else {
            console.error('Game controller not found or missing startLevel method');
            alert(`Error: Game controller not found. Please refresh the page.`);
        }
    }
    
    // Set the current level from external sources (like game controller)
    setCurrentLevel(level) {
        if (level >= 1 && level <= this.maxLevels) {
            console.log(`Setting current level to ${level}`);
            this.currentLevel = level;
            this.updateVisibleLevel();
        }
    }
}

// Initialize the level scroller when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing level scroller');
    
    // Create global levelScroller instance
    window.levelScroller = new LevelScroller();
    
    // Patch the game controller to update level scroller when level changes
    const checkInterval = setInterval(() => {
        if (window.gameController) {
            clearInterval(checkInterval);
            console.log('Game controller found, patching methods');
            
            // Store the original startLevel method
            const originalStartLevel = window.gameController.startLevel;
            
            // Replace with a patched version that also updates the scroller
            window.gameController.startLevel = function(level) {
                console.log(`Patched startLevel called with level ${level}`);
                
                // Make sure the game container gets the active class
                const gameContainer = document.querySelector('.game-container');
                if (gameContainer) {
                    gameContainer.classList.add('game-active');
                }
                
                // Call the original method
                originalStartLevel.call(this, level);
                
                // Update the level scroller
                if (window.levelScroller) {
                    window.levelScroller.setCurrentLevel(level);
                }
            };
            
            // Fix handlePuzzleSolved method
            if (window.gameController.handlePuzzleSolved) {
                const originalHandlePuzzleSolved = window.gameController.handlePuzzleSolved;
                
                window.gameController.handlePuzzleSolved = function() {
                    console.log('Patched handlePuzzleSolved called');
                    
                    // Call the original method first
                    originalHandlePuzzleSolved.call(this);
                    
                    // Trigger unlock if this is a direct replacement
                    if (window.levelUnlocker) {
                        window.levelUnlocker.handleLevelCompletion(this.state.currentLevel);
                    }
                };
            }
        }
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
});

// Add auxiliary function to ensure grid is properly displayed when game starts
document.addEventListener('DOMContentLoaded', function() {
    // Ensure grid container has proper styles when game becomes active
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (gameContainer.classList.contains('game-active')) {
                        console.log('Game became active, ensuring grid is visible');
                        const gridContainer = document.getElementById('grid-container');
                        if (gridContainer) {
                            gridContainer.style.visibility = 'visible';
                            gridContainer.style.height = 'auto';
                            gridContainer.style.overflow = 'visible';
                            gridContainer.style.backgroundColor = '#94a3b8';
                            gridContainer.style.border = '1px solid #94a3b8';
                        }
                        
                        // Make sure rules box is hidden
                        const rulesBox = document.querySelector('.rules-box');
                        if (rulesBox) {
                            rulesBox.style.display = 'none';
                            rulesBox.style.visibility = 'hidden';
                            rulesBox.style.opacity = '0';
                        }
                    }
                }
            });
        });
        
        observer.observe(gameContainer, { attributes: true });
    }
});

export default LevelScroller;
