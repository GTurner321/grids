// component-initializer.js - Ensures proper initialization of game components
// This script should be included after all other game scripts

document.addEventListener('DOMContentLoaded', function() {
    console.log('Component initializer running...');
    
    // Function to ensure level scroller is properly initialized
    function ensureLevelScrollerInitialized() {
        console.log('Checking level scroller initialization...');
        
        // Make sure level selector container is visible
        const levelSelectorContainer = document.querySelector('.level-selector-container');
        if (levelSelectorContainer) {
            levelSelectorContainer.style.display = 'block';
            levelSelectorContainer.style.visibility = 'visible';
            levelSelectorContainer.style.opacity = '1';
            levelSelectorContainer.style.height = 'auto';
        }
        
        // Check if the level scroller exists and is properly initialized
        const levelScrollerContainer = document.querySelector('.level-scroller-container');
        if (!levelScrollerContainer) {
            console.warn('Level scroller container not found, attempting to initialize...');
            
            // Check if level scroller instance exists
            if (window.levelScroller) {
                console.log('Level scroller instance exists, initializing UI...');
                try {
                    window.levelScroller.initializeUI();
                    window.levelScroller.fixScrollerLayout();
                } catch (error) {
                    console.error('Error initializing level scroller UI:', error);
                }
            } else {
                console.warn('Level scroller instance not found, attempting to create...');
                
                // Try to import and create new instance
                import('./levelscroller.js').then(module => {
                    if (!window.levelScroller) {
                        window.levelScroller = new module.LevelScroller();
                    }
                }).catch(error => {
                    console.error('Error importing level scroller module:', error);
                    createEmergencyFallback();
                });
            }
        } else {
            console.log('Level scroller container found, ensuring visibility...');
            
            // Ensure container is visible
            levelScrollerContainer.style.display = 'flex';
            levelScrollerContainer.style.visibility = 'visible';
            levelScrollerContainer.style.opacity = '1';
            
            // Check if it has the proper content
            const levelBtn = levelScrollerContainer.querySelector('.level-btn-scrollable');
            if (!levelBtn || !levelBtn.classList.contains('visible')) {
                console.warn('Level button not properly initialized, fixing...');
                
                if (window.levelScroller) {
                    window.levelScroller.updateVisibleLevel();
                }
            }
        }
        
        // NEW: Fix arrow button functionality
        fixArrowButtons();
    }
    
    // NEW: Function to fix arrow buttons by adding direct click handlers
    function fixArrowButtons() {
        console.log('Fixing arrow button functionality...');
        
        // Get the arrow buttons
        const upArrow = document.querySelector('.up-arrow');
        const downArrow = document.querySelector('.down-arrow');
        
        if (!upArrow || !downArrow) {
            console.log('Arrow buttons not found yet, will retry later');
            setTimeout(fixArrowButtons, 500);
            return;
        }
        
        console.log('Found arrow buttons, adding direct handlers');
        
        // Add direct onclick handlers that bypass the event system
        upArrow.onclick = function() {
            console.log('Up arrow clicked (direct handler)');
            if (window.levelScroller) {
                const currentLevel = window.levelScroller.currentLevel;
                const maxLevels = window.levelScroller.maxLevels || 10;
                const newLevel = currentLevel === 1 ? maxLevels : currentLevel - 1;
                
                console.log(`Changing current level from ${currentLevel} to ${newLevel}`);
                window.levelScroller.currentLevel = newLevel;
                window.levelScroller.updateVisibleLevel();
                
                // Add visual feedback
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 200);
            } else {
                console.error('levelScroller not found!');
            }
        };
        
        downArrow.onclick = function() {
            console.log('Down arrow clicked (direct handler)');
            if (window.levelScroller) {
                const currentLevel = window.levelScroller.currentLevel;
                const maxLevels = window.levelScroller.maxLevels || 10;
                const newLevel = currentLevel === maxLevels ? 1 : currentLevel + 1;
                
                console.log(`Changing current level from ${currentLevel} to ${newLevel}`);
                window.levelScroller.currentLevel = newLevel;
                window.levelScroller.updateVisibleLevel();
                
                // Add visual feedback
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 200);
            } else {
                console.error('levelScroller not found!');
            }
        };
        
        // Explicitly mark them as enabled
        upArrow.removeAttribute('disabled');
        downArrow.removeAttribute('disabled');
        
        upArrow.style.opacity = '1';
        downArrow.style.opacity = '1';
        
        upArrow.style.pointerEvents = 'auto';
        downArrow.style.pointerEvents = 'auto';
        
        console.log('Direct arrow button handlers added successfully');
    }
    
    // Function to create emergency fallback UI if all else fails
    function createEmergencyFallback() {
        console.warn('Creating emergency fallback level selector...');
        
        const levelButtons = document.querySelector('.level-buttons');
        if (!levelButtons) return;
        
        // Create basic level selector
        levelButtons.innerHTML = `
        <div class="level-scroller-container" style="display:flex !important; height:60px; visibility:visible; opacity:1;">
            <button class="level-arrow up-arrow metallic-button" aria-label="Previous level" style="display:flex !important; visibility:visible; opacity:1; pointer-events:auto;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
            </button>
            
            <div class="level-display-container" style="display:flex !important; visibility:visible; opacity:1;">
                <button class="level-btn level-btn-scrollable metallic-button visible" data-level="1" style="visibility:visible; opacity:1;">
                    LEVEL 1
                </button>
            </div>
            
            <button class="level-arrow down-arrow metallic-button" aria-label="Next level" style="display:flex !important; visibility:visible; opacity:1; pointer-events:auto;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        </div>
        `;
        
        // Add minimal functionality
        const upArrow = levelButtons.querySelector('.up-arrow');
        const downArrow = levelButtons.querySelector('.down-arrow');
        const levelBtn = levelButtons.querySelector('.level-btn-scrollable');
        
        let currentLevel = 1;
        
        if (upArrow && levelBtn) {
            // UPDATED: Use direct onclick handler instead of addEventListener
            upArrow.onclick = function() {
                currentLevel = currentLevel === 1 ? 10 : currentLevel - 1;
                levelBtn.setAttribute('data-level', currentLevel);
                levelBtn.textContent = `LEVEL ${currentLevel}`;
                // Add visual feedback
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 200);
            };
        }
        
        if (downArrow && levelBtn) {
            // UPDATED: Use direct onclick handler instead of addEventListener
            downArrow.onclick = function() {
                currentLevel = currentLevel === 10 ? 1 : currentLevel + 1;
                levelBtn.setAttribute('data-level', currentLevel);
                levelBtn.textContent = `LEVEL ${currentLevel}`;
                // Add visual feedback
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 200);
            };
        }
        
        if (levelBtn) {
            // UPDATED: Use direct onclick handler instead of addEventListener
            levelBtn.onclick = function() {
                if (window.gameController && typeof window.gameController.startLevel === 'function') {
                    window.gameController.startLevel(currentLevel);
                }
            };
        }
    }
    
    // Ensure message controller is properly initialized
    function ensureMessageControllerInitialized() {
        if (!window.messageController) {
            console.warn('Message controller not found, attempting to create...');
            
            import('./messages.js').then(module => {
                if (!window.messageController && module.default) {
                    window.messageController = module.default;
                }
            }).catch(error => {
                console.error('Error importing message controller:', error);
            });
        }
    }
    
    // Check for component initialization with retries
    let retryCount = 0;
    function checkComponents() {
        retryCount++;
        console.log(`Component check attempt ${retryCount}...`);
        
        ensureLevelScrollerInitialized();
        ensureMessageControllerInitialized();
        
        // NEW: Explicitly run arrow button fix on each retry
        if (retryCount > 1) {
            fixArrowButtons();
        }
        
        // Retry a few times to make sure components initialize
        if (retryCount < 5) {
            setTimeout(checkComponents, 500 * retryCount);
        } else {
            console.log('Final component check complete');
            // NEW: Run one final arrow button fix
            setTimeout(fixArrowButtons, 1000);
        }
    }
    
    // Start component checks after a short delay
    setTimeout(checkComponents, 100);
});

