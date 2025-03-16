// rules.js - Completely rewritten version

// Wait for the DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
    // Create the rules box directly in the DOM
    createRulesBox();
    
    // Add all necessary styles
    addStyles();
    
    // Fix gray line issue
    removeGrayLine();
    
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

// Add all necessary styles directly
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Rules Box Styles */
        .rules-box {
            background-color: #e6f2ff !important;
            border: 2px solid #60a5fa !important;
            border-radius: 6px !important;
            padding: 10px 15px !important;
            margin: 10px auto 15px !important;
            text-align: center !important;
            font-family: 'Trebuchet MS', Arial, sans-serif !important;
            font-weight: bold !important;
            color: #1e293b !important;
            transition: opacity 0.5s ease-out, visibility 0.5s ease-out !important;
            box-sizing: border-box !important;
            z-index: 50 !important;
            position: relative !important;
            max-width: 640px !important;
            width: 60% !important;
        }
        
        @media (max-width: 768px) {
            .rules-box {
                width: 90% !important;
                margin: 8px auto 12px !important;
                padding: 8px 10px !important;
            }
            
            .rules-box p {
                font-size: 0.8rem !important;
                margin: 6px 0 !important;
            }
        }
        
        .rules-box .rules-content {
            width: 100% !important;
            background-color: transparent !important;
            background-image: none !important;
            padding: 0 !important;
            border: none !important;
            max-width: none !important;
        }
        
        .rules-box .rules-section {
            width: 100% !important;
            color: #1e293b !important;
            margin: 5px 0 !important;
            text-align: center !important;
            background-color: transparent !important;
            padding: 0 !important;
        }
        
        .rules-box p {
            margin: 8px 0 !important;
            font-size: 0.85rem !important;
            text-transform: uppercase !important;
            line-height: 1.4 !important;
            color: #1e293b !important;
            font-family: 'Trebuchet MS', Arial, sans-serif !important;
            text-align: center !important;
            font-weight: bold !important;
        }
        
        .rules-box-title, 
        .rules-box-subtitle {
            font-family: 'Trebuchet MS', Arial, sans-serif !important;
            font-size: 1.1rem !important;
            font-weight: bold !important;
            margin: 5px 0 !important;
            text-align: center !important;
            color: #1e40af !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            background-color: transparent !important;
            background-image: none !important;
            border: none !important;
            padding: 0 !important;
            text-shadow: none !important;
        }
        
        .rules-box-subtitle {
            font-size: 1rem !important;
            margin-top: 10px !important;
        }
        
        /* Hide old rules modal completely */
        .rules-modal {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            z-index: -9999 !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
        }
        
        #rules-container {
            display: none !important;
        }
        
        /* Fix for level selection area - remove gray line */
        .level-selector-container,
        .level-selector-title,
        .level-buttons,
        .game-header,
        .game-header::after,
        .level-selector-container::after,
        .level-buttons::after {
            border: none !important;
            border-top: none !important;
            border-bottom: none !important;
            border-left: none !important;
            border-right: none !important;
            box-shadow: none !important;
            text-decoration: none !important;
            background-image: none !important;
        }
        
        .game-container .level-selector-container,
        .game-container .level-buttons,
        .game-container .level-selector-title,
        .game-container > *:not(.game-board) {
            border-bottom-width: 0 !important;
            border-bottom-style: none !important;
            border-bottom-color: transparent !important;
        }
        
        /* Add space between rules box and level selector */
        #rules-box {
            margin-bottom: 15px !important;
        }
        
        .level-selector-container {
            margin-top: 0 !important;
        }
        
        /* Enlarged "Choose Your Level" text */
        .level-selector-title {
            font-size: 1.2rem !important;
            font-family: 'Trebuchet MS', Arial, sans-serif !important;
            font-weight: bold !important;
            margin-bottom: 10px !important;
            text-shadow: 0 0 10px white, 0 0 15px white !important;
            color: #1e293b !important;
        }
        
        @media (max-width: 768px) {
            .level-selector-title {
                font-size: 1.1rem !important;
            }
        }
        
        /* Bottom buttons styling to match level buttons */
        .bottom-buttons {
            display: flex !important;
            justify-content: center !important;
            gap: 10px !important;
            width: 100% !important;
            max-width: 400px !important;
            margin: 15px auto !important;
        }
        
        .bottom-btn {
            padding: 8px 10px !important;
            font-size: 0.85rem !important;
            background-color: #3b82f6 !important; /* Blue color matching level buttons */
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            font-weight: bold !important;
            min-width: 100px !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
        }
        
        .bottom-btn:hover {
            background-color: #2563eb !important; /* Darker blue on hover - same as level buttons */
        }
        
        .bottom-btn:active {
            background-color: #1d4ed8 !important; /* Even darker blue when active - same as level buttons */
            transform: translateY(1px) !important;
        }
        
        .bottom-btn svg {
            width: 14px !important;
            height: 14px !important;
            margin-right: 4px !important;
        }
        
        /* Ensure single button is centered */
        .bottom-buttons.single-button {
            justify-content: center !important;
        }
        
        .bottom-buttons.single-button #leaderboard-btn {
            margin: 0 auto !important;
        }
        
        /* Game active state handling for rules box */
        .game-container.game-active .rules-box {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
    `;
    
    document.head.appendChild(style);
}

// Fix the gray line issue through direct DOM manipulation
function removeGrayLine() {
    // Select all elements that might have a bottom border
    const elements = document.querySelectorAll('.level-selector-container, .level-buttons, .level-selector-title, .game-header');
    
    // Apply styles directly to each element
    elements.forEach(el => {
        if (el) {
            el.style.border = 'none';
            el.style.borderBottom = 'none';
            el.style.boxShadow = 'none';
        }
    });
    
    // Apply ::after pseudo-element fixes through a separate style tag
    const afterStyle = document.createElement('style');
    afterStyle.textContent = `
        .level-selector-container::after,
        .level-buttons::after,
        .game-header::after {
            display: none !important;
            content: none !important;
            border: none !important;
            border-bottom: none !important;
        }
    `;
    document.head.appendChild(afterStyle);
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

// Export an empty default to satisfy module requirements
export default {};
