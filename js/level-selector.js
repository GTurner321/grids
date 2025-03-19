// level-selector.js - Up/down arrow selector with select button

document.addEventListener('DOMContentLoaded', function() {
    // Replace the level buttons with an up/down level selector
    replaceButtonsWithRotarySelector();
});

function replaceButtonsWithRotarySelector() {
    // Find the level buttons container
    const levelButtonsContainer = document.querySelector('.level-buttons');
    if (!levelButtonsContainer) {
        console.error('Level buttons container not found');
        return;
    }
    
    // Get all existing level buttons to preserve their data
    const levelButtons = Array.from(document.querySelectorAll('.level-btn'));
    const levels = levelButtons.map(btn => ({
        level: parseInt(btn.dataset.level),
        text: btn.textContent
    }));
    
    // Create the new level selector container
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'level-selector-control';
    
    // Create the selector parts
    const levelDisplay = document.createElement('div');
    levelDisplay.className = 'level-display';
    levelDisplay.textContent = 'LEVEL 1';
    
    // Create a container for the arrows and the display
    const arrowsAndDisplayContainer = document.createElement('div');
    arrowsAndDisplayContainer.className = 'arrows-and-display';
    
    // Create up arrow
    const upArrow = document.createElement('button');
    upArrow.className = 'level-arrow up-arrow';
    upArrow.innerHTML = '▲';
    upArrow.setAttribute('aria-label', 'Previous level');
    
    // Create down arrow
    const downArrow = document.createElement('button');
    downArrow.className = 'level-arrow down-arrow';
    downArrow.innerHTML = '▼';
    downArrow.setAttribute('aria-label', 'Next level');
    
    // Create select button
    const selectButton = document.createElement('button');
    selectButton.className = 'level-select-button';
    selectButton.textContent = 'SELECT';
    selectButton.setAttribute('aria-label', 'Start selected level');
    
    // Add everything to the container
    arrowsAndDisplayContainer.appendChild(upArrow);
    arrowsAndDisplayContainer.appendChild(levelDisplay);
    arrowsAndDisplayContainer.appendChild(downArrow);
    
    selectorContainer.appendChild(arrowsAndDisplayContainer);
    selectorContainer.appendChild(selectButton);
    
    // Replace the buttons container with our new selector
    levelButtonsContainer.parentNode.replaceChild(selectorContainer, levelButtonsContainer);
    
    // Update the selector title
    const selectorTitle = document.querySelector('.level-selector-title');
    if (selectorTitle) {
        selectorTitle.textContent = 'CHOOSE YOUR LEVEL';
    }
    
    // Add the styles
    addLevelSelectorStyles();
    
    // Set up the event listeners
    setupSelectorBehavior(levelDisplay, upArrow, downArrow, selectButton);
}

function setupSelectorBehavior(levelDisplay, upArrow, downArrow, selectButton) {
    const maxLevel = 10;
    let currentLevel = 1;
    
    // Function to update the level display
    const updateLevelDisplay = () => {
        levelDisplay.textContent = `LEVEL ${currentLevel}`;
        levelDisplay.setAttribute('data-level', currentLevel);
    };
    
// Function to start the selected level
const startSelectedLevel = () => {
    // Find the game controller
    const gameController = window.gameController;
    
    // Start the level without confirmation
    // Progress from previous levels is preserved, only current puzzle progress is reset
    if (gameController && typeof gameController.startLevel === 'function') {
        gameController.startLevel(currentLevel);
        console.log(`Starting level ${currentLevel}`);
    } else {
        console.error('Game controller not found or startLevel method not available');
    }
};
    
    // Add click listener for up arrow
    upArrow.addEventListener('click', () => {
        currentLevel = currentLevel > 1 ? currentLevel - 1 : maxLevel;
        updateLevelDisplay();
        
        // Add pulse animation
        levelDisplay.classList.add('pulse-animation');
        setTimeout(() => {
            levelDisplay.classList.remove('pulse-animation');
        }, 300);
    });
    
    // Add click listener for down arrow
    downArrow.addEventListener('click', () => {
        currentLevel = currentLevel < maxLevel ? currentLevel + 1 : 1;
        updateLevelDisplay();
        
        // Add pulse animation
        levelDisplay.classList.add('pulse-animation');
        setTimeout(() => {
            levelDisplay.classList.remove('pulse-animation');
        }, 300);
    });
    
    // Add click listener for select button
    selectButton.addEventListener('click', () => {
        startSelectedLevel();
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only respond if the selector is visible
        const selector = document.querySelector('.level-selector-control');
        if (!selector || selector.style.display === 'none') return;
        
        if (e.key === 'ArrowUp') {
            upArrow.click();
        } else if (e.key === 'ArrowDown') {
            downArrow.click();
        } else if (e.key === 'Enter') {
            selectButton.click();
        }
    });
    
    // Allow level display to be clicked to select as well (convenience)
    levelDisplay.addEventListener('click', () => {
        startSelectedLevel();
    });
    
    // Add mousewheel/scroll support to cycle through levels
    levelDisplay.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            // Scroll up = previous level
            upArrow.click();
        } else {
            // Scroll down = next level
            downArrow.click();
        }
    });
    
    // Initialize with level 1
    updateLevelDisplay();
    
    // Set up game state observer to keep selector visible
    observeGameState();
}