// Additional check on window load (final safety net)
window.addEventListener('load', function() {
    console.log('Window loaded, performing final component checks...');
    
    // Force visibility on level selector
    const levelSelectorContainer = document.querySelector('.level-selector-container');
    if (levelSelectorContainer) {
        levelSelectorContainer.style.display = 'block';
        levelSelectorContainer.style.visibility = 'visible';
        levelSelectorContainer.style.opacity = '1';
    }
    
    // Check if level scroller is properly initialized
    const levelScrollerContainer = document.querySelector('.level-scroller-container');
    if (!levelScrollerContainer && window.levelScroller) {
        console.warn('Level scroller container not found after page load, forcing initialization');
        window.levelScroller.initializeUI();
        window.levelScroller.fixScrollerLayout();
    }
    
    // NEW: Run one final arrow button fix after window load
    setTimeout(function() {
        // Get the arrow buttons
        const upArrow = document.querySelector('.up-arrow');
        const downArrow = document.querySelector('.down-arrow');
        
        if (upArrow && downArrow) {
            console.log('Window loaded - ensuring arrow buttons are functional');
            
            // Explicitly mark them as enabled
            upArrow.removeAttribute('disabled');
            downArrow.removeAttribute('disabled');
            
            upArrow.style.opacity = '1';
            downArrow.style.opacity = '1';
            
            upArrow.style.pointerEvents = 'auto';
            downArrow.style.pointerEvents = 'auto';
        }
    }, 1000);
});

// Export an empty object for module compatibility
export default {};
