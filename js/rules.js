// rules.js - Combined with title visibility control
document.addEventListener('DOMContentLoaded', function() {
    // Create the rules box
    createRulesBox();
    
    // Set up event handlers
    setupEventHandlers();
    
    // Set up title visibility control
    setupTitleVisibility();
});

/**
 * Creates the rules box and inserts it into the DOM
 */
function createRulesBox() {
    // Create the rules box container
    const rulesBox = document.createElement('div');
    rulesBox.id = 'rules-box';
    rulesBox.className = 'rules-box styled-box'; // Add styled-box class
    
    // Set the content of the rules box
    rulesBox.innerHTML = `
    <div class="rules-content styled-box-content">
    <h2 class="rules-box-title styled-box-title">HOW TO PLAY:</h2>
    <div class="rules-image-container">
        <img src="images/gridgameexample1.png" alt="Grid Game Example">
    </div>
    <h2 class="rules-box-title styled-box-title">RULES</h2>
    <div class="rules-section">
        <p>FIND THE PATH OF SUMS - GREEN TO RED</p>
        <p>MOVE TO ADJACENT SQUARES ONLY - LEFT / RIGHT / UP / DOWN</p>
        <p>THE ANSWER TO EACH SUM IS THE FIRST NUMBER OF THE NEXT SUM</p>
        <p>A SQUARE CANNOT BE REUSED</p>
    </div>
    <div class="close-button-container styled-box-footer">
        <button id="rules-close-button" class="rules-close-button metallic-button">CLOSE</button>
    </div>
    </div>
    `;
    
    // Insert the rules box into the DOM
    const rulesContainer = document.getElementById('rules-container');
    if (rulesContainer) {
        rulesContainer.appendChild(rulesBox);
    } else {
        // Fallback: Insert before the game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.parentNode.insertBefore(rulesBox, gameContainer);
        }
    }
}

/**
 * Sets up all event handlers for the rules box
 */
function setupEventHandlers() {
    // Close button event handler
    document.addEventListener('click', function(event) {
        if (event.target.id === 'rules-close-button') {
            hideRulesBox();
        }
    });
    
    // Monitor level buttons to hide rules when a level is selected
    document.addEventListener('click', function(event) {
        // Check if the clicked element is a level button
        const levelButton = event.target.closest('.level-btn, .level-btn-scrollable');
        if (!levelButton) return;
        
        const level = parseInt(levelButton.dataset.level);
        if (isNaN(level)) return;
        
        // Use LevelTracker to check if level is unlocked
        const isUnlocked = window.levelTracker && window.levelTracker.isLevelUnlocked(level);
        
        // Only hide rules and activate game mode if level is unlocked
        if (isUnlocked) {
            hideRulesBox();
            activateGameMode();
        }
    });
}

/**
 * Hides the rules box with animation
 */
function hideRulesBox() {
    const rulesBox = document.getElementById('rules-box');
    if (rulesBox) {
        rulesBox.classList.add('hidden');
        
        // After animation completes, hide completely
        setTimeout(() => {
            rulesBox.style.display = 'none';
        }, 500); // Match the transition duration from CSS
    }
}

/**
 * Activates game mode by adding the game-active class
 */
function activateGameMode() {
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer && !gameContainer.classList.contains('game-active')) {
        gameContainer.classList.add('game-active');
    }
}

/**
 * Shows the rules box (used when game is reset or from external calls)
 */
function showRulesBox() {
    const rulesBox = document.getElementById('rules-box');
    if (rulesBox) {
        // Display the box first
        rulesBox.style.display = 'block';
        
        // Trigger reflow before changing class for animation
        rulesBox.offsetHeight;
        
        // Remove the hidden class
        rulesBox.classList.remove('hidden');
    } else {
        // If the rules box doesn't exist, recreate it
        createRulesBox();
    }
}

/**
 * Sets up title visibility control
 * Hides the game title and level selector title when level buttons are clicked
 */
function setupTitleVisibility() {
    console.log('Setting up title visibility control');
    
    // Use event delegation instead of direct button listeners
    document.addEventListener('click', (event) => {
        // Check if clicked element is or is inside a level button
        const levelButton = event.target.closest('.level-btn, .level-btn-scrollable');
        if (!levelButton) return;
        
        const level = parseInt(levelButton.dataset.level);
        if (isNaN(level)) return;
        
        // Use LevelTracker to check if level is unlocked
        const isUnlocked = window.levelTracker && window.levelTracker.isLevelUnlocked(level);
        
        // Only proceed with hiding title if level is unlocked
        if (!isUnlocked) return;
        
        console.log('Level button clicked, hiding titles');
        
        // Hide game header (title)
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            // Add a fade out animation to the header
            gameHeader.style.transition = 'opacity 0.5s ease-out, margin 0.5s ease-out';
            gameHeader.style.opacity = '0';
            
            // After fade out, hide the element completely
            setTimeout(() => {
                gameHeader.style.display = 'none';
                gameHeader.style.margin = '0';
                gameHeader.style.height = '0';
            }, 500);
        }
        
        // Hide level selector title
        const levelSelectorTitle = document.querySelector('.level-selector-title');
        if (levelSelectorTitle) {
            // Add a fade out animation to the level selector title
            levelSelectorTitle.style.transition = 'opacity 0.5s ease-out, margin 0.5s ease-out, height 0.5s ease-out';
            levelSelectorTitle.style.opacity = '0';
            
            // After fade out, hide the element completely
            setTimeout(() => {
                levelSelectorTitle.style.display = 'none';
                levelSelectorTitle.style.margin = '0';
                levelSelectorTitle.style.height = '0';
            }, 500);
        }
        
        // Ensure game is active
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('game-active');
        }
        
        // Force grid visibility
        setTimeout(() => {
            const gridContainer = document.getElementById('grid-container');
            if (gridContainer) {
                console.log('Forcing grid visibility');
                gridContainer.style.cssText = "visibility: visible !important; height: auto !important; display: grid !important; background-color: #94a3b8 !important; border: 1px solid #94a3b8 !important;";
            }
        }, 600); // Wait a bit longer than the title fade
    });
    
    console.log('Title visibility control set up');
}

// Export functions to be used by other modules
export default {
    showRulesBox,
    hideRulesBox
};
