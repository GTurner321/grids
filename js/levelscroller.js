// levelscroller.js - Modified to properly enforce level locking and improve mobile display

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
        
        // Handle window resize events
        window.addEventListener('resize', () => {
            this.fixScrollerLayout();
        });
    }
    
init() {
    console.log('LevelScroller initializing...');
    
    // Check if we need to retry initialization because the DOM isn't ready
    const levelButtonsContainer = document.querySelector('.level-buttons');
    if (!levelButtonsContainer) {
        console.warn('Level buttons container not found, will retry in 100ms');
        setTimeout(() => this.init(), 100);
        return;
    }
    
    // Try initializing UI 
    this.initializeUI();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Apply additional layout fixes
    setTimeout(() => {
        this.fixScrollerLayout();
    }, 200);
    
    // Double check that everything is properly visible after a delay
    setTimeout(() => {
        this.ensureVisibility();
    }, 500);
    
    console.log('LevelScroller initialization complete');
}
    
initializeUI() {
    console.log('Initializing level scroller UI...');
    
    // Get the level buttons container
    const levelButtonsContainer = document.querySelector('.level-buttons');
    if (!levelButtonsContainer) {
        console.error('Could not find level buttons container');
        return;
    }
    
    // Check if already initialized
    if (levelButtonsContainer.querySelector('.level-scroller-container')) {
        console.log('Level scroller UI already initialized');
        
        // Ensure current level is properly displayed
        this.updateVisibleLevel();
        return;
    }
    
    console.log('Creating new level scroller UI...');
    
    // Clear existing buttons
    levelButtonsContainer.innerHTML = '';
    
    // Add new scroller UI
    levelButtonsContainer.innerHTML = `
    <div class="level-scroller-container" style="display:flex !important; visibility:visible !important; opacity:1 !important; height:60px;">
        <button class="level-arrow up-arrow metallic-button" aria-label="Previous level">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        </button>
        
        <div class="level-display-container" style="display:flex !important; visibility:visible !important; opacity:1 !important;">
            ${this.createLevelButtons()}
        </div>
        
        <button class="level-arrow down-arrow metallic-button" aria-label="Next level">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
    </div>
    `;
    
    // Update the visible level (initially level 1)
    this.updateVisibleLevel();
    
    // Add additional styling to ensure visibility
    const style = document.createElement('style');
    style.textContent = `
        .level-selector-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .level-buttons {
            display: block !important; 
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .level-scroller-container {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .level-display-container {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Level scroller UI created successfully');
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
    
    // New method to ensure proper scroller layout, especially on mobile
    fixScrollerLayout() {
        console.log("Fixing level scroller layout...");
        
        const isMobile = window.innerWidth <= 768;
        const scrollerContainer = document.querySelector('.level-scroller-container');
        const levelDisplay = document.querySelector('.level-display-container');
        const arrowButtons = document.querySelectorAll('.level-arrow');
        const levelButtons = document.querySelectorAll('.level-btn-scrollable');
        
        if (!scrollerContainer) {
            console.log("Scroller container not found, will try again later");
            setTimeout(() => this.fixScrollerLayout(), 500);
            return;
        }
        
        if (isMobile) {
            // Mobile dimensions - match level button height
            scrollerContainer.style.height = '44px';
            
            if (levelDisplay) {
                levelDisplay.style.height = '44px';
                levelDisplay.style.maxWidth = '150px';
            }
            
            // Make arrow buttons perfectly square
            arrowButtons.forEach(btn => {
                btn.style.height = '44px';
                btn.style.width = '44px';
                btn.style.padding = '0';
                btn.style.boxShadow = 'none';
                
                // Size the SVG appropriately
                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.style.width = '20px';
                    svg.style.height = '20px';
                }
            });
        } else {
            // Desktop dimensions
            scrollerContainer.style.height = '60px';
            
            if (levelDisplay) {
                levelDisplay.style.height = '60px';
            }
            
            // Desktop arrow buttons
            arrowButtons.forEach(btn => {
                btn.style.height = '60px'; 
                btn.style.width = '60px';
                btn.style.padding = '0';
                btn.style.boxShadow = 'none';
                
                // Size the SVG appropriately
                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.style.width = '24px';
                    svg.style.height = '24px';
                }
            });
        }
        
        // Ensure buttons have metallic-button class
        arrowButtons.forEach(btn => {
            if (!btn.classList.contains('metallic-button')) {
                btn.classList.add('metallic-button');
            }
        });
        
        levelButtons.forEach(btn => {
            if (!btn.classList.contains('metallic-button')) {
                btn.classList.add('metallic-button');
            }
            btn.style.boxShadow = 'none';
        });
        
        // Center the selector title
        const levelSelectorContainer = document.querySelector('.level-selector-container');
        if (levelSelectorContainer) {
            levelSelectorContainer.style.display = 'flex';
            levelSelectorContainer.style.flexDirection = 'column';
            levelSelectorContainer.style.alignItems = 'center';
            
            const title = levelSelectorContainer.querySelector('.level-selector-title');
            if (title) {
                title.style.textAlign = 'center';
                title.style.width = '100%';
            }
        }
        
        console.log("Level scroller layout fixed");
    }

ensureVisibility() {
    console.log('Ensuring level scroller visibility...');
    
    // Ensure containers are visible
    const levelSelectorContainer = document.querySelector('.level-selector-container');
    if (levelSelectorContainer) {
        levelSelectorContainer.style.display = 'block';
        levelSelectorContainer.style.visibility = 'visible';
        levelSelectorContainer.style.height = 'auto';
        levelSelectorContainer.style.opacity = '1';
    }
    
    const levelButtons = document.querySelector('.level-buttons');
    if (levelButtons) {
        levelButtons.style.display = 'block';
        levelButtons.style.visibility = 'visible';
        levelButtons.style.minHeight = '60px';
        levelButtons.style.opacity = '1';
    }
    
    const scrollerContainer = document.querySelector('.level-scroller-container');
    if (scrollerContainer) {
        scrollerContainer.style.display = 'flex';
        scrollerContainer.style.visibility = 'visible';
        scrollerContainer.style.opacity = '1';
    } else {
        // If no scroller container found, try re-initializing the UI
        console.warn('No scroller container found, trying to re-initialize UI');
        this.initializeUI();
    }
    
    // Ensure the current level button is visible
    this.updateVisibleLevel();
    
    // Fix the layout
    this.fixScrollerLayout();
}
 
    // This replaces the existing attachEventListeners method in the LevelScroller class
    attachEventListeners() {
        // Up arrow (decrements level, loops from 1 to 10)
        const upArrow = document.querySelector('.up-arrow');
        if (upArrow) {
            upArrow.addEventListener('click', (e) => {
                // Add clicked class for animation
                e.currentTarget.classList.add('clicked');
                
                // Remove clicked class after animation completes
                setTimeout(() => {
                    e.currentTarget.classList.remove('clicked');
                    // Force repaint to clear any lingering hover/active states
                    void e.currentTarget.offsetWidth;
                }, 200);
                
                this.currentLevel = this.currentLevel === 1 ? this.maxLevels : this.currentLevel - 1;
                this.updateVisibleLevel();
            });
            
            // Handle touchend event explicitly to clear states on touch devices
            upArrow.addEventListener('touchend', (e) => {
                // Wait slightly to ensure click event completes
                setTimeout(() => {
                    e.currentTarget.classList.remove('clicked');
                    // Force repaint to clear any lingering states
                    void e.currentTarget.offsetWidth;
                }, 300);
            });
        }
        
        // Down arrow (increments level, loops from 10 to 1)
        const downArrow = document.querySelector('.down-arrow');
        if (downArrow) {
            downArrow.addEventListener('click', (e) => {
                // Add clicked class for animation
                e.currentTarget.classList.add('clicked');
                
                // Remove clicked class after animation completes
                setTimeout(() => {
                    e.currentTarget.classList.remove('clicked');
                    // Force repaint to clear any lingering hover/active states
                    void e.currentTarget.offsetWidth;
                }, 200);
                
                this.currentLevel = this.currentLevel === this.maxLevels ? 1 : this.currentLevel + 1;
                this.updateVisibleLevel();
            });
            
            // Handle touchend event explicitly to clear states on touch devices
            downArrow.addEventListener('touchend', (e) => {
                // Wait slightly to ensure click event completes
                setTimeout(() => {
                    e.currentTarget.classList.remove('clicked');
                    // Force repaint to clear any lingering states
                    void e.currentTarget.offsetWidth;
                }, 300);
            });
        }
        
        // Level buttons - use event delegation for better performance
        const levelDisplayContainer = document.querySelector('.level-display-container');
        if (levelDisplayContainer) {
            levelDisplayContainer.addEventListener('click', (event) => {
                const levelBtn = event.target.closest('.level-btn');
                if (levelBtn) {
                    // Add clicked class for animation
                    levelBtn.classList.add('clicked');
                    
                    // Remove clicked class after animation completes
                    setTimeout(() => {
                        levelBtn.classList.remove('clicked');
                        // Force repaint
                        void levelBtn.offsetWidth;
                    }, 200);
                    
                    const level = parseInt(levelBtn.dataset.level);
                    // Only process if this is the visible button
                    if (level === this.currentLevel) {
                        this.handleLevelSelection(level);
                    }
                }
            });
            
            // Handle touchend for level buttons with event delegation
            levelDisplayContainer.addEventListener('touchend', (event) => {
                const levelBtn = event.target.closest('.level-btn');
                if (levelBtn) {
                    // Wait slightly to ensure click event completes
                    setTimeout(() => {
                        levelBtn.classList.remove('clicked');
                        // Force repaint
                        void levelBtn.offsetWidth;
                    }, 300);
                }
            });
        }
        
        // Add specific handler for touch devices to detect and handle touch interactions
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            // Add a class to body to identify touch devices for styling
            document.body.classList.add('touch-device');
            
            // Add event listener to clear all button states when touching elsewhere
            document.addEventListener('touchstart', (e) => {
                // Only proceed if we're not touching a button
                if (!e.target.closest('.metallic-button')) {
                    // Clear any stuck button states
                    document.querySelectorAll('.metallic-button').forEach(button => {
                        button.classList.remove('clicked');
                        // Force repaint
                        void button.offsetWidth;
                    });
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
        
        // Ensure proper layout
        this.fixScrollerLayout();
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
            
            // MODIFIED: Don't apply inline styles, use classes instead
            if (isUnlocked) {
                segment.classList.add('unlocked');
                segment.classList.remove('locked');
            } else {
                segment.classList.remove('unlocked');
                segment.classList.add('locked');
            }
            
            // Remove any inline background color that might have been set previously
            segment.style.removeProperty('backgroundColor');
        });
    }
    
handleLevelSelection(level) {
    // Use the LevelTracker to check if the level is unlocked
    const isUnlocked = window.levelTracker && window.levelTracker.isLevelUnlocked(level);
    
    if (!isUnlocked) {
        // Show message that level is locked using messageController
        if (window.messageController) {
            window.messageController.showMessage(`Level ${level} is locked. Complete earlier levels to unlock it.`, 'error', 3000);
        } else {
            // Fallback for backward compatibility
            if (window.gameController && window.gameController.showMessage) {
                window.gameController.showMessage(`Level ${level} is locked. Complete earlier levels to unlock it.`, 'error', 3000);
            } else {
                console.log(`Level ${level} is locked. Complete earlier levels to unlock it.`);
            }
        }
        return; // Early return - don't proceed to activating game elements
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
    
    // Let messageController handle the congratulation messages
    // We'll just return a basic message for backward compatibility
    return 'Congratulations! Puzzle solved!';
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
        // First check if LevelTracker is available
        if (window.levelTracker && typeof window.levelTracker.isLevelUnlocked === 'function') {
            return window.levelTracker.isLevelUnlocked(level);
        }
        
        // Fallback logic if LevelTracker is not available
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
