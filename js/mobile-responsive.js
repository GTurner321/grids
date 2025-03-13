// Hide leaderboard return button
          const returnFromLeaderboardBtn = document.getElementById('return-from-leaderboard-btn');
          if (returnFromLeaderboardBtn) {
            returnFromLeaderboardBtn.style.display = 'none';
          }
          
          // Center and resize username input and submit button
          const usernameInput = document.getElementById('username-input');
          if (usernameInput) {
            usernameInput.style.width = '80%';
            usernameInput.style.maxWidth = '80%';
            usernameInput.style.margin = '0 auto';
            usernameInput.style.display = 'block';
          }
          
          const submitUsername = document.getElementById('submit-username');
          if (submitUsername) {
            submitUsername.style.width = '80%';
            submitUsername.style.margin = '0 auto';
            submitUsername.style.display = 'block';
          }
          
          // Increase font size in leaderboard table
          document.querySelectorAll('.leaderboard-cell').forEach(cell => {
            cell.style.fontSize = '1.1rem';
          });
          
          document.querySelectorAll('.leaderboard-row.header .leaderboard-cell').forEach(headerCell => {
            headerCell.style.fontSize = '1.1rem';
            headerCell.style.fontWeight = 'bold';
          });
          
          // Add white text shadow to game messages
          const gameMessages = document.getElementById('game-messages');
          if (gameMessages) {
            gameMessages.style.textShadow = '0 0 5px white, 0 0 10px white, 0 0 15px white';
          }        // 7. Enhance grid elements
        setTimeout(() => {
          // Increase text size in grid cells
          document.querySelectorAll('.grid-cell').forEach(cell => {
            // Increase general font size
            cell.style.fontSize = '1.4rem';
            
            // Special handling for operators
            if (cell.classList.contains('operator')) {
              cell.style.fontSize = '1.6rem';
            }
          });
          
          // Make path arrows larger and fatter
          document.addEventListener('DOMNodeInserted', function(e) {
            if (e.target.classList && e.target.classList.contains('path-arrow')) {
              e.target.style.width = '18px';
              e.target.style.height = '18px';
              
              // Get SVG inside and make it fatter
              const svg = e.target.querySelector('svg');
              if (svg) {
                svg.style.strokeWidth = '3';
                svg.style.width = '100%';
                svg.style.height = '100%';
              }
            }
          });
          
          // Make symbol containers larger
          document.querySelectorAll('.symbol-container').forEach(container => {
            container.style.transform = 'scale(1.3)';
          });
        }, 1000); // Delay to ensure grid is rendered        // 3. Style bottom buttons - use !important to override leaderboard.css
        const bottomButtons = document.querySelector('.bottom-buttons');
        const recordBtn = document.getElementById('record-score-btn');
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        
        if (bottomButtons) {
          bottomButtons.style.cssText = "display: flex !important; flex-direction: row !important; justify-content: center !important; gap: 10px !important; width: 320px !important; margin: 10px auto !important;";
        }
        
        if (recordBtn) {
          recordBtn.style.cssText = "font-family: 'Trebuchet MS', Arial, sans-serif !important; font-size: 1rem !important; font-weight: bold !important; width: 175px !important; height: 42px !important; text-transform: none !important; padding: 8px 10px !important;";
          
          // Ensure pencil icon exists
          if (!recordBtn.querySelector('svg')) {
            // Keep existing content
            const oldContent = recordBtn.textContent.trim();
            recordBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              ${oldContent}
            `;
          }
        }
        
        if (leaderboardBtn) {
          leaderboardBtn.style.cssText = "font-family: 'Trebuchet MS', Arial, sans-serif !important; font-size: 1rem !important; font-weight: bold !important; width: 156px !important; height: 42px !important; text-transform: none !important; padding: 8px 10px !important;";
          
          // Add down triangle icon before leaderboard text
          if (!leaderboardBtn.querySelector('svg')) {
            // Keep existing content
            const oldContent = leaderboardBtn.textContent.trim();
            leaderboardBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"></path>
              </svg>
              ${oldContent}
            `;
          }
        }// mobile-responsive.js - Enhances mobile experience for the Path Puzzle game

