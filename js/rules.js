// Initialize the rules box when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Remove the old rules modal if it exists
    const oldRulesContainer = document.getElementById('rules-container');
    if (oldRulesContainer) {
        oldRulesContainer.innerHTML = '';
    }
    
    // Initialize our new rules box
    new RulesBox();
});

export default RulesBox;// rules.js - Updated to show rules box instead of modal
class RulesBox {
    constructor() {
        this.createRulesBox();
        this.setupEventListeners();
        this.addStyles();
        this.fixGrayLineBug();
        this.enlargeLevelSelectorText();
        this.styleBottomButtons();
        this.removeOldRulesStyles();
    }
    
    createRulesBox() {
        // Create the rules box container
        const rulesBox = document.createElement('div');
        rulesBox.className = 'rules-box';
        rulesBox.id = 'rules-box';
        
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
        
        // Find the right place to insert it - after header, before level selector
        const gameHeader = document.querySelector('.game-header');
        const levelSelector = document.querySelector('.level-selector-container');
        
        if (gameHeader && levelSelector) {
            gameHeader.parentNode.insertBefore(rulesBox, levelSelector);
        }
    }
    
    addStyles() {
        // Create a style element for the rules box
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
            }
            
            .rules-box .rules-content {
                width: 100% !important;
            }
            
            .rules-box .rules-section {
                width: 100% !important;
                color: #1e293b !important;
                margin: 5px 0 !important;
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
            }
            
            .rules-box-subtitle {
                font-size: 1rem !important;
                margin-top: 10px !important;
            }
            
            /* Responsive styles */
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
            
            @media (min-width: 769px) {
                .rules-box {
                    width: 60% !important;
                    max-width: 640px !important;
                }
            }
            
            /* Hide rules box when game is active */
            .game-container.game-active .rules-box {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            /* Override any default modal styles */
            #rules-container {
                display: none !important;
            }
            
