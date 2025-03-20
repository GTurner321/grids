// direct-level-controller.js - Complete standalone solution that bypasses module issues
// Place this as the VERY FIRST script in your HTML

(function() {
    console.log('Direct level controller initializing...');
    
    // Store the original function references to avoid conflicts
    const originalModuleInit = {};
    
    // Create a direct communication channel
    window.gameBridge = {
        levelToStart: null,
        pendingLevelStart: false,
        modules: {
            gameControllerLoaded: false,
            levelSelectorLoaded: false
        },
        // This function will be called directly by the level selector
        startLevel: function(level) {
            console.log(`[GameBridge] Request to start level ${level}`);
            if (typeof level !== 'number' || level < 1 || level > 10) {
                console.error(`[GameBridge] Invalid level number: ${level}`);
                return false;
            }
            
            this.levelToStart = level;
            this.pendingLevelStart = true;
            
            // Try to start immediately if possible
            this.attemptToStartLevel();
            return true;
        },
        // This checks if we can start a level and does so if possible
        attemptToStartLevel: function() {
            if (!this.pendingLevelStart) return false;
            
            console.log(`[GameBridge] Attempting to start level ${this.levelToStart}`);
            
            // Try direct methods first
            if (window.gameController && typeof window.gameController.startLevel === 'function') {
                try {
                    console.log('[GameBridge] Using gameController.startLevel directly');
                    window.gameController.startLevel(this.levelToStart);
                    this.pendingLevelStart = false;
                    console.log(`[GameBridge] Successfully started level ${this.levelToStart}`);
                    return true;
                } catch (e) {
                    console.error('[GameBridge] Error using direct method:', e);
                }
            } else {
                console.log('[GameBridge] gameController not available, will keep trying');
            }
            
            return false;
        },
        // Register a module as loaded
        registerModule: function(moduleName) {
            if (this.modules.hasOwnProperty(moduleName)) {
                console.log(`[GameBridge] Module registered: ${moduleName}`);
                this.modules[moduleName] = true;
                
                // Check if all required modules are loaded
                const allLoaded = Object.values(this.modules).every(loaded => loaded);
                if (allLoaded) {
                    console.log('[GameBridge] All required modules loaded');
                    
                    // If we have a pending level start, attempt it again
                    if (this.pendingLevelStart) {
                        setTimeout(() => this.attemptToStartLevel(), 500);
                    }
                }
            }
        }
    };
    
    // When document is ready, create the level selector directly
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[GameBridge] DOM content loaded');
        createDirectLevelSelector();
    });
    
    function createDirectLevelSelector() {
        console.log('[GameBridge] Creating direct level selector');
        
        const container = document.querySelector('.level-selector-container');
        if (!container) {
            console.error('[GameBridge] Could not find level-selector-container');
            return;
        }
        
        // Remove any existing content
        container.innerHTML = '';
        
        // Create title
        const title = document.createElement('div');
        title.className = 'level-selector-title';
        title.textContent = 'CHOOSE YOUR LEVEL';
        container.appendChild(title);
        
        // Create main control container
        const controlContainer = document.createElement('div');
        controlContainer.className = 'level-selector-control';
        container.appendChild(controlContainer);
        
        // Create arrow and display container
        const arrowsContainer = document.createElement('div');
        arrowsContainer.className = 'arrows-and-display';
        controlContainer.appendChild(arrowsContainer);
        
        // Create up arrow
        const upArrow = document.createElement('button');
        upArrow.className = 'level-arrow up-arrow';
        upArrow.innerHTML = '▲';
        upArrow.setAttribute('aria-label', 'Previous level');
        arrowsContainer.appendChild(upArrow);
        
        // Create level display button
        const levelDisplay = document.createElement('button');
        levelDisplay.className = 'level-display';
        levelDisplay.textContent = 'LEVEL 1';
        levelDisplay.setAttribute('data-level', '1');
        levelDisplay.setAttribute('aria-label', 'Select this level');
        arrowsContainer.appendChild(levelDisplay);
        
        // Create down arrow
        const downArrow = document.createElement('button');
        downArrow.className = 'level-arrow down-arrow';
        downArrow.innerHTML = '▼';
        downArrow.setAttribute('aria-label', 'Next level');
        arrowsContainer.appendChild(downArrow);
        
        // Add styles
        addLevelSelectorStyles();
        
        // Setup behavior
        let currentLevel = 1;
        const maxLevel = 10;
        
        function updateLevelDisplay() {
            levelDisplay.textContent = `LEVEL ${currentLevel}`;
            levelDisplay.setAttribute('data-level', currentLevel);
        }
        
        upArrow.addEventListener('click', function() {
            currentLevel = currentLevel > 1 ? currentLevel - 1 : maxLevel;
            updateLevelDisplay();
            
            levelDisplay.classList.add('pulse-animation');
            setTimeout(() => {
                levelDisplay.classList.remove('pulse-animation');
            }, 300);
        });
        
        downArrow.addEventListener('click', function() {
            currentLevel = currentLevel < maxLevel ? currentLevel + 1 : 1;
            updateLevelDisplay();
            
            levelDisplay.classList.add('pulse-animation');
            setTimeout(() => {
                levelDisplay.classList.remove('pulse-animation');
            }, 300);
        });
        
        levelDisplay.addEventListener('click', function() {
            console.log(`[GameBridge] Level ${currentLevel} selected`);
            
            // Visual feedback
            this.classList.add('button-active');
            setTimeout(() => {
                this.classList.remove('button-active');
            }, 300);
            
            // Hide selector title
            title.style.display = 'none';
            
            // Start the level using our bridge
            window.gameBridge.startLevel(currentLevel);
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            // Only if game is not active
            const gameActive = document.querySelector('.game-container.game-active');
            if (gameActive) return;
            
            if (e.key === 'ArrowUp') {
                upArrow.click();
            } else if (e.key === 'ArrowDown') {
                downArrow.click();
            } else if (e.key === 'Enter') {
                levelDisplay.click();
            }
        });
        
        // Register that we finished creating the level selector
        window.gameBridge.registerModule('levelSelectorLoaded');
        console.log('[GameBridge] Level selector created and registered');
    }
    
    function addLevelSelectorStyles() {
        // Skip if styles already exist
        if (document.getElementById('level-selector-styles')) return;
        
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
    
    // Create a MutationObserver to watch for gameController
    const observer = new MutationObserver(function(mutations) {
        if (window.gameController && typeof window.gameController.startLevel === 'function') {
            console.log('[GameBridge] gameController detected via MutationObserver');
            window.gameBridge.registerModule('gameControllerLoaded');
            
            // Check if we need to start a level
            if (window.gameBridge.pendingLevelStart) {
                setTimeout(() => window.gameBridge.attemptToStartLevel(), 100);
            }
            
            // Disconnect the observer since we don't need it anymore
            observer.disconnect();
        }
    });
    
    // Start observing
    observer.observe(document, { childList: true, subtree: true });
    
    // Patch GameController constructor to hook into it
    const originalGameController = window.GameController;
    window.GameController = function() {
        console.log('[GameBridge] GameController constructor intercepted');
        
        // Call the original constructor
        const result = originalGameController ? new originalGameController(...arguments) : this;
        
        // Register the module as loaded
        setTimeout(() => {
            console.log('[GameBridge] Registering gameController from constructor hook');
            window.gameBridge.registerModule('gameControllerLoaded');
            
            // Check if we need to start a level
            if (window.gameBridge.pendingLevelStart) {
                setTimeout(() => window.gameBridge.attemptToStartLevel(), 100);
            }
        }, 100);
        
        return result;
    };
    
    // Add a continuous check for gameController as a fallback
    let checkAttempts = 0;
    const maxCheckAttempts = 50;
    
    function checkForGameController() {
        checkAttempts++;
        
        if (window.gameController && typeof window.gameController.startLevel === 'function') {
            console.log(`[GameBridge] gameController found on check attempt ${checkAttempts}`);
            window.gameBridge.registerModule('gameControllerLoaded');
            
            // Check if we need to start a level
            if (window.gameBridge.pendingLevelStart) {
                setTimeout(() => window.gameBridge.attemptToStartLevel(), 100);
            }
            
            // Stop checking
            return;
        }
        
        // Continue checking until max attempts reached
        if (checkAttempts < maxCheckAttempts) {
            setTimeout(checkForGameController, 100);
        } else {
            console.error('[GameBridge] Failed to find gameController after maximum check attempts');
            
            // Create a last resort method that will always be available
            if (!window.startLevel) {
                window.startLevel = function(level) {
                    console.log(`[GameBridge] Last resort startLevel(${level}) called`);
                    return window.gameBridge.startLevel(level);
                };
            }
        }
    }
    
    // Start checking for gameController
    setTimeout(checkForGameController, 500);
    
    // Hook into gamecontroller.js module initialization
    document.addEventListener('gameControllerReady', function(event) {
        console.log('[GameBridge] Received gameControllerReady event');
        window.gameBridge.registerModule('gameControllerLoaded');
        
        // Check if we need to start a level
        if (window.gameBridge.pendingLevelStart) {
            setTimeout(() => window.gameBridge.attemptToStartLevel(), 100);
        }
    });
    
    console.log('Direct level controller initialized');
})();