function observeGameState() {
    // Watch for game state changes
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isGameActive = gameContainer.classList.contains('game-active');
                    
                    // Keep the level selector visible but update its appearance
                    const levelSelector = document.querySelector('.level-selector-control');
                    if (levelSelector) {
                        // Update styling for active game state
                        levelSelector.classList.toggle('game-active', isGameActive);
                    }
                }
            });
        });
        
        observer.observe(gameContainer, { attributes: true });
    }
}

function addLevelSelectorStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Level Selector Styles */
        .level-selector-control {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            margin: 0 auto 16px;
            position: relative;
            transition: transform 0.3s ease, opacity 0.3s ease;
            max-width: 320px;
            width: 100%;
        }
        
        .level-selector-control.game-active {
            transform: scale(0.9);
            opacity: 0.95;
            margin-bottom: 8px;
        }
        
        .arrows-and-display {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            position: relative;
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
            transition: all 0.2s ease;
            user-select: none;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .level-display:hover {
            background-color: #e0f2fe;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
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
        
        .level-select-button {
            padding: 10px 30px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: 'Trebuchet MS', Arial, sans-serif;
            letter-spacing: 0.05em;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        
        .level-select-button:hover {
            background-color: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
        }
        
        .level-select-button:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        /* Compact mode when game is active */
        .level-selector-control.game-active::before {
            content: "";
            position: absolute;
            top: -5px;
            left: -10px;
            right: -10px;
            bottom: -5px;
            background-color: rgba(255, 255, 255, 0.92);
            border-radius: 10px;
            z-index: -1;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .game-active .level-display {
            font-size: 1.5rem;
            min-width: 140px;
        }
        
        .game-active .level-arrow {
            width: 32px;
            height: 32px;
            font-size: 14px;
        }
        
        .game-active .level-select-button {
            padding: 8px 24px;
            font-size: 0.9rem;
        }
        
        /* Animation for level change */
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .pulse-animation {
            animation: pulse 0.3s ease-in-out;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
            .level-selector-control {
                max-width: 280px;
                gap: 8px;
            }
            
            .level-display {
                font-size: 1.5rem;
                min-width: 140px;
                padding: 6px 16px;
            }
            
            .level-arrow {
                width: 30px;
                height: 30px;
                font-size: 14px;
            }
            
            .level-select-button {
                padding: 8px 24px;
                font-size: 0.9rem;
            }
            
            .game-active .level-display {
                font-size: 1.3rem;
                padding: 5px 12px;
                min-width: 120px;
            }
            
            .game-active .level-arrow {
                width: 28px;
                height: 28px;
                font-size: 12px;
            }
            
            .game-active .level-select-button {
                padding: 6px 18px;
                font-size: 0.85rem;
            }
        }
        
        /* Touch device optimizations */
        @media (pointer: coarse) {
            .level-arrow, 
            .level-select-button,
            .level-display {
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }
            
            .level-arrow {
                width: 40px;
                height: 40px;
                font-size: 18px;
            }
            
            .level-select-button {
                padding: 12px 32px;
                font-size: 1.1rem;
            }
            
            .game-active .level-arrow {
                width: 36px;
                height: 36px;
                font-size: 16px;
            }
            
            .game-active .level-select-button {
                padding: 10px 28px;
                font-size: 1rem;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Default export for module system
export default {};
