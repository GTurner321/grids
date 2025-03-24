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
    
    // Explicitly move return button to bottom right
    const returnToRecordBtn = document.getElementById('return-to-record-btn');
    if (returnToRecordBtn) {
      returnToRecordBtn.style.position = 'absolute';
      returnToRecordBtn.style.bottom = '10px';
      returnToRecordBtn.style.right = '10px';
      returnToRecordBtn.style.top = '';
      returnToRecordBtn.style.left = '';
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
              messageElement.style.fontSize = "1.6rem";
              
              // Make container wider by reducing margins
              messageElement.style.width = `calc(100vw - 20px)`;
              
              // More intense white shadow
              messageElement.style.textShadow = "0 0 15px white, 0 0 25px white, 0 0 35px white, 0 0 40px white, 0 0 45px white";
              
              // Reduced margin to bottom buttons
              messageElement.style.marginBottom = "2px";
              
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
    
    // Add CSS for button pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes buttonPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .game-controls button.clicked {
        animation: buttonPulse 0.3s ease-in-out;
      }
      
      /* Remove gray line under level buttons */
      .level-selector-container, 
      .level-buttons,
      .game-header,
      .game-container > *:not(.game-board) {
        border-bottom: none !important;
        box-shadow: none !important;
        border-color: transparent !important;
      }
      
      /* Add for hiding record button after submission */
      .bottom-buttons.single-button {
        justify-content: center !important;
      }
      
      .bottom-buttons.single-button #leaderboard-btn {
        margin: 0 auto !important;
        min-width: 200px !important;
      }
    `;
    document.head.appendChild(style);
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
                  svg.style.fill = '#dd717e'; // Match crimson color from buttons
                  svg.style.stroke = 'white'; // White outline for better visibility
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
          svg.style.fill = '#dd717e'; // Match crimson color from buttons
          svg.style.stroke = 'white'; // White outline for better visibility
        }
      });
    }
  } mobile-responsive.js - Complete rewrite with button fixes and orientation warning improvements

(function() {
  // Execute when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Fix for iOS viewport height issues
    initViewportHeightFix();
    
    // Add orientation warning - FIXED to actually show up
    createOrientationWarning();
    
    // Apply direct button styling
    applyDirectStylesForMobile();
    
    // Apply enhanced styles for requested improvements
    applyEnhancedMobileStyles();
    
    // Add button animation fix (Pulse instead of color change)
    enhanceButtonAnimations();
    
    // Improve touch handling on grid cells
    optimizeTouchInteractions();
    
    // Improve modal sizing
    improveModalSizing();
    
    // Enhance message display
    enhanceMessageDisplay();
    
    // Add mobile styles if needed
    addMobileStylesIfNeeded();
    
    // Enhance path arrows
    enhancePathArrows();
    
    // Set up FIXED button behaviors for "Remove Spares"
    fixRemoveButtonDisappearing();
    
    // Fix button color issues - CRITICAL FIX
    fixButtonColorIssue();
    
    // Patch game controller methods
    patchGameControllerMethods();
    
    // Handle username submission behavior
    setupUsernameSubmissionHandling();
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
      
      // Check orientation on resize (may be caused by orientation change)
      checkOrientation();
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
  
  // Create and manage warning for landscape orientation
  function createOrientationWarning() {
    // Only create for mobile devices
    if (window.innerWidth <= 768) {
      // First check if it already exists
      let warningDiv = document.querySelector('.orientation-warning');
      
      if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.className = 'orientation-warning';
        warningDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12" y2="18.01"></line>
          </svg>
          <div>Please rotate your device to portrait mode for the best experience</div>
        `;
        document.body.appendChild(warningDiv);
        
        // Apply initial styles to ensure visibility
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '0';
        warningDiv.style.left = '0';
        warningDiv.style.width = '100%';
        warningDiv.style.height = '100%';
        warningDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        warningDiv.style.zIndex = '2000';
        warningDiv.style.color = 'white';
        warningDiv.style.textAlign = 'center';
        warningDiv.style.fontSize = '1.2rem';
        warningDiv.style.padding = '20px';
        warningDiv.style.boxSizing = 'border-box';
        warningDiv.style.display = 'none'; // Hidden by default
        warningDiv.style.justifyContent = 'center';
        warningDiv.style.alignItems = 'center';
        warningDiv.style.flexDirection = 'column';
      }
      
      // Add CSS for the warning's rotate animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(90deg); }
          50% { transform: rotate(90deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        
        .orientation-warning svg {
          width: 60px;
          height: 60px;
          margin-bottom: 20px;
          animation: rotate 2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
      
      // Initial check
      checkOrientation();
      
      // Listen for orientation changes
      window.addEventListener('orientationchange', checkOrientation);
    }
  }
  
  // Check device orientation and show/hide warning
  function checkOrientation() {
    const warning = document.querySelector('.orientation-warning');
    if (!warning) return;
    
    // Check if in landscape mode AND width is <= 768px (mobile device)
    const isLandscape = window.innerWidth > window.innerHeight && window.innerWidth <= 768;
    
    if (isLandscape) {
      warning.style.display = 'flex';
    } else {
      warning.style.display = 'none';
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
          
          // Make container wider by reducing margins
          gridContainer.style.width = `calc(100vw - 20px)`;
        }
        
        if (scoreRow) {
          // Lighter brighter blue border
          scoreRow.style.border = "2px solid #60a5fa";
          scoreRow.style.borderBottom = "none";
          scoreRow.style.borderRadius = "0";
          
          // Make container wider by reducing margins
          scoreRow.style.width = `calc(100vw - 20px)`;
        }
        
        // 2. Style the game control buttons
        const checkButton = document.getElementById('check-solution');
        const removeButton = document.getElementById('remove-spare');
        const resetButton = document.getElementById('reset-path');
        
        if (checkButton) {
          checkButton.style.width = "30%"; // Changed from 25% to 30%
          checkButton.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          checkButton.style.fontSize = "1rem"; // Increased font size for mobile
          checkButton.style.fontWeight = "bold";
        }
        
        if (removeButton) {
          removeButton.style.width = "40%"; // Changed from 50% to 40%
          removeButton.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          removeButton.style.fontSize = "1rem"; // Increased font size for mobile
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
          resetButton.style.width = "30%"; // Changed from 25% to 30%
          resetButton.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          resetButton.style.fontSize = "1rem"; // Increased font size for mobile
          resetButton.style.fontWeight = "bold";
        }
        
        // 3. Style bottom buttons - use !important to override leaderboard.css
        const bottomButtons = document.querySelector('.bottom-buttons');
        const recordBtn = document.getElementById('record-score-btn');
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        
        if (bottomButtons) {
          // Reduced margin to buttons
          bottomButtons.style.cssText = "display: flex !important; flex-direction: row !important; justify-content: center !important; gap: 10px !important; width: calc(100vw - 20px) !important; margin: 2px auto !important;";
        }
        
        if (recordBtn) {
          // Reduced button width by 10% with spacing between icon and text
          recordBtn.style.cssText = "font-family: 'Trebuchet MS', Arial, sans-serif !important; font-size: 1rem !important; font-weight: bold !important; width: calc((100vw - 20px) * 0.45 - 5px) !important; max-width: 140px !important; height: 42px !important; text-transform: none !important; padding: 8px 10px !important;";
          const svg = recordBtn.querySelector('svg');
          if (svg) {
            svg.style.marginRight = '6px';
          }
        }
        
        if (leaderboardBtn) {
          // Reduced button width by 10% with spacing between icon and text
          leaderboardBtn.style.cssText = "font-family: 'Trebuchet MS', Arial, sans-serif !important; font-size: 1rem !important; font-weight: bold !important; width: calc((100vw - 20px) * 0.45 - 5px) !important; max-width: 140px !important; height: 42px !important; text-transform: none !important; padding: 8px 10px !important;";
          const svg = leaderboardBtn.querySelector('svg');
          if (svg) {
            svg.style.marginRight = '6px';
          }
        }
        
        // 4. Style score elements
        const scoreLeft = document.querySelector('.score-left');
        const scoreRight = document.querySelector('.score-right');
        
        if (scoreLeft) {
          scoreLeft.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          scoreLeft.style.fontWeight = "bold";
          scoreLeft.style.width = "60%";
          scoreLeft.style.color = "#ef4444"; // Red color for round score
          scoreLeft.style.display = "flex";
          scoreLeft.style.alignItems = "center";
        }
        
        if (scoreRight) {
          scoreRight.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          scoreRight.style.fontWeight = "bold";
          scoreRight.style.width = "40%";
          scoreRight.style.textAlign = "right";
          scoreRight.style.justifyContent = "flex-end";
          scoreRight.style.color = "#1e40af"; // Dark blue color
          scoreRight.style.display = "flex";
          scoreRight.style.alignItems = "center";
        }

        // Special handling for username in score area
        const scoreBonusElement = document.getElementById('score-bonus');
        if (scoreBonusElement) {
          // If roundComplete is false and text doesn't contain "+", it's showing username
          if (!scoreBonusElement.textContent.includes('+')) {
            scoreBonusElement.style.color = "#1e40af"; // Dark blue for username
          } else {
            scoreBonusElement.style.color = "#ef4444"; // Red for round score
          }
        }
        
        // 5. Make game messages larger with more intense shadow
        const gameMessages = document.getElementById('game-messages');
        if (gameMessages) {
          gameMessages.style.fontSize = "1.6rem";
          gameMessages.style.width = `calc(100vw - 20px)`;
          gameMessages.style.minHeight = "45px";
          gameMessages.style.textShadow = "0 0 15px white, 0 0 25px white, 0 0 35px white, 0 0 40px white, 0 0 45px white";
          // Reduced margin to bottom buttons
          gameMessages.style.marginBottom = "2px";
        }
        
        // 6. Fix game controls container
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
          gameControls.style.display = "flex";
          gameControls.style.flexDirection = "row";
          gameControls.style.width = `calc(100vw - 20px)`;
          gameControls.style.margin = "12px auto 0";
          gameControls.style.gap = "8px";
        }

        // Move return button to bottom right
        const returnToRecordBtn = document.getElementById('return-to-record-btn');
        if (returnToRecordBtn) {
          returnToRecordBtn.style.position = 'absolute';
          returnToRecordBtn.style.bottom = '10px'; // 10px from bottom
          returnToRecordBtn.style.right = '10px'; // 10px from right
          returnToRecordBtn.style.top = ''; // Remove top positioning completely
          returnToRecordBtn.style.left = ''; // Remove any left positioning
        }

        // Make level buttons 10% less tall with vertically centered text
        document.querySelectorAll('.level-btn').forEach(btn => {
          btn.style.padding = '0 12px'; // Vertical padding removed to use height
          btn.style.height = '40px'; // 10% less tall
          btn.style.lineHeight = '36px'; // Center text vertically (accounting for borders)
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
        });

        // Remove any gray line under level buttons
        const levelSelectorContainer = document.querySelector('.level-selector-container');
        if (levelSelectorContainer) {
          levelSelectorContainer.style.borderBottom = 'none';
          levelSelectorContainer.style.boxShadow = 'none';
        }

        const levelButtons = document.querySelector('.level-buttons');
        if (levelButtons) {
          levelButtons.style.borderBottom = 'none';
          levelButtons.style.boxShadow = 'none';
        }

        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
          gameHeader.style.borderBottom = 'none';
          gameHeader.style.boxShadow = 'none';
        }
      }, 500); // 500ms delay to ensure DOM is ready
    }
  }
  
  // Apply enhanced mobile styles for requested improvements
  function applyEnhancedMobileStyles() {
    // Only apply these styles on mobile devices
    if (window.innerWidth > 768) return;
    
    console.log('Applying enhanced mobile styles for visual improvements');
    
    setTimeout(() => {
      // Enhanced game messages with wider white shadow
      const gameMessages = document.getElementById('game-messages');
      if (gameMessages) {
        gameMessages.style.fontSize = '1.6rem';
        gameMessages.style.textShadow = '0 0 15px white, 0 0 25px white, 0 0 35px white, 0 0 40px white, 0 0 45px white';
        gameMessages.style.fontWeight = 'bold';
        // Reduced margin to bottom buttons
        gameMessages.style.marginBottom = '2px';
      }
      
      // Add white shadow to title
      const gameTitle = document.querySelector('.game-header h1');
      if (gameTitle) {
        gameTitle.style.textShadow = '0 0 8px white, 0 0 15px white, 0 0 20px white';
      }
      
      // Remove gray line under level buttons
      const levelSelectorContainer = document.querySelector('.level-selector-container');
      if (levelSelectorContainer) {
        levelSelectorContainer.style.borderBottom = 'none';
        levelSelectorContainer.style.boxShadow = 'none';
        levelSelectorContainer.style.marginBottom = '12px';
      }
      
      const levelButtons = document.querySelector('.level-buttons');
      if (levelButtons) {
        levelButtons.style.borderBottom = 'none';
        levelButtons.style.boxShadow = 'none';
      }
      
      const gameHeader = document.querySelector('.game-header');
      if (gameHeader) {
        gameHeader.style.borderBottom = 'none';
        gameHeader.style.boxShadow = 'none';
      }
      
      // Adjust button widths
      const checkButton = document.getElementById('check-solution');
      if (checkButton) {
        checkButton.style.width = '30%'; // Changed from 20% to 30%
      }
      
      // Reduced button widths by 10% with spacing between icon and text
      const recordButton = document.getElementById('record-score-btn');
      if (recordButton) {
        recordButton.style.width = 'calc((100vw - 20px) * 0.45 - 5px)';
        recordButton.style.border = '2px solid #60a5fa'; // Lighter brighter blue
        recordButton.style.borderBottomWidth = '3px';
        
        const svg = recordButton.querySelector('svg');
        if (svg) {
          svg.style.marginRight = '6px';
        }
      }
      
      const leaderboardButton = document.getElementById('leaderboard-btn');
      if (leaderboardButton) {
        leaderboardButton.style.width = 'calc((100vw - 20px) * 0.45 - 5px)';
        leaderboardButton.style.border = '2px solid #60a5fa'; // Lighter brighter blue
        leaderboardButton.style.borderBottomWidth = '3px';
        
        const svg = leaderboardButton.querySelector('svg');
        if (svg) {
          svg.style.marginRight = '6px';
        }
      }
      
      // Enhanced score bar border - lighter brighter blue
      const scoreRow = document.querySelector('.score-row');
      if (scoreRow) {
        scoreRow.style.border = '2px solid #60a5fa'; // Lighter brighter blue
        scoreRow.style.borderBottom = 'none';
        scoreRow.style.height = "60px";
      }
      
      const gridContainer = document.getElementById('grid-container');
      if (gridContainer) {
        gridContainer.style.border = '3px solid #166534'; // Matching green border
        gridContainer.style.borderTop = 'none';
      }
      
      // Make level buttons 10% less tall with vertically centered text
      document.querySelectorAll('.level-btn').forEach(btn => {
        btn.style.padding = '0 12px'; // Remove vertical padding
        btn.style.height = '40px'; // 10% less tall
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.border = '2px solid #60a5fa'; // Lighter brighter blue
        btn.style.borderBottomWidth = '3px';
      });
      
      // Make game control buttons crimson but don't change color on click
      document.querySelectorAll('.game-controls button').forEach(btn => {
        btn.style.backgroundColor = '#dd717e'; // Crimson red background
        btn.style.color = 'white';
        btn.style.border = '2px solid #9c3c47'; // Dark red border
        btn.style.borderBottomWidth = '3px';
        
        // Make SVG icons white
        const svg = btn.querySelector('svg');
        if (svg) {
          svg.style.stroke = 'white';
        }
      });
      
      // Add active state listeners for 3D button press effect
      const allButtons = document.querySelectorAll('.game-controls button, .level-btn, #record-score-btn, #leaderboard-btn');
      allButtons.forEach(btn => {
        btn.addEventListener('touchstart', function() {
          this.style.transform = 'translateY(2px)';
          this.style.borderBottomWidth = '1px';
        });
        
        btn.addEventListener('touchend', function() {
          this.style.transform = '';
          this.style.borderBottomWidth = '3px';
        });
      });
      
      // Make username area wider and move return button to bottom right
      const usernameArea = document.querySelector('.username-area');
      if (usernameArea) {
        usernameArea.style.width = '92%';
      }
      
      const returnToRecordBtn = document.getElementById('return-to-record-btn');
      if (returnToRecordBtn) {
        returnToRecordBtn.style.position = 'absolute';
        returnToRecordBtn.style.bottom = '10px';
        returnToRecordBtn.style.right = '10px';
        returnToRecordBtn.style.top = '';
        returnToRecordBtn.style.left = '';
      }
      
      // Username and round score colors
      const scoreBonusElement = document.getElementById('score-bonus');
      if (scoreBonusElement) {
        // Set a MutationObserver to watch for content changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
              // If text contains a "+", it's displaying round score
              if (scoreBonusElement.textContent.includes('+')) {
                scoreBonusElement.style.color = '#ef4444'; // Red for round score
              } else {
                scoreBonusElement.style.color = '#1e40af'; // Dark blue for username
              }
            }
          });
        });
        
        observer.observe(scoreBonusElement, { 
          characterData: true, 
          childList: true,
          subtree: true 
        });
        
        // Initial check
        if (scoreBonusElement.textContent.includes('+')) {
          scoreBonusElement.style.color = '#ef4444'; // Red for round score
        } else {
          scoreBonusElement.style.color = '#1e40af'; // Dark blue for username
        }
      }
      
      // Enhance path arrows
      document.querySelectorAll('.path-arrow svg').forEach(svg => {
        svg.style.fill = '#dd717e'; // Match crimson from buttons
        svg.style.stroke = 'white'; // White outline
      });
      
      console.log('Enhanced mobile styles applied successfully');
    }, 800); // Delay slightly longer than the basic styles to ensure we override them
  }
  
  // FIXED: Better button animation without color change
