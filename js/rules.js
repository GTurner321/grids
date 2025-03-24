// rules.js - Modified version
document.addEventListener('DOMContentLoaded', function() {
    // Create the rules box directly in the DOM
    createRulesBox();
    
    // Set up level button handlers
    setupLevelButtonHandlers();
});

// Create the rules box element
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
            <style>
                @media (min-width: 768px) {
                    .rules-image-container {
                        width: 70% !important;
                    }
                }
            </style>
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
    
    // Add event listener for the close button
    setTimeout(() => {
        const closeButton = document.getElementById('rules-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', hideRulesBox);
        }
    }, 0);
    
    // Find the right place to insert it
    const gameHeader = document.querySelector('.game-header');
    const levelSelector = document.querySelector('.level-selector-container');
    
    if (gameHeader && levelSelector) {
        gameHeader.parentNode.insertBefore(rulesBox, levelSelector);
    }
}

// Set up event handlers for level buttons
function setupLevelButtonHandlers() {
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', hideRulesBox);
    });
}

// Hide the rules box when a level is selected
function hideRulesBox() {
    const rulesBox = document.getElementById('rules-box');
    if (rulesBox) {
        rulesBox.style.opacity = '0';
        rulesBox.style.visibility = 'hidden';
        
        // After transition, remove from DOM
        setTimeout(() => {
            if (rulesBox && rulesBox.parentNode) {
                rulesBox.parentNode.removeChild(rulesBox);
            }
        }, 500);
    }
}

export default {};
