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
    });
    
    // Add touch-device class for better control
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
      document.body.classList.add('touch-device');
      
      // Add iOS-specific class if needed
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        document.body.classList.add('ios-device');
      }
    }
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
          // Record button behavior
          const originalRecordClickHandler = recordBtn.onclick;
          recordBtn.onclick = function(e) {
            // Call original handler to initialize state
            if (originalRecordClickHandler) {
              originalRecordClickHandler.call(this, e);
            }
            
            if (usernameArea.style.display === 'block') {
              // Add visible class for modal styling
              usernameArea.classList.add('visible');
              document.body.style.overflow = 'hidden';
              
              // Center the input box and adjust text sizes
              const usernameInput = document.getElementById('username-input');
              const usernamePrompt = document.querySelector('.username-prompt');
              const submitButton = document.getElementById('submit-username');
              
              if (usernameInput) {
                usernameInput.style.textAlign = 'center';
                usernameInput.style.fontSize = '1.2rem';
              }
              
              if (usernamePrompt) {
                usernamePrompt.style.fontSize = '1.2rem';
                usernamePrompt.style.fontWeight = 'bold';
              }
              
              if (submitButton) {
                submitButton.style.fontSize = '1.2rem';
              }
            }
          };
          
          // Leaderboard button behavior
          const originalLeaderboardClickHandler = leaderboardBtn.onclick;
          leaderboardBtn.onclick = function(e) {
            // Call original handler to initialize state
            if (originalLeaderboardClickHandler) {
              originalLeaderboardClickHandler.call(this, e);
            }
            
            if (leaderboardTable.style.display === 'block') {
              // Add visible class for modal styling
              leaderboardTable.classList.add('visible');
              document.body.style.overflow = 'hidden';
              
              // Increase leaderboard text size
              const leaderboardCells = document.querySelectorAll('.leaderboard-cell');
              leaderboardCells.forEach(cell => {
                cell.style.fontSize = '0.9rem';
              });
            }
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
              usernameArea.classList.remove('visible');
              usernameArea.style.display = 'none';
              document.body.style.overflow = '';
            };
          }
          
          if (returnFromLeaderboardBtn) {
            const originalReturnHandler = returnFromLeaderboardBtn.onclick;
            returnFromLeaderboardBtn.onclick = function(e) {
              if (originalReturnHandler) {
                originalReturnHandler.call(this, e);
              }
              leaderboardTable.classList.remove('visible');
              leaderboardTable.style.display = 'none';
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
      const bottomButtons = document.querySelector('.bottom-buttons');
      
      if (gameControls && bottomButtons) {
        clearInterval(checkInterval);
        
        if (window.innerWidth <= 768) {
          // Adjust game control buttons
          const gameButtons = gameControls.querySelectorAll('button');
          gameButtons.forEach(button => {
            // Set font family and size
            button.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
            button.style.fontSize = "0.9rem";
            button.style.fontWeight = "bold";
            
            // Set specific sizes
            if (button.id === 'check-solution') {
              button.style.flex = "0.85";
            }
            else if (button.id === 'remove-spare') {
              button.style.flex = "1.25";
              
              // Ensure the cross SVG is present
              if (!button.innerHTML.includes('svg')) {
                button.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Remove
                `;
              }
            }
            else if (button.id === 'reset-path') {
              button.style.flex = "0.85";
            }
          });
          
          // Adjust bottom buttons
          const bottomBtns = bottomButtons.querySelectorAll('.bottom-btn');
          bottomBtns.forEach(button => {
            // Set font family and size
            button.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
            button.style.fontSize = "0.9rem";
            button.style.fontWeight = "bold";
            
            // Make buttons fixed width
            button.style.flex = "1";
            button.style.minWidth = "130px";
            button.style.maxWidth = "150px";
          });
          
          // Adjust score bar fonts
          const scoreLeft = document.querySelector('.score-left');
          const scoreRight = document.querySelector('.score-right');
          
          if (scoreLeft) {
            scoreLeft.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
            scoreLeft.style.fontWeight = "bold";
          }
          
          if (scoreRight) {
            scoreRight.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
            scoreRight.style.fontWeight = "bold";
          }
        }
      }
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
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
})();
