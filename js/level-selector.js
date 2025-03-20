// level-selector.js - Direct GameController integration

console.log('[Game] Level selector initialization starting');

// Wait for the game to be fully loaded
window.addEventListener('load', function() {
    // Give extra time for all scripts to load
    setTimeout(initializeLevelSelector, 500);
});

function initializeLevelSelector() {
    console.log('[Game] Checking for game controller');
    
    // Check if game controller is available or wait for it
    if (typeof window.gameController === 'undefined') {
        console.log('[Game] Game controller not found, will retry');
        setTimeout(initializeLevelSelector, 300);
        return;
    }
    
    console.log('[Game] Game controller found, setting up level selector');
    setupLevelSelector();
}

function setupLevelSelector() {
    // Find the container for the level buttons
    const levelButtonsContainer = document.querySelector('.level-buttons');
    if (!levelButtonsContainer) {
        console.error('[Game] Level buttons container not found');
        return;
    }
    
    // Create the selector UI
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'level-selector-control';
    
    // Create title 
    const selectorTitle = document.createElement('div');
    selectorTitle.className = 'level-selector-title';
    selectorTitle.textContent = 'CHOOSE YOUR LEVEL';
    
    // Create the display and arrows
    const levelDisplay = document.createElement('button');
    levelDisplay.className = 'level-display';
    levelDisplay.textContent = 'LEVEL 1';
    levelDisplay.setAttribute('data-level', '1');
    
    const arrowsContainer = document.createElement('div');
    arrowsContainer.className = 'arrows-and-display';
    
    const upArrow = document.createElement('button');
    upArrow.className = 'level-arrow up-arrow';
    upArrow.textContent = '▲';
    
    const downArrow = document.createElement('button');
    downArrow.className = 'level-arrow down-arrow';
    downArrow.textContent = '▼';
    
    // Assemble the UI
    arrowsContainer.appendChild(upArrow);
    arrowsContainer.appendChild(levelDisplay);
    arrowsContainer.appendChild(downArrow);
    selectorContainer.appendChild(arrowsContainer);
    
    // Important: Completely remove the original level buttons
    // This prevents any confusion or interference
    levelButtonsContainer.innerHTML = '';
    
    // Add the new title and selector to the page
    levelButtonsContainer.parentNode.insertBefore(selectorTitle, levelButtonsContainer);
    levelButtonsContainer.parentNode.replaceChild(selectorContainer, levelButtonsContainer);
    
    // Add the styles
    addLevelSelectorStyles();
    
    // Set up the interaction logic
    let currentLevel = 1;
    const maxLevel = 10;
    
    // Update the display
    function updateDisplay() {
        levelDisplay.textContent = `LEVEL ${currentLevel}`;
        levelDisplay.setAttribute('data-level', currentLevel);
        
        // Add animation
        levelDisplay.classList.add('pulse-animation');
        setTimeout(() => levelDisplay.classList.remove('pulse-animation'), 300);
    }
    
    // Start the selected level directly via the game controller
    function startLevel() {
        console.log(`[Game] Starting level ${currentLevel} directly via game controller`);
        
        // Visual feedback
        levelDisplay.classList.add('active');
        setTimeout(() => levelDisplay.classList.remove('active'), 300);
        
        // Hide the title after first use
        selectorTitle.style.display = 'none';
        
        // IMPORTANT: Use the actual game controller directly
        try {
            window.gameController.startLevel(currentLevel);
        } catch (e) {
            console.error('[Game] Error starting level:', e);
            alert(`Failed to start level ${currentLevel}. Try refreshing the page.`);
        }
    }
    
    // Set up event listeners
    upArrow.addEventListener('click', () => {
        currentLevel = currentLevel > 1 ? currentLevel - 1 : maxLevel;
        updateDisplay();
    });
    
    downArrow.addEventListener('click', () => {
        currentLevel = currentLevel < maxLevel ? currentLevel + 1 : 1;
        updateDisplay();
    });
    
    levelDisplay.addEventListener('click', startLevel);
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        // Only if selector is still visible
        if (selectorContainer.offsetParent !== null) {
            if (e.key === 'ArrowUp') upArrow.click();
            if (e.key === 'ArrowDown') downArrow.click();
            if (e.key === 'Enter') levelDisplay.click();
        }
    });
    
    console.log('[Game] Level selector setup complete');
}

function addLevelSelectorStyles() {
    // Remove existing styles if any
    const existingStyles = document.getElementById('level-selector-styles');
    if (existingStyles) existingStyles.remove();
    
    const styleEl = document.createElement('style');
    styleEl.id = 'level-selector-styles';
    styleEl.textContent = `
        .level-selector-title {
            text-align: center;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        
        .level-selector-control {
            display: flex;
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
        
        .level-display:active, 
        .level-display.active {
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
        
        /* Hide all the original level buttons */
        .level-btn {
            display: none !important;
        }
    `;
    
    document.head.appendChild(styleEl);
}
