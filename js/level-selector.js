// integrated-level-selector.js - A direct approach that works with gamecontroller.js
// This file should replace your existing level-selector.js

(function() {
    console.log('Integrated level selector initializing...');
    
    // Create or get the level selector container
    function createLevelSelector() {
        console.log('Creating integrated level selector');
        
        const container = document.querySelector('.level-selector-container');
        if (!container) {
            console.error('Could not find level-selector-container');
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create title
        const title = document.createElement('div');
        title.className = 'level-selector-title';
        title.textContent = 'CHOOSE YOUR LEVEL';
        container.appendChild(title);
        
        // Create level buttons row
        const buttonsRow = document.createElement('div');
        buttonsRow.className = 'level-buttons';
        container.appendChild(buttonsRow);
        
        // Create level buttons 1-10
        for (let i = 1; i <= 10; i++) {
            const button = document.createElement('button');
            button.className = 'level-btn';
            button.textContent = i;
            button.setAttribute('data-level', i);
            button.setAttribute('aria-label', `Start level ${i}`);
            buttonsRow.appendChild(button);
            
            // Add direct click handler
            button.addEventListener('click', function(e) {
                e.preventDefault();
                selectLevel(i);
            });
        }
        
        // Add keyboard navigation support
        document.addEventListener('keydown', function(e) {
            // Only respond to keyboard if level selector is visible
            if (!document.querySelector('.game-container.game-active')) {
                if (e.key >= '1' && e.key <= '9') {
                    selectLevel(parseInt(e.key));
                } else if (e.key === '0') {
                    selectLevel(10);
                }
            }
        });
        
        console.log('Level selector created successfully');
    }
    
    // Function to handle level selection
    function selectLevel(level) {
        console.log(`Level ${level} selected`);
        
        // Visual feedback
        const buttons = document.querySelectorAll('.level-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        const selectedButton = document.querySelector(`.level-btn[data-level="${level}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        // Try different methods to start the level
        
        // Method 1: Direct access to gameController
        if (window.gameController && typeof window.gameController.startLevel === 'function') {
            console.log('Starting level via gameController.startLevel');
            window.gameController.startLevel(level);
            return;
        }
        
        // Method 2: Global startLevel function
        if (typeof window.startLevel === 'function') {
            console.log('Starting level via window.startLevel');
            window.startLevel(level);
            return;
        }
        
        // Method 3: CustomEvent
        console.log('Dispatching startLevelRequest event');
        const event = new CustomEvent('startLevelRequest', {
            detail: { level: level },
            bubbles: true
        });
        document.dispatchEvent(event);
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createLevelSelector);
    } else {
        // DOM already loaded, create immediately
        createLevelSelector();
    }
    
    // Re-initialize if gameController becomes available later
    document.addEventListener('gameControllerReady', function() {
        console.log('gameControllerReady event received, ensuring level selector is initialized');
        
        // Only recreate if not already active
        if (!document.querySelector('.game-container.game-active')) {
            createLevelSelector();
        }
    });
    
    console.log('Integrated level selector initialization complete');
})();
