/**
 * button-effects.js - Improved button click effects
 * Adds consistent click animations and touch device optimizations
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Button effects initializing...");
    
    // Function to handle button clicks and reset hover states
    function setupButtonClickEffects() {
        // Add click handler to all metallic buttons
        document.querySelectorAll('.metallic-button').forEach(button => {
            button.addEventListener('click', (e) => {
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
        console.log("Initializing level scroller buttons...");
        
        // Set up arrow buttons
        const arrowButtons = document.querySelectorAll('.level-arrow');
        if (arrowButtons.length > 0) {
            console.log("Found arrow buttons:", arrowButtons.length);
            
            arrowButtons.forEach(button => {
                // Make sure these have metallic-button class
                if (!button.classList.contains('metallic-button')) {
                    button.classList.add('metallic-button');
                }
                
                // Clear any box-shadow to ensure consistency
                button.style.boxShadow = 'none';
                
                // Remove any CSS properties that might be causing problems
                if (window.innerWidth <= 768) {
                    // Mobile: Ensure square dimensions
                    button.style.width = button.style.height;
                    button.style.aspectRatio = '1/1';
                }
            });
        }
        
        // Set up level buttons
        const levelButtons = document.querySelectorAll('.level-btn-scrollable');
        if (levelButtons.length > 0) {
            console.log("Found level buttons:", levelButtons.length);
            
            levelButtons.forEach(button => {
                // Make sure these have metallic-button class
                if (!button.classList.contains('metallic-button')) {
                    button.classList.add('metallic-button');
                }
                
                // Clear any box-shadow to ensure consistency
                button.style.boxShadow = 'none';
            });
        }
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
    
    // Watch for window resize events to maintain proper dimensions
    window.addEventListener('resize', function() {
        // Re-center elements
        centerLevelSelector();
        
        // Re-setup level buttons for proper dimensions
        setTimeout(initializeLevelScrollerButtons, 300);
    });
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
        
        // Adjust container based on screen size
        if (window.innerWidth <= 768) {
            // Mobile dimensions - make arrow buttons square
            const arrowButtons = document.querySelectorAll('.level-arrow');
            arrowButtons.forEach(btn => {
                btn.style.height = '44px';
                btn.style.width = '44px';
                btn.style.flex = '0 0 44px';
            });
            
            // Set level button container
            const levelDisplayContainer = levelScrollerContainer.querySelector('.level-display-container');
            if (levelDisplayContainer) {
                levelDisplayContainer.style.height = '44px';
                levelDisplayContainer.style.maxWidth = '150px';
            }
        }
    }
}
