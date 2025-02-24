// rules.js

class RulesModal {
    constructor() {
        this.createModal();
        this.addEventListeners();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
        
        modal.innerHTML = `
            <div class="bg-blue-950 p-4 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                <div class="text-center font-mono">
                    <h2 class="text-red-500 text-xl font-bold mb-2">
                        RULES
                    </h2>
                    
                    <div class="text-yellow-300 text-xs font-bold leading-tight">
                        <p>FIND THE PATH BY FOLLOWING THE MATHEMATICAL SEQUENCE - GREEN TO RED</p>
                        <p>MOVE TO ADJACENT CELLS ONLY - LEFT / RIGHT / UP / DOWN</p>
                        <p>THE ANSWER TO EACH SUM IS THE FIRST NUMBER OF THE NEXT SUM</p>
                        <p>A SQUARE CANNOT BE REUSED</p>
                    </div>
                    
                    <h2 class="text-red-500 text-lg font-bold mt-3 mb-2">
                        MORE
                    </h2>
                    
                    <div class="text-yellow-300 text-xs font-bold leading-tight">
                        <p>REMOVE CELLS NOT IN THE PATH (-1/2 POINTS)</p>
                        <p>CHECK FOR MISTAKES (-1/4 POINTS)</p>
                        <p>... THE RIGHT MATHS DOESN'T ALWAYS MEAN YOU'RE ON THE RIGHT PATH!</p>
                    </div>
                    
                    <div class="flex justify-center mt-4">
                        <button id="start-game" 
                            class="px-6 py-2 bg-transparent border-2 border-red-500 text-red-500 text-xl font-bold rounded-lg hover:bg-blue-950 hover:text-white transition-colors font-mono">
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
