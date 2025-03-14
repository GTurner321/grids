// rules.js - Updated version
class RulesModal {
    constructor() {
        this.createModal();
        this.addEventListeners();
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'rules-modal';
        
        modal.innerHTML = `
            <div class="rules-content">
                <div class="rules-text">
                    <h2 class="rules-title">
                        RULES
                    </h2>
                    
                    <div class="rules-section">
                        <p>FIND THE PATH OF SUMS - GREEN TO RED</p>
                        <p>MOVE TO ADJACENT SQUARES ONLY - LEFT / RIGHT / UP / DOWN</p>
                        <p>THE ANSWER TO EACH SUM IS THE FIRST NUMBER OF THE NEXT SUM</p>
                        <p>A SQUARE CANNOT BE REUSED</p>
                    </div>
                    
                    <h2 class="rules-subtitle">
                        MORE
                    </h2>
                    
                    <div class="rules-section">
                        <p>... THE RIGHT MATHS DOESN'T ALWAYS MEAN YOU'RE ON THE RIGHT PATH!</p>
                    </div>
                    
                    <div class="rules-button-container">
                        <button id="start-game" class="start-button">
                            START
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.getElementById('rules-container');
        if (container) {
            container.appendChild(modal);
        }
    }
    
    addEventListeners() {
        const startButton = document.getElementById('start-game');
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Start button clicked');
                this.hideModal();
                // Dispatch game start event
                window.dispatchEvent(new CustomEvent('gameStart'));
            });
        }
        
        // Add keyboard event listener for Enter key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === 'Return') {
                if (startButton) {
                    startButton.click();
                }
            }
        });
    }
    
    hideModal() {
        const container = document.getElementById('rules-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Initialize rules modal when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Ensure the Black Ops One font is loaded
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    new RulesModal();
});

export default RulesModal;
