/**
 * button-effects.js - Improved button click effects
 * Adds consistent click animations and touch device optimizations
 * 
 * This script ensures:
 * 1. All buttons have the same consistent pulse animation on click
 * 2. Button states are properly reset after animation
 * 3. Touch devices don't have persistent hover effects
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle button clicks and reset hover states
    function setupButtonClickEffects() {
        // Optional: Create audio element for tock sound
        // Uncomment if sound effects are desired
        /*
        const tockSound = new Audio();
        tockSound.src = 'data:audio/mp3;base64,...'; // Add base64 audio here
        tockSound.load();
        */

        // Add click handler to all metallic buttons
        document.querySelectorAll('.metallic-button').forEach(button => {
            button.addEventListener('click', (e) => {
                // Optional: Play sound effect
                /*
                tockSound.currentTime = 0;
                tockSound.play().catch(e => console.log('Audio play failed:', e));
                */
                
                // Add haptic feedback if supported
                if (navigator.vibrate) {
                    navigator.vibrate(20); // 20ms vibration
                }
                
                // Add animation class
                button.classList.add('clicked');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    button.classList.remove('clicked');
                    // Force DOM reflow to reset stuck hover states on touch devices
                    void button.offsetWidth;
                }, 200);
            });
            
            // Add touchend event handler specifically for touch devices
            button.addEventListener('touchend', () => {
                // Short delay to allow click event to fire first
                setTimeout(() => {
                    button.classList.remove('clicked');
                    // Force repaint to clear any lingering hover/active states
                    void button.offsetWidth;
                }, 300);
            });
        });
        
        // Fix for level scroller buttons
        initializeLevelScrollerButtons();
    }
    
    // Special handling for level scroller buttons to ensure visual consistency
    function initializeLevelScrollerButtons() {
        // Set up arrow buttons
        const arrowButtons = document.querySelectorAll('.level-arrow');
        arrowButtons.forEach(button => {
            // Make sure these have metallic-button class
            if (!button.classList.contains('metallic-button')) {
                button.classList.add('metallic-button');
            }
        });
        
        // Set up level buttons
        const levelButtons = document.querySelectorAll('.level-btn-scrollable');
        levelButtons.forEach(button => {
            // Make sure these have metallic-button class
            if (!button.classList.contains('metallic-button')) {
                button.classList.add('metallic-button');
            }
        });
    }

    // Check if we're on a touch device
    function isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    }

    // Add touch-device class to body for CSS targeting if needed
    if (isTouchDevice()) {
        document.body.classList.add('touch-device');
        
        // Add event listener to clear all button states when touching elsewhere on touch devices
        document.addEventListener('touchstart', (e) => {
            // Only proceed if we're not touching a button
            if (!e.target.closest('.metallic-button')) {
                // Clear any stuck button states
                document.querySelectorAll('.metallic-button').forEach(button => {
                    button.classList.remove('clicked');
                    // Force repaint
                    void button.offsetWidth;
                });
            }
        });
    }

    // Initialize button effects
    setupButtonClickEffects();
    
    // Re-apply button effects when level scroller is updated
    document.addEventListener('gameControllerReady', () => {
        setTimeout(() => {
            initializeLevelScrollerButtons();
        }, 500);
    });
    
    // Apply centering to level selector container
    centerLevelSelector();
});

// Function to ensure level selector is precisely centered
function centerLevelSelector() {
    const levelSelectorContainer = document.querySelector('.level-selector-container');
    const levelScrollerContainer = document.querySelector('.level-scroller-container');
    
    if (levelSelectorContainer && levelScrollerContainer) {
        // Set explicit text-align center
        levelSelectorContainer.style.textAlign = 'center';
        
        // Ensure container has display flex and center alignment
        levelSelectorContainer.style.display = 'flex';
        levelSelectorContainer.style.flexDirection = 'column';
        levelSelectorContainer.style.alignItems = 'center';
        
        // Center the title if it exists
        const title = levelSelectorContainer.querySelector('.level-selector-title');
        if (title) {
            title.style.textAlign = 'center';
            title.style.width = '100%';
        }
    }
}
