// rules.js - Updated to show rules box instead of modal
class RulesBox {
    constructor() {
        this.createRulesBox();
        this.setupEventListeners();
        this.addStyles();
    }
    
    createRulesBox() {
        // Create the rules box container
        const rulesBox = document.createElement('div');
        rulesBox.className = 'rules-box';
        rulesBox.id = 'rules-box';
        
        // Set the content of the rules box
        rulesBox.innerHTML = `
            <div class="rules-content">
                <div class="rules-section">
                    <p>FIND THE PATH OF SUMS - GREEN TO RED</p>
                    <p>MOVE TO ADJACENT SQUARES ONLY - LEFT / RIGHT / UP / DOWN</p>
                    <p>THE ANSWER TO EACH SUM IS THE FIRST NUMBER OF THE NEXT SUM</p>
                    <p>A SQUARE CANNOT BE REUSED</p>
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
                background-color: #e6f2ff;
                border: 2px solid #60a5fa;
                border-radius: 6px;
                padding: 10px 15px;
                margin: 10px auto 15px;
                text-align: center;
                font-family: 'Trebuchet MS', Arial, sans-serif;
                font-weight: bold;
                color: #1e293b;
                transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
                box-sizing: border-box;
            }
            
            .rules-box .rules-content {
                width: 100%;
            }
            
            .rules-box .rules-section {
                width: 100%;
            }
            
            .rules-box p {
                margin: 8px 0;
                font-size: 0.85rem;
                text-transform: uppercase;
                line-height: 1.4;
            }
            
            /* Responsive styles */
            @media (max-width: 768px) {
                .rules-box {
                    width: 90%;
                    margin: 8px auto 12px;
                    padding: 8px 10px;
                }
                
                .rules-box p {
                    font-size: 0.8rem;
                    margin: 6px 0;
                }
            }
            
            @media (min-width: 769px) {
                .rules-box {
                    width: 60%;
                    max-width: 640px;
                }
            }
            
            /* Hide rules box when game is active */
            .game-container.game-active .rules-box {
                display: none;
                opacity: 0;
                visibility: hidden;
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
}

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

export default RulesBox;
