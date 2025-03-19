// rules.js - Modified version (disabled but kept for reference)

// Original functionality is commented out to disable it
document.addEventListener('DOMContentLoaded', function() {
    // Disabled: Create the rules box directly in the DOM
    // createRulesBox();
    
    // Disabled: Set up level button handlers
    // setupLevelButtonHandlers();
    
    // Log that rules are disabled
    console.log('Rules box functionality is disabled as requested');
});

// Create the rules box element (kept for reference but not called)
function createRulesBox() {
    // Create the rules box container
    const rulesBox = document.createElement('div');
    rulesBox.id = 'rules-box';
    rulesBox.className = 'rules-box';
    
    // Set the content of the rules box
    rulesBox.innerHTML = `
        <div class="rules-content">
            <h2 class="rules-box-title">RULES</h2>
            <div class="rules-section">
                <p>FIND THE PATH OF SUMS - GREEN TO RED</p>
                <p>MOVE TO ADJACENT SQUARES ONLY - LEFT / RIGHT / UP / DOWN</p>
                <p>THE ANSWER TO EACH SUM IS THE FIRST NUMBER OF THE NEXT SUM</p>
                <p>A SQUARE CANNOT BE REUSED</p>
            </div>
            <h2 class="rules-box-subtitle">MORE</h2>
            <div class="rules-section">
                <p>THE RIGHT MATHS DOESN'T ALWAYS MEAN YOU'RE ON THE RIGHT PATH!</p>
            </div>
        </div>
    `;
    
    // Find the right place to insert it
    const gameHeader = document.querySelector('.game-header');
    const levelSelector = document.querySelector('.level-selector-container');
    
    if (gameHeader && levelSelector) {
        gameHeader.parentNode.insertBefore(rulesBox, levelSelector);
    }
}

// Set up event handlers for level buttons (kept for reference but not called)
function setupLevelButtonHandlers() {
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', hideRulesBox);
    });
}

// Hide the rules box when a level is selected (kept for reference but not called)
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
