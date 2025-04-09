/**
 * button-effects.js - Improved button click effects
 * Adds consistent click animations and touch device optimizations
 * Ensures level scroller buttons work properly in all screen sizes
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Button effects initializing...");
    
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
        console.log("Initializing level scroller buttons...");
        
        // Monitor for when level buttons are added to DOM
        const levelButtonsObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    // If new nodes were added to the DOM
                    setupLevelScrollerButtons();
                }
            });
        });
        
        // Start observing the level buttons container
        const levelButtonsContainer = document.querySelector('.level-buttons');
        if (levelButtonsContainer) {
            levelButtonsObserver.observe(levelButtonsContainer, { childList: true, subtree: true });
        }
        
        // Initial setup
        setupLevelScrollerButtons();
        
        // Retry after a delay to catch any buttons added after initial DOM load
        setTimeout(setupLevelScrollerButtons, 500);
        setTimeout(setupLevelScrollerButtons, 1000);
    }
    
    function setupLevelScrollerButtons() {
        // Set up arrow buttons
        const arrowButtons = document.querySelectorAll('.level-arrow');
        if (arrowButtons.length > 0) {
            console.log("Found arrow buttons:", arrowButtons.length);
            
            arrowButtons.forEach(button => {
                // Make sure these have metallic-button class
                if (!button.classList.contains('metallic-button')) {
                    button.classList.add('metallic-button');
                }
                
                // Clear any inline styles that might be interfering
                if (window.innerWidth <= 768) {
                    // Mobile: Ensure square dimensions
                    button.style.height = '44px';
                    button.style.width = '44px';
                    button.style.padding = '0';
                    button.style.boxShadow = 'none';
                } else {
                    // Reset desktop styles
                    button.style.boxShadow = 'none';
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
                
                // Clear any inline styles that might be interfering
                if (window.innerWidth <= 768) {
                    // Mobile: Ensure slightly less height
                    button.style.boxShadow = 'none';
                } else {
                    // Reset desktop styles
                    button.style.boxShadow = 'none';
                }
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
        setTimeout(setupLevelScrollerButtons, 300);
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
            // Mobile dimensions
            levelScrollerContainer.style.height = '44px';
            
            // Set arrow buttons to 44px square
            document.querySelectorAll('.level-arrow').forEach(btn => {
                btn.style.height = '44px';
                btn.style.width = '44px';
                btn.style.flex = '0 0 44px';
            });
            
            // Set level button container
            const levelDisplayContainer = levelScrollerContainer.querySelector('.level-display-container');
            if (levelDisplayContainer) {
                levelDisplayContainer.style.height = '44px';
            }
        }
    }
}
