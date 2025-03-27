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
        if (event.target.classList.contains('level-btn') || 
            event.target.classList.contains('level-btn-scrollable')) {
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
 * Hides the game title when level buttons are clicked
 */
function setupTitleVisibility() {
    // Find all level selection buttons and the game header
    const levelButtons = document.querySelectorAll('.level-btn');
    const scrollableLevelButtons = document.querySelectorAll('.level-btn-scrollable');
    const gameHeader = document.querySelector('.game-header');
    
    if (!gameHeader) return;
    
    // Function to handle title hiding
    const hideGameTitle = () => {
        // Add a fade out animation to the header
        gameHeader.style.transition = 'opacity 0.5s ease-out, margin 0.5s ease-out';
        gameHeader.style.opacity = '0';
        
        // After fade out, hide the element completely and remove its margin
        setTimeout(() => {
            gameHeader.style.display = 'none';
            gameHeader.style.margin = '0';
            gameHeader.style.height = '0';
        }, 500);
    };
    
    // Add event listeners to regular level buttons
    if (levelButtons.length > 0) {
        levelButtons.forEach(button => {
            button.addEventListener('click', hideGameTitle, { once: true });
        });
    }
    
    // Add event listeners to scrollable level buttons
    if (scrollableLevelButtons.length > 0) {
        scrollableLevelButtons.forEach(button => {
            button.addEventListener('click', hideGameTitle, { once: true });
        });
    }
}

// Export functions to be used by other modules
export default {
    showRulesBox,
    hideRulesBox
};
