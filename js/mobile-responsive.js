// mobile-responsive.js - Enhances mobile experience for the Path Puzzle game

(function() {
  // Execute when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Fix for iOS viewport height issues
    initViewportHeightFix();
    
    // Add orientation warning
    createOrientationWarning();
    
    // Make record name and leaderboard buttons open modal-style
    enhanceBottomButtons();
    
    // Improve touch handling on grid cells
    optimizeTouchInteractions();
    
    // Improve modal sizing
    improveModalSizing();
    
    // Improve button layout for mobile
    improveButtonLayout();
    
    // Enhance message display
    enhanceMessageDisplay();
    
    // Add custom CSS to head
    addMobileStylesIfNeeded();
  });
  
  // Fix for mobile browsers, especially iOS Safari
  function initViewportHeightFix() {
    // First we get the viewport height and multiply it by 1% to get a value for a vh unit
    const vh = window.innerHeight * 0.01;
    // Then we set the value in the --app-height custom property to the root of the document
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    
    // Update on orientation changes and resize
    window.addEventListener('resize', () => {
      const newHeight = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${newHeight}px`);
      
      // Also fix modal containers when the window is resized
      fixModalContainers();
    });
    
    // Add touch-device class for better control
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
      document.body.classList.add('touch-device');
      
      // Add iOS-specific class if needed
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        document.body.classList.add('ios-device');
      }
    }
    
    // Initial fix for modals
    fixModalContainers();
  }
  
  // Fix modal container sizing to ensure they cover the entire screen
  function fixModalContainers() {
    // Function to create and apply a full-screen overlay
    function createOverlay(container) {
      if (!container) return;
      
      // Force container to be completely full screen with !important rules
      const styles = {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: '100vh',
        margin: '0',
        padding: '0',
        zIndex: '9999',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      };
      
      // Apply styles forcing important to override any other styles
      Object.keys(styles).forEach(key => {
        container.style.setProperty(key, styles[key], 'important');
      });
      
      // Special fixes for iOS
      container.style.setProperty('-webkit-transform', 'translateZ(0)', 'important');
      container.style.setProperty('transform', 'translateZ(0)', 'important');
      container.style.setProperty('-webkit-backface-visibility', 'hidden', 'important');
      container.style.setProperty('backface-visibility', 'hidden', 'important');
      container.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
      
      // Add a completely transparent border to force redraw in some browsers
      container.style.setProperty('border', '1px solid rgba(0,0,0,0)', 'important');
    }
    
    // Apply to both modal containers
    createOverlay(document.getElementById('username-area-container'));
    createOverlay(document.getElementById('leaderboard-table-container'));
  }
  
  // Create warning for landscape orientation
  function createOrientationWarning() {
    if (window.innerWidth <= 768) { // Only for mobile devices
      const warningDiv = document.createElement('div');
      warningDiv.className = 'orientation-warning';
      warningDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12" y2="18.01"></line>
        </svg>
        <div>Please rotate your device to portrait mode for the best experience</div>
      `;
      document.body.appendChild(warningDiv);
      
      // Add special style for modals in the document head
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        @media (max-width: 768px) {
          body.has-modal {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          /* Enforce modal full coverage */
          .modal-active {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            background-color: rgba(0, 0, 0, 0.8) !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
          }
        }
      `;
      document.head.appendChild(styleTag);
    }
  }
  
  // Enhance bottom buttons to show content as modals
  function enhanceBottomButtons() {
    // Wait for elements to be available through leaderboard-integration.js
    const checkInterval = setInterval(() => {
      const recordBtn = document.getElementById('record-score-btn');
      const leaderboardBtn = document.getElementById('leaderboard-btn');
      const usernameArea = document.getElementById('username-area-container');
      const leaderboardTable = document.getElementById('leaderboard-table-container');
      
      if (recordBtn && leaderboardBtn && usernameArea && leaderboardTable) {
        clearInterval(checkInterval);
        
        // For small screens, modify the behavior
        if (window.innerWidth <= 768) {
          // Call the fix function to ensure modal containers cover the entire screen
          fixModalContainers();
          
          // Record button behavior
          const originalRecordClickHandler = recordBtn.onclick;
          recordBtn.onclick = function(e) {
            // First enforce full screen overlay
            fixModalContainers();
            
            // Call original handler to initialize state
            if (originalRecordClickHandler) {
              originalRecordClickHandler.call(this, e);
            }
            
            // Apply modal styles again after the original handler has run
            setTimeout(() => {
              fixModalContainers();
              
              if (usernameArea.style.display === 'block') {
                document.body.style.overflow = 'hidden';
                
                // Center the input box and adjust text sizes
                const usernameInput = document.getElementById('username-input');
                const usernamePrompt = document.querySelector('.username-prompt');
                const submitButton = document.getElementById('submit-username');
                const inputWrapper = document.querySelector('.input-wrapper');
                
                if (usernameInput) {
                  usernameInput.style.textAlign = 'center';
                  usernameInput.style.fontSize = '1.2rem';
                  usernameInput.style.width = '100%';
                  usernameInput.style.maxWidth = '100%';
                }
                
                if (usernamePrompt) {
                  usernamePrompt.style.fontSize = '1.2rem';
                  usernamePrompt.style.fontWeight = 'bold';
                  usernamePrompt.style.textAlign = 'center';
                }
                
                if (submitButton) {
                  submitButton.style.fontSize = '1.2rem';
                  submitButton.style.width = '100%';
                  submitButton.style.textAlign = 'center';
                }
                
                if (inputWrapper) {
                  inputWrapper.style.display = 'flex';
                  inputWrapper.style.flexDirection = 'column';
                  inputWrapper.style.alignItems = 'center';
                  inputWrapper.style.width = '90%';
                  inputWrapper.style.margin = '0 auto';
                }
              }
            }, 0);
          };
          
          // Leaderboard button behavior
          const originalLeaderboardClickHandler = leaderboardBtn.onclick;
          leaderboardBtn.onclick = function(e) {
            // First enforce full screen overlay
            fixModalContainers();
            
            // Call original handler to initialize state
            if (originalLeaderboardClickHandler) {
              originalLeaderboardClickHandler.call(this, e);
            }
            
            // Apply modal styles again after the original handler has run
            setTimeout(() => {
              fixModalContainers();
              
              if (leaderboardTable.style.display === 'block') {
                document.body.style.overflow = 'hidden';
                
                // Increase leaderboard text size
                const leaderboardCells = document.querySelectorAll('.leaderboard-cell');
                leaderboardCells.forEach(cell => {
                  cell.style.fontSize = '0.9rem';
                });
                
                // Ensure proper modal positioning
                leaderboardTable.style.display = 'flex';
                leaderboardTable.style.alignItems = 'center';
                leaderboardTable.style.justifyContent = 'center';
              }
            }, 0);
          };
          
          // Return buttons behavior
          const returnToRecordBtn = document.getElementById('return-to-record-btn');
          const returnFromLeaderboardBtn = document.getElementById('return-from-leaderboard-btn');
          
          if (returnToRecordBtn) {
            const originalReturnHandler = returnToRecordBtn.onclick;
            returnToRecordBtn.onclick = function(e) {
              if (originalReturnHandler) {
                originalReturnHandler.call(this, e);
              }
              document.body.style.overflow = '';
            };
          }
          
          if (returnFromLeaderboardBtn) {
            const originalReturnHandler = returnFromLeaderboardBtn.onclick;
            returnFromLeaderboardBtn.onclick = function(e) {
              if (originalReturnHandler) {
                originalReturnHandler.call(this, e);
              }
              document.body.style.overflow = '';
            };
          }
        }
      }
    }, 100);
    
    // Stop checking after 10 seconds to prevent memory leaks
    setTimeout(() => clearInterval(checkInterval), 10000);
  }
  
  // Optimize touch interactions for mobile
  function optimizeTouchInteractions() {
    // Improve grid cell responsiveness
    const gridContainer = document.getElementById('grid-container');
    if (gridContainer && 'ontouchstart' in window) {
      gridContainer.addEventListener('touchmove', function(e) {
        // Prevent scrolling while interacting with the grid
        e.preventDefault();
      }, { passive: false });
    }
  }
  
  // Improve modal sizing
  function improveModalSizing() {
    // Rules modal sizing
    const rulesContainer = document.getElementById('rules-container');
    if (rulesContainer) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            const rulesModal = rulesContainer.querySelector('.rules-modal');
            if (rulesModal && window.innerWidth <= 768) {
              // Ensure content doesn't overflow screen
              const rulesContent = rulesModal.querySelector('.rules-content');
              if (rulesContent) {
                rulesContent.style.maxHeight = '80vh';
                rulesContent.style.overflowY = 'auto';
              }
            }
          }
        });
      });
      
      observer.observe(rulesContainer, { childList: true });
    }
  }
  
  // Improve button layout for mobile
  function improveButtonLayout() {
    // Wait for game controls to be available
    const checkInterval = setInterval(() => {
      const gameControls = document.querySelector('.game-controls');
      if (gameControls) {
        clearInterval(checkInterval);
        
        if (window.innerWidth <= 768) {
          // Adjust game control buttons
          const buttons = gameControls.querySelectorAll('button');
          buttons.forEach(button => {
            // Shorten text if needed
            if (button.id === 'remove-spare') {
              // Find the SVG and keep it
              const svg = button.querySelector('svg');
              if (svg) {
                button.innerHTML = '';
                button.appendChild(svg);
                button.appendChild(document.createTextNode(' Remove'));
              }
            }
            if (button.id === 'reset-path') {
              // Find the SVG and keep it
              const svg = button.querySelector('svg');
              if (svg) {
                button.innerHTML = '';
                button.appendChild(svg);
                button.appendChild(document.createTextNode(' Reset'));
              }
            }
          });
        }
      }
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
  
  // Add mobile styles dynamically if needed
  function addMobileStylesIfNeeded() {
    // Only add the viewport meta if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const metaTag = document.createElement('meta');
      metaTag.name = 'viewport';
      metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(metaTag);
    }
  }
  
  // Enhance message display for mobile
  function enhanceMessageDisplay() {
    // Wait for game controller to initialize
    const checkInterval = setInterval(() => {
      if (window.gameController) {
        clearInterval(checkInterval);
        
        // Patch the showMessage method to improve mobile display
        const originalShowMessage = window.gameController.showMessage;
        if (originalShowMessage && window.innerWidth <= 768) {
          window.gameController.showMessage = function(text, type = 'info', duration = null) {
            // Call original method
            originalShowMessage.call(this, text, type, duration);
            
            // Additional mobile enhancements for message element
            const messageElement = document.getElementById('game-messages');
            if (messageElement) {
              // Ensure message fits and is properly centered
              messageElement.style.display = 'flex';
              messageElement.style.alignItems = 'center';
              messageElement.style.justifyContent = 'center';
              
              // Force text to wrap properly
              if (text.length > 30) {
                messageElement.style.whiteSpace = 'normal';
              }
            }
          };
        }
      }
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
})();
