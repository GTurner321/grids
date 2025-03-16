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