            .rules-modal {
                display: none !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Listen for level button clicks to hide the rules box
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => this.hideRulesBox());
        });
    }
    
    hideRulesBox() {
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
    
    // Fix for persistent gray line under level buttons
    fixGrayLineBug() {
        // Create additional CSS to fix the gray line issue
        const style = document.createElement('style');
        style.innerHTML = `
            /* Force-remove any gray lines or borders */
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
            
            /* Additional selectors to catch any potential sources */
            .game-container .level-selector-container,
            .game-container .level-buttons,
            .game-container .level-selector-title,
            .game-container > *:not(.game-board) {
                border-bottom-width: 0 !important;
                border-bottom-style: none !important;
                border-bottom-color: transparent !important;
            }
            
            /* Add a small gap between rules box and level selector */
            #rules-box {
                margin-bottom: 12px !important;
            }
            
            .level-selector-container {
                margin-top: 0 !important;
            }
        `;
        document.head.appendChild(style);
        
        // Also apply inline styles to ensure they take priority
        setTimeout(() => {
            const levelContainer = document.querySelector('.level-selector-container');
            if (levelContainer) {
                levelContainer.style.border = 'none';
                levelContainer.style.borderBottom = 'none';
                levelContainer.style.boxShadow = 'none';
            }
            
            const levelButtons = document.querySelector('.level-buttons');
            if (levelButtons) {
                levelButtons.style.border = 'none';
                levelButtons.style.borderBottom = 'none';
                levelButtons.style.boxShadow = 'none';
            }
        }, 100);
    }
    
    // Enlarge 'Choose Your Level' text
    enlargeLevelSelectorText() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enlarged "Choose Your Level" text */
            .level-selector-title {
                font-size: 1.2rem !important;
                font-family: 'Trebuchet MS', Arial, sans-serif !important;
                font-weight: bold !important;
                margin-bottom: 10px !important;
                text-shadow: 0 0 10px white, 0 0 15px white !important;
                color: #1e293b !important;
            }
            
            /* Responsive styles for mobile */
            @media (max-width: 768px) {
                .level-selector-title {
                    font-size: 1.1rem !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Style bottom buttons for large screens
    styleBottomButtons() {
        const bottomButtonsStyle = document.createElement('style');
        bottomButtonsStyle.textContent = `
            /* Bottom buttons styling for large screens (matching mobile style) */
            @media (min-width: 769px) {
                .bottom-buttons {
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: center !important;
                    gap: 15px !important; /* More space between buttons on larger screens */
                    width: 100% !important;
                    max-width: 400px !important;
                    margin: 15px auto !important;
                }
                
                .bottom-btn {
                    font-family: 'Trebuchet MS', Arial, sans-serif !important;
                    font-size: 1rem !important;
                    font-weight: bold !important;
                    height: 42px !important;
                    padding: 8px 15px !important;
                    border-radius: 5px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-transform: uppercase !important;
                    background-color: #3b82f6 !important; /* Blue color */
                    color: white !important;
                    border: 2px solid #60a5fa !important; /* Light blue border */
                    border-bottom-width: 3px !important;
                    min-width: 150px !important;
                    max-width: 180px !important;
                    transition: all 0.2s ease !important;
                }
                
                .bottom-btn:hover {
                    background-color: #2563eb !important; /* Darker blue on hover */
                }
                
                .bottom-btn:active {
                    transform: translateY(2px) !important;
                    border-bottom-width: 1px !important;
                }
                
                /* Style the SVG icons in buttons */
                .bottom-btn svg {
                    width: 16px !important;
                    height: 16px !important;
                    margin-right: 8px !important;
                }
                
                /* Single button mode (after username submitted) */
                .bottom-buttons.single-button {
                    justify-content: center !important;
                }
                
                .bottom-buttons.single-button #leaderboard-btn {
                    margin: 0 auto !important;
                    min-width: 200px !important;
                }
            }
        `;
        document.head.appendChild(bottomButtonsStyle);
    }
    
    // Remove old rules modal styles that might conflict
    removeOldRulesStyles() {
        // Create CSS that overrides and hides the old rules modal styles
        const overrideStyle = document.createElement('style');
        overrideStyle.textContent = `
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
            
            /* Remove any styles from the rules-content class being applied to our new box */
            .rules-box .rules-content {
                background-color: transparent !important;
                background-image: none !important;
                padding: 0 !important;
                border: none !important;
                max-width: none !important;
                width: 100% !important;
            }
            
            /* Override any styles from the rules-section class */
            .rules-box .rules-section {
                background-color: transparent !important;
                color: #1e293b !important;
                padding: 0 !important;
                margin: 5px 0 !important;
                text-align: center !important;
            }
            
            /* Override any styles for the rule text paragraphs */
            .rules-box p {
                color: #1e293b !important;
                font-family: 'Trebuchet MS', Arial, sans-serif !important;
                text-align: center !important;
                margin: 8px 0 !important;
            }
            
            /* Style the title and subtitle to match our design */
            .rules-box-title, 
            .rules-box-subtitle {
                font-family: 'Trebuchet MS', Arial, sans-serif !important;
                background-color: transparent !important;
                background-image: none !important;
                border: none !important;
                color: #1e40af !important;
                text-align: center !important;
                letter-spacing: 0.05em !important;
                padding: 0 !important;
                margin: 5px 0 !important;
                text-shadow: none !important;
            }
            
            /* Empty the rules container completely */
            #rules-container {
                display: none !important;
            }
        `;
        document.head.appendChild(overrideStyle);
        
        // Also try to find and remove any existing style tags that contain rules-modal styles
        setTimeout(() => {
            const allStyles = document.querySelectorAll('style');
            allStyles.forEach(styleTag => {
                if (styleTag.textContent.includes('.rules-modal') || 
                    styleTag.textContent.includes('.rules-content') || 
                    styleTag.textContent.includes('.rules-title')) {
                    
                    // Don't remove the tag completely as it might contain other styles
                    // Just replace the rules-related styles with empty rules
                    let newContent = styleTag.textContent;
                    newContent = newContent.replace(/\.rules-modal\s*{[^}]*}/g, '.rules-modal { display: none !important; }');
                    newContent = newContent.replace(/\.rules-content\s*{[^}]*}/g, '.rules-content {}');
                    newContent = newContent.replace(/\.rules-title\s*{[^}]*}/g, '.rules-title {}');
                    newContent = newContent.replace(/\.rules-subtitle\s*{[^}]*}/g, '.rules-subtitle {}');
                    newContent = newContent.replace(/\.rules-section\s*{[^}]*}/g, '.rules-section {}');
                    styleTag.textContent = newContent;
                }
            });
            
            // Explicitly empty the rules container if it exists
            const rulesContainer = document.getElementById('rules-container');
            if (rulesContainer) {
                rulesContainer.innerHTML = '';
                rulesContainer.style.display = 'none';
            }
        }, 100);
    }
}