function enhanceButtonAnimations() {
  // Add click event to all game control buttons
  const gameControlButtons = document.querySelectorAll('.game-controls button');
  
  gameControlButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Don't do anything if this is the remove button and it's already used
      if (this.id === 'remove-spare' && this.classList.contains('used')) {
        return;
      }
      
      // Remove existing animation classes
      this.classList.remove('clicked');
      
      // Force a reflow to ensure animation restarts
      void this.offsetWidth;
      
      // Add animation class
      this.classList.add('clicked');
      
      // Remove class after animation completes
      setTimeout(() => {
        this.classList.remove('clicked');
      }, 300);
    });
  });
}
  
  // FIXED: Better implementation for Remove button disappearing
function fixRemoveButtonDisappearing() {
  // Add styles to hide the button and adjust layout
  const buttonStyles = document.createElement('style');
  buttonStyles.textContent = `
    /* Hide Remove Spares button when "used" class is applied */
    #remove-spare.used {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      position: absolute;
      z-index: -1;
      transition: opacity 1s ease, visibility 1s ease;
    }
    
    /* Adjust layout when Remove Spares is hidden */
    .game-controls.two-buttons #check-solution,
    .game-controls.two-buttons #reset-path {
      width: 45% !important;
      transition: width 1s ease;
    }
    
    @media (max-width: 768px) {
      .game-controls.two-buttons #check-solution,
      .game-controls.two-buttons #reset-path {
        width: 49% !important;
      }
    }
  `;
  document.head.appendChild(buttonStyles);
  
  // Direct DOM manipulation approach
  const removeButton = document.getElementById('remove-spare');
  if (removeButton) {
    // Use both click & touchend events to ensure it works
    ['click', 'touchend'].forEach(eventName => {
      removeButton.addEventListener(eventName, function(e) {
        // Set timeout to allow the original event to complete
        setTimeout(() => {
          // Apply used class to button
          this.classList.add('used');
          
          // Add two-buttons class to container for layout adjustment
          const gameControls = document.querySelector('.game-controls');
          if (gameControls) {
            gameControls.classList.add('two-buttons');
          }
          
          console.log('Remove Spares button hidden');
        }, 100);
      }, { capture: true }); // Use capture phase to ensure this runs first
    });
  }
  
  // Watch for level changes to reset the 'used' class
  function checkForLevelChanges() {
    // First add a listener to all level buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => {
          // When a level button is clicked, reset the remove button
          const removeButton = document.getElementById('remove-spare');
          if (removeButton) {
            console.log('Level changed, resetting Remove Spares button');
            removeButton.classList.remove('used');
            removeButton.style.opacity = '';
            removeButton.style.visibility = '';
            removeButton.style.position = '';
            removeButton.style.zIndex = '';
            
            // Reset the game controls layout
            const gameControls = document.querySelector('.game-controls');
            if (gameControls) {
              gameControls.classList.remove('two-buttons');
            }
          }
        }, 300); // Small delay to ensure level change happens first
      });
    });
    
    // Also observe game-active class changes on game container
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'class' && 
              gameContainer.classList.contains('game-active')) {
            // Game became active, reset the button
            const removeButton = document.getElementById('remove-spare');
            if (removeButton) {
              console.log('Game became active, resetting Remove Spares button');
              removeButton.classList.remove('used');
              
              // Reset the game controls layout
              const gameControls = document.querySelector('.game-controls');
              if (gameControls) {
                gameControls.classList.remove('two-buttons');
              }
            }
          }
        });
      });
      
      observer.observe(gameContainer, { attributes: true });
    }
  }
  
  // Try to set up the observers, retry if level buttons aren't ready
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(checkForLevelChanges, 500);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(checkForLevelChanges, 500);
    });
  }
}
  // Add CSS styles to fix button color issues
function addButtonStyles() {
  const buttonStyles = document.createElement('style');
  buttonStyles.textContent = `
    /* Ensure buttons stay in their original color */
    .game-controls button {
      background-color: #dd717e !important; /* Set original crimson color */
      color: white !important;
    }
    
    /* Button animation - PULSE INSTEAD OF COLOR CHANGE */
    @keyframes buttonPulse {
      0% { transform: scale(1); background-color: #dd717e; }
      50% { transform: scale(1.05); background-color: #c13a49; }
      100% { transform: scale(1); background-color: #dd717e; }
    }
    
    .game-controls button.clicked {
      animation: buttonPulse 0.3s ease-in-out !important;
      background-color: #dd717e !important;
    }
    
    /* Override any active/focus/selected state */
    .game-controls button:active, 
    .game-controls button:focus,
    .game-controls button.active,
    .game-controls button.selected {
      background-color: #dd717e !important; /* Maintain crimson color */
      color: white !important;
    }
  `;
  document.head.appendChild(buttonStyles);
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
