// rules.js

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
                        <p>REMOVE 50% OF SPARE SQUARES (-1/3 POINTS)</p>
                        <p>CHECK FOR MISTAKES (-1/4 POINTS)</p>
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
    new RulesModal();
});

export default RulesModal;
