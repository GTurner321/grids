// rules.js - Fixed version to properly create and display the rules box
document.addEventListener('DOMContentLoaded', function() {
    // Create the rules box
    createRulesBox();
    
    // Set up event handlers
    setupEventHandlers();
});

/**
 * Creates the rules box and inserts it into the DOM
 */
function createRulesBox() {
    // Create the rules box container
    const rulesBox = document.createElement('div');
    rulesBox.id = 'rules-box';
    rulesBox.className = 'rules-box';
    
    // Set the content of the rules box
    rulesBox.innerHTML = `
        <div class="rules-content">
            <div class="rules-image-container">
                <img src="images/gridgameexample1.png" alt="Grid Game Example">
            </div>
            <h2 class="rules-box-title">RULES</h2>
            <div class="rules-section">
                <p>FIND THE PATH OF SUMS - GREEN TO RED</p>
                <p>MOVE TO ADJACENT SQUARES ONLY - LEFT / RIGHT / UP / DOWN</p>
                <p>THE ANSWER TO EACH SUM IS THE FIRST NUMBER OF THE NEXT SUM</p>
                <p>A SQUARE CANNOT BE REUSED</p>
            </div>
            <div class="close-button-container">
                <button id="rules-close-button" class="rules-close-button">CLOSE</button>
            </div>
        </div>
    `;
    
    // Insert the rules box into the DOM - outside the game-container to avoid CSS conflicts
    const rulesContainer = document.getElementById('rules-container');
    if (rulesContainer) {
        rulesContainer.appendChild(rulesBox);
        
        // Make sure the rules container is not affected by the "no gray line" CSS
        rulesContainer.style.backgroundColor = ''; // Reset any inherited transparency
        rulesBox.style.backgroundColor = '#e0f2ff'; // Explicitly set background color from CSS
        rulesBox.style.border = '2px solid #60a5fa'; // Explicitly set border from CSS
    } else {
        // Fallback: Insert before the game container to avoid CSS conflicts
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
        rulesBox.style.opacity = '0';
        rulesBox.style.visibility = 'hidden';
        
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
        
        // Add a tiny delay to ensure the game-active class took effect
        setTimeout(() => {
            // Hide the rules box after game activation
            const rulesBox = document.getElementById('rules-box');
            if (rulesBox) {
                rulesBox.style.opacity = '0';
                rulesBox.style.visibility = 'hidden';
                setTimeout(() => {
                    rulesBox.style.display = 'none';
                }, 500);
            }
        }, 50);
    }
}

/**
 * Shows the rules box (used when game is reset or from external calls)
 */
function showRulesBox() {
    const rulesBox = document.getElementById('rules-box');
    if (rulesBox) {
        // Ensure the rules box styling isn't overridden by section 19 CSS
        rulesBox.style.backgroundColor = '#e0f2ff';
        rulesBox.style.border = '2px solid #60a5fa';
        rulesBox.style.display = 'block';
        
        // Trigger reflow before changing opacity for animation
        rulesBox.offsetHeight;
        
        rulesBox.style.opacity = '1';
        rulesBox.style.visibility = 'visible';
    } else {
        // If the rules box doesn't exist, recreate it
        createRulesBox();
    }
}

// Export functions to be used by other modules
export default {
    showRulesBox,
    hideRulesBox
};
