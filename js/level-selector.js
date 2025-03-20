// level-selector.js - Fixed version with improved game controller connection

console.log('Level selector script loading...');

// Immediate self-invoking function to avoid global scope pollution
(function() {
    // Debug function to help troubleshoot
    function debug(message) {
        console.log(`[LevelSelector] ${message}`);
    }

    // Wait until window is fully loaded (including all resources)
    window.addEventListener('load', function() {
        debug('Window fully loaded, initializing level selector');
        // Small delay to ensure everything is ready
        setTimeout(initializeLevelSelector, 500); // Increased delay for better module loading
    });

    function initializeLevelSelector() {
        debug('Starting level selector initialization');
        
        // Check if level buttons exist in the first place
        const levelButtons = document.querySelectorAll('.level-btn');
        debug(`Found ${levelButtons.length} level buttons`);
        
        // If we can't find any level buttons, wait and try again
        if (levelButtons.length === 0) {
            debug('No level buttons found, will retry initialization in 500ms');
            setTimeout(initializeLevelSelector, 500);
            return;
        }
        
        // Check for button container
        const levelButtonsContainer = document.querySelector('.level-buttons');
        if (!levelButtonsContainer) {
            debug('WARNING: Level buttons found but container is missing. Attempting to find parent element.');
            if (levelButtons.length > 0) {
                const firstButton = levelButtons[0];
                const parent = firstButton.parentElement;
                debug(`Using parent of first button: ${parent.tagName} with class ${parent.className}`);
                createRotarySelector(parent, levelButtons);
            } else {
                debug('ERROR: Cannot initialize level selector - no buttons and no container');
            }
            return;
        }
        
        debug('Level buttons container found, proceeding with rotation selector creation');
        createRotarySelector(levelButtonsContainer, levelButtons);
    }

    function createRotarySelector(container, levelButtons) {
        debug('Creating rotary selector UI');
        
        // Get level data from existing buttons
        const levels = Array.from(levelButtons).map(btn => ({
            level: parseInt(btn.dataset.level || btn.getAttribute('data-level') || '1'),
            text: btn.textContent.trim()
        }));
        
        debug(`Found ${levels.length} levels from buttons`);
        
        // Create the main container
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'level-selector-control';
        selectorContainer.id = 'level-selector-control';
        
        // Create title
        const selectorTitle = document.createElement('div');
        selectorTitle.className = 'level-selector-title';
        selectorTitle.textContent = 'CHOOSE YOUR LEVEL';
        
        // Create arrows and display
        const arrowsContainer = document.createElement('div');
        arrowsContainer.className = 'arrows-and-display';
        
        // Up arrow
        const upArrow = document.createElement('button');
        upArrow.className = 'level-arrow up-arrow';
        upArrow.innerHTML = '▲';
        upArrow.setAttribute('aria-label', 'Previous level');
        
        // Level display
        const levelDisplay = document.createElement('button');
        levelDisplay.className = 'level-display';
        levelDisplay.textContent = 'LEVEL 1';
        levelDisplay.setAttribute('data-level', '1');
        levelDisplay.setAttribute('aria-label', 'Select and start this level');
        
        // Down arrow
        const downArrow = document.createElement('button');
        downArrow.className = 'level-arrow down-arrow';
        downArrow.innerHTML = '▼';
        downArrow.setAttribute('aria-label', 'Next level');
        
        // Assemble the elements
        arrowsContainer.appendChild(upArrow);
        arrowsContainer.appendChild(levelDisplay);
        arrowsContainer.appendChild(downArrow);
        
        selectorContainer.appendChild(arrowsContainer);
        
        // Completely remove the original buttons to prevent them from showing on any screen size
        debug('Removing original level buttons');
        levelButtons.forEach(btn => {
            if (btn.parentNode) {
                btn.parentNode.removeChild(btn);
            }
        });
        
        // Clear the container to ensure no original buttons remain
        container.innerHTML = '';
        
        // Insert our new elements
        const parentElement = container.parentElement;
        if (parentElement) {
            debug('Inserting title and selector into DOM');
            parentElement.insertBefore(selectorTitle, container);
            parentElement.insertBefore(selectorContainer, container);
            
            // Optionally remove the original container if it's now empty
            if (container.children.length === 0) {
                parentElement.removeChild(container);
            }
        } else {
            debug('ERROR: Cannot find parent element for level buttons container');
            return;
        }
        
        // Add styles
        addLevelSelectorStyles();
        
        // Setup behavior
        setupSelectorBehavior(levelDisplay, upArrow, downArrow, selectorTitle, levels);
        
        debug('Rotary selector creation complete');
    }

    function setupSelectorBehavior(levelDisplay, upArrow, downArrow, selectorTitle, levels) {
        debug('Setting up selector behavior');
        
        const maxLevel = levels.length || 10;
        let currentLevel = 1;
        
        debug(`Max level: ${maxLevel}, Starting level: ${currentLevel}`);
        
        // Function to update the level display
        const updateLevelDisplay = () => {
            levelDisplay.textContent = `LEVEL ${currentLevel}`;
            levelDisplay.setAttribute('data-level', currentLevel);
            debug(`Updated level display to: LEVEL ${currentLevel}`);
        };
        
        // Function to start the selected level
        const startSelectedLevel = () => {
            debug(`Starting level ${currentLevel}`);
            
            // Add visual feedback
            levelDisplay.classList.add('button-active');
            setTimeout(() => {
                levelDisplay.classList.remove('button-active');
            }, 300);
            
            // Hide the title
            if (selectorTitle) {
                selectorTitle.style.display = 'none';
                debug('Hid level selector title');
            }
            
            // IMPROVED: More robust game controller handling
            const startLevel = () => {
                // First try direct gameController access
                if (typeof window.gameController !== 'undefined' && window.gameController) {
                    debug('Found game controller, calling startLevel directly');
                    try {
                        // Call the method directly
                        window.gameController.startLevel(currentLevel);
                        debug('StartLevel method called successfully');
                        return true;
                    } catch (error) {
                        debug(`Error calling gameController.startLevel: ${error.message}`);
                    }
                }
                
                // Second method: Try to find gameController through import
                debug('Trying alternative method to start level');
                
                // Check if we can find a module with GameController
                const gameControllerScript = document.querySelector('script[src*="gamecontroller.js"]');
                if (gameControllerScript) {
                    debug('Found gamecontroller.js script tag');
                    
                    // Create a custom event that gamecontroller.js can listen for
                    const startLevelEvent = new CustomEvent('startLevelRequest', {
                        detail: { level: currentLevel }
                    });
                    document.dispatchEvent(startLevelEvent);
                    debug('Dispatched startLevelRequest event');
                    return true;
                }
                
                // Last resort: Try to find and click the original level button
                debug('Trying to find original level button as last resort');
                const originalButton = document.querySelector(`.level-btn[data-level="${currentLevel}"]`);
                if (originalButton) {
                    debug('Found original level button, clicking it');
                    originalButton.click();
                    return true;
                }
                
                debug('WARNING: All methods to start level failed');
                return false;
            };
            
            // Try to start the level with a small delay to ensure gameController is ready
            setTimeout(() => {
                const success = startLevel();
                if (!success) {
                    debug('Could not start level, trying one more time after delay');
                    // Try one more time after a longer delay
                    setTimeout(() => {
                        if (!startLevel()) {
                            debug('ERROR: Failed to start level after multiple attempts');
                            alert(`Unable to start level ${currentLevel}. Please refresh the page and try again.`);
                        }
                    }, 1000);
                }
            }, 200);
        };
        
        // Add click listeners
        upArrow.addEventListener('click', () => {
            currentLevel = currentLevel > 1 ? currentLevel - 1 : maxLevel;
            updateLevelDisplay();
            levelDisplay.classList.add('pulse-animation');
            setTimeout(() => {
                levelDisplay.classList.remove('pulse-animation');
            }, 300);
            debug(`Up arrow clicked, new level: ${currentLevel}`);
        });
        
        downArrow.addEventListener('click', () => {
            currentLevel = currentLevel < maxLevel ? currentLevel + 1 : 1;
            updateLevelDisplay();
            levelDisplay.classList.add('pulse-animation');
            setTimeout(() => {
                levelDisplay.classList.remove('pulse-animation');
            }, 300);
            debug(`Down arrow clicked, new level: ${currentLevel}`);
        });
        
        levelDisplay.addEventListener('click', () => {
            debug('Level display clicked');
            startSelectedLevel();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.querySelector('.level-selector-control')) {
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
        debug('Selector behavior setup complete');
        
        // ADDED: Set up event listener for gameController when it becomes available
        const checkForGameController = () => {
            if (typeof window.gameController !== 'undefined' && window.gameController) {
                debug('Game controller is now available');
                // Stop checking once found
                clearInterval(checkInterval);
            }
        };
        
        // Check every 100ms for gameController to become available
        const checkInterval = setInterval(checkForGameController, 100);
        
        // Also add a listener for the gamecontroller module being loaded
        document.addEventListener('gameControllerReady', () => {
            debug('Received gameControllerReady event');
            clearInterval(checkInterval);
        });
    }
    
    function addLevelSelectorStyles() {
        debug('Adding level selector styles');
        
        // Check if styles already exist
        if (document.getElementById('level-selector-styles')) {
            debug('Level selector styles already exist, skipping');
            return;
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
            
            /* Add important flags to ensure our selector is visible */
            .level-selector-control,
            .arrows-and-display,
            .level-display,
            .level-arrow {
                display: flex !important;
            }
            
            /* Ensure proper spacing in container */
            .level-buttons {
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
        debug('Level selector styles added');
    }
    
    debug('Level selector script fully loaded');
})();
