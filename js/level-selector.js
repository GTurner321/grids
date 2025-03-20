// level-selector.js - Complete rewrite with improved communication
console.log('Enhanced level selector loading...');

// Self-invoking function to avoid global scope pollution
(function() {
    // Debug function 
    function debug(message) {
        console.log(`[LevelSelector] ${message}`);
    }
    
    // Configuration - define available levels directly
    const AVAILABLE_LEVELS = 10; // Total number of available levels
    
    // Create a function to start a level that DOESN'T depend on window.gameController
    function startLevel(level) {
        debug(`Requesting start for level ${level}`);
        
        // Create a custom event with the level data
        const event = new CustomEvent('startLevelRequest', { 
            detail: { level: level },
            bubbles: true 
        });
        
        // Dispatch the event - this will be caught by gamecontroller.js
        debug('Dispatching startLevelRequest event');
        document.dispatchEvent(event);
        
        // Return true to indicate the event was dispatched
        return true;
    }
    
    // Wait for DOM to be fully loaded
    window.addEventListener('DOMContentLoaded', () => {
        debug('DOM loaded, initializing level selector');
        initializeLevelSelector();
    });
    
    // Also listen for window load as a fallback
    window.addEventListener('load', () => {
        debug('Window loaded, checking if level selector exists');
        if (!document.querySelector('.level-selector-control')) {
            debug('Level selector not found after load, initializing now');
            initializeLevelSelector();
        }
    });
    
    // Listen for gameControllerReady event
    document.addEventListener('gameControllerReady', (event) => {
        debug('Received gameControllerReady event');
    });
    
    function initializeLevelSelector() {
        debug('Creating standalone level selector');
        
        // Find the container where we'll add our selector
        const container = document.querySelector('.level-selector-container');
        if (!container) {
            debug('ERROR: Could not find .level-selector-container');
            return;
        }
        
        // Clean out any existing content
        container.innerHTML = '';
        
        // Create the title
        const selectorTitle = document.createElement('div');
        selectorTitle.className = 'level-selector-title';
        selectorTitle.textContent = 'CHOOSE YOUR LEVEL';
        container.appendChild(selectorTitle);
        
        // Create the main selector container
        const selectorControl = document.createElement('div');
        selectorControl.className = 'level-selector-control';
        selectorControl.id = 'level-selector-control';
        container.appendChild(selectorControl);
        
        // Create arrows and display (UI elements)
        const arrowsContainer = document.createElement('div');
        arrowsContainer.className = 'arrows-and-display';
        selectorControl.appendChild(arrowsContainer);
        
        // Up arrow
        const upArrow = document.createElement('button');
        upArrow.className = 'level-arrow up-arrow';
        upArrow.innerHTML = '▲';
        upArrow.setAttribute('aria-label', 'Previous level');
        arrowsContainer.appendChild(upArrow);
        
        // Level display
        const levelDisplay = document.createElement('button');
        levelDisplay.className = 'level-display';
        levelDisplay.textContent = 'LEVEL 1';
        levelDisplay.setAttribute('data-level', '1');
        levelDisplay.setAttribute('aria-label', 'Select and start this level');
        arrowsContainer.appendChild(levelDisplay);
        
        // Down arrow
        const downArrow = document.createElement('button');
        downArrow.className = 'level-arrow down-arrow';
        downArrow.innerHTML = '▼';
        downArrow.setAttribute('aria-label', 'Next level');
        arrowsContainer.appendChild(downArrow);
        
        // Add styles
        addLevelSelectorStyles();
        
        // Setup behavior
        setupSelectorBehavior(levelDisplay, upArrow, downArrow, selectorTitle);
        
        debug('Level selector creation complete');
        
        // Remove any original level buttons that might still be in the DOM
        const originalButtons = document.querySelectorAll('.level-btn');
        originalButtons.forEach(btn => {
            if (btn.parentNode) {
                debug(`Removing original button for level ${btn.getAttribute('data-level')}`);
                btn.parentNode.removeChild(btn);
            }
        });
        
        // Also remove the .level-buttons container if it exists
        const oldButtonContainer = document.querySelector('.level-buttons');
        if (oldButtonContainer && oldButtonContainer.parentNode) {
            debug('Removing original level-buttons container');
            oldButtonContainer.parentNode.removeChild(oldButtonContainer);
        }
    }

    function setupSelectorBehavior(levelDisplay, upArrow, downArrow, selectorTitle) {
        debug('Setting up selector behavior');
        
        let currentLevel = 1;
        
        // Function to update the level display
        const updateLevelDisplay = () => {
            levelDisplay.textContent = `LEVEL ${currentLevel}`;
            levelDisplay.setAttribute('data-level', currentLevel);
            debug(`Updated level display to: LEVEL ${currentLevel}`);
        };
        
        // Function to start the selected level - completely refactored to use startLevel function
        const handleLevelSelection = () => {
            debug(`User selected level ${currentLevel}`);
            
            // Visual feedback
            levelDisplay.classList.add('button-active');
            setTimeout(() => {
                levelDisplay.classList.remove('button-active');
            }, 300);
            
            // Hide selector title
            if (selectorTitle) {
                selectorTitle.style.display = 'none';
            }
            
            // Start the level using our startLevel function that uses events
            startLevel(currentLevel);
        };
        
        // Add click listeners
        upArrow.addEventListener('click', () => {
            currentLevel = currentLevel > 1 ? currentLevel - 1 : AVAILABLE_LEVELS;
            updateLevelDisplay();
            levelDisplay.classList.add('pulse-animation');
            setTimeout(() => {
                levelDisplay.classList.remove('pulse-animation');
            }, 300);
        });
        
        downArrow.addEventListener('click', () => {
            currentLevel = currentLevel < AVAILABLE_LEVELS ? currentLevel + 1 : 1;
            updateLevelDisplay();
            levelDisplay.classList.add('pulse-animation');
            setTimeout(() => {
                levelDisplay.classList.remove('pulse-animation');
            }, 300);
        });
        
        levelDisplay.addEventListener('click', () => {
            debug('Level display clicked');
            handleLevelSelection();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only respond if the level selector is visible and we're not in a game
            const gameActive = document.querySelector('.game-container.game-active');
            if (!gameActive && document.querySelector('.level-selector-control')) {
                if (e.key === 'ArrowUp') {
                    upArrow.click();
                } else if (e.key === 'ArrowDown') {
                    downArrow.click();
                } else if (e.key === 'Enter') {
                    levelDisplay.click();
                }
            }
        });
        
        // Initialize with level 1
        updateLevelDisplay();
    }
    
    function addLevelSelectorStyles() {
        if (document.getElementById('level-selector-styles')) {
            return; // Styles already added
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'level-selector-styles';
        styleElement.textContent = `
            /* Level Selector Styles */
            .level-selector-title {
                text-align: center;
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 8px;
                color: #333;
                display: block;
                width: 100%;
            }
            
            .level-selector-control {
                display: flex !important;
                flex-direction: column;
                align-items: center;
                margin: 0 auto 16px;
                position: relative;
                max-width: 320px;
                width: 100%;
            }
            
            .arrows-and-display {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                position: relative;
                margin-bottom: 10px;
            }
            
            .level-display {
                font-family: 'Black Ops One', 'Trebuchet MS', Arial, sans-serif;
                font-size: 1.8rem;
                color: #3b82f6;
                background-color: #f0f9ff;
                padding: 8px 20px;
                border-radius: 6px;
                border: 2px solid #60a5fa;
                text-align: center;
                margin: 0 15px;
                min-width: 160px;
                cursor: pointer;
                user-select: none;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                position: relative;
                outline: none;
                transition: all 0.2s ease;
            }
            
            .level-display:hover {
                background-color: #e0f2fe;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
                transform: translateY(-2px);
            }
            
            .level-display:active, .level-display.button-active {
                transform: translateY(0);
                background-color: #dbeafe;
            }
            
            .level-arrow {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                padding: 0;
                line-height: 1;
            }
            
            .level-arrow:hover {
                background-color: #2563eb;
                transform: scale(1.1);
            }
            
            .level-arrow:active {
                transform: scale(0.95);
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .pulse-animation {
                animation: pulse 0.3s ease-in-out;
            }
            
            /* Force hide any remaining level buttons */
            .level-btn {
                display: none !important;
            }
            
            /* Responsive styles that work across all devices */
            @media (max-width: 768px) {
                .level-display {
                    font-size: 1.4rem;
                    min-width: 140px;
                    padding: 6px 16px;
                }
                
                .level-arrow {
                    width: 32px;
                    height: 32px;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    debug('Level selector module loaded and waiting for DOM ready');
})();