(function() {
  // Execute when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Fix for iOS viewport height issues
    initViewportHeightFix();
    
    // Add orientation warning
    createOrientationWarning();
    
    // Apply direct button styling
    applyDirectStylesForMobile();
    
    // Improve touch handling on grid cells
    optimizeTouchInteractions();
    
    // Improve modal sizing
    improveModalSizing();
    
    // Enhance message display
    enhanceMessageDisplay();
    
    // Add custom CSS to head
    addMobileStylesIfNeeded();
    
    // Enhance path arrows
    enhancePathArrows();
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
  
  // Apply styles directly to mobile elements
  function applyDirectStylesForMobile() {
    if (window.innerWidth <= 768) {
      // Apply styles with a small delay to ensure DOM is ready
      setTimeout(() => {
        console.log("Applying direct styles for mobile");
        
        // Set background pattern
        document.body.style.backgroundColor = "#b0d8b6";
        document.body.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg width='32' height='64' viewBox='0 0 32 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 28h20V16h-4v8H4V4h28v28h-4V8H8v12h4v-8h12v20H0v-4zm12 8h20v4H16v24H0v-4h12V36zm16 12h-4v12h8v4H20V44h12v12h-4v-8zM0 36h8v20H0v-4h4V40H0v-4z' fill='%238fc096' fill-opacity='0.73' fill-rule='evenodd'/%3E%3C/svg%3E\")";
        
        // 1. Find the grid and score elements
        const gridContainer = document.getElementById('grid-container');
        const scoreRow = document.querySelector('.score-row');
        
        // Apply border styles
        if (gridContainer) {
          gridContainer.style.border = "1px solid #666";
          gridContainer.style.borderTop = "none";
          gridContainer.style.borderRadius = "0";
          gridContainer.style.width = "320px";
        }
        
        if (scoreRow) {
          scoreRow.style.border = "1px solid #666";
          scoreRow.style.borderBottom = "none";
          scoreRow.style.borderRadius = "0";
          scoreRow.style.width = "320px";
        }
        
        // 2. Style the game control buttons
        const checkButton = document.getElementById('check-solution');
        const removeButton = document.getElementById('remove-spare');
        const resetButton = document.getElementById('reset-path');
        
        if (checkButton) {
          checkButton.style.width = "25%";
          checkButton.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          checkButton.style.fontSize = "0.9rem";
          checkButton.style.fontWeight = "bold";
        }
        
        if (removeButton) {
          removeButton.style.width = "50%";
          removeButton.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          removeButton.style.fontSize = "0.9rem";
          removeButton.style.fontWeight = "bold";
          
          // Fix missing SVG icon
          if (!removeButton.querySelector('svg')) {
            removeButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Remove
            `;
          }
        }
        
        if (resetButton) {
          resetButton.style.width = "25%";
          resetButton.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          resetButton.style.fontSize = "0.9rem";
          resetButton.style.fontWeight = "bold";
        }
        
        // 3. Style bottom buttons - use !important to override leaderboard.css
        const bottomButtons = document.querySelector('.bottom-buttons');
        const recordBtn = document.getElementById('record-score-btn');
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        
        if (bottomButtons) {
          bottomButtons.style.cssText = "display: flex !important; flex-direction: row !important; justify-content: center !important; gap: 10px !important; width: 320px !important; margin: 10px auto !important;";
        }
        
        if (recordBtn) {
          recordBtn.style.cssText = "font-family: 'Trebuchet MS', Arial, sans-serif !important; font-size: 1rem !important; font-weight: bold !important; width: 130px !important; max-width: 140px !important; height: 42px !important; text-transform: none !important; padding: 8px 10px !important;";
        }
        
        if (leaderboardBtn) {
          leaderboardBtn.style.cssText = "font-family: 'Trebuchet MS', Arial, sans-serif !important; font-size: 1rem !important; font-weight: bold !important; width: 130px !important; max-width: 140px !important; height: 42px !important; text-transform: none !important; padding: 8px 10px !important;";
        }
        
        // 4. Style score elements
        const scoreLeft = document.querySelector('.score-left');
        const scoreRight = document.querySelector('.score-right');
        
        if (scoreLeft) {
          scoreLeft.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          scoreLeft.style.fontWeight = "bold";
          scoreLeft.style.width = "60%";
        }
        
        if (scoreRight) {
          scoreRight.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          scoreRight.style.fontWeight = "bold";
          scoreRight.style.width = "40%";
          scoreRight.style.textAlign = "right";
          scoreRight.style.justifyContent = "flex-end";
        }
        
        // 5. Make game messages larger
        const gameMessages = document.getElementById('game-messages');
        if (gameMessages) {
          gameMessages.style.fontSize = "1.4rem";
          gameMessages.style.width = "320px";
          gameMessages.style.minHeight = "45px";
        }
        
        // 6. Fix game controls container
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
          gameControls.style.display = "flex";
          gameControls.style.flexDirection = "row";
          gameControls.style.width = "320px";
          gameControls.style.margin = "12px auto 0";
          gameControls.style.gap = "8px";
        }
      }, 500); // 500ms delay to ensure DOM is ready
    }
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
                rulesContent.style.maxHeight = "80vh";
                rulesContent.style.overflowY = "auto";
              }
            }
          }
        });
      });
      
      observer.observe(rulesContainer, { childList: true });
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
              messageElement.style.display = "flex";
              messageElement.style.alignItems = "center";
              messageElement.style.justifyContent = "center";
              messageElement.style.fontSize = "1.4rem";
              messageElement.style.width = "320px";
              
              // Force text to wrap properly
              if (text.length > 30) {
                messageElement.style.whiteSpace = "normal";
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
  
  // Enhance path arrows for mobile
  function enhancePathArrows() {
    if (window.innerWidth <= 768) { // Only for mobile devices
      // Watch for arrows being added to the DOM
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes) {
            mutation.addedNodes.forEach(function(node) {
              if (node && node.classList && node.classList.contains('path-arrow')) {
                // Enlarge and bolden the arrow
                node.style.width = '18px';
                node.style.height = '18px';
                
                // Make the SVG stroke wider
                const svg = node.querySelector('svg');
                if (svg) {
                  svg.setAttribute('stroke-width', '3');
                  svg.style.width = '100%';
                  svg.style.height = '100%';
                  svg.style.fill = '#3b82f6';
                }
              }
            });
          }
        });
      });
      
      // Start observing the document
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Also enhance any arrows that might already be in the DOM
      document.querySelectorAll('.path-arrow').forEach(function(arrow) {
        arrow.style.width = '18px';
        arrow.style.height = '18px';
        
        const svg = arrow.querySelector('svg');
        if (svg) {
          svg.setAttribute('stroke-width', '3');
          svg.style.width = '100%';
          svg.style.height = '100%';
          svg.style.fill = '#3b82f6';
        }
      });
    }
  }
})();
