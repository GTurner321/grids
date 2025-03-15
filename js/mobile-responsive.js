// mobile-responsive.js - Enhanced version with improvements for button animation, container width and shadow effects

(function() {
  // Execute when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Fix for iOS viewport height issues
    initViewportHeightFix();
    
    // Add orientation warning
    createOrientationWarning();
    
    // Apply direct button styling
    applyDirectStylesForMobile();
    
    // Apply enhanced styles for requested improvements
    applyEnhancedMobileStyles();
    
    // Add button animation fix (POINT 4)
    enhanceButtonAnimations();
    
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
          
          // POINT 5: Make container wider by reducing margins
          gridContainer.style.width = `calc(100vw - 20px)`;
        }
        
        if (scoreRow) {
          scoreRow.style.border = "1px solid #666";
          scoreRow.style.borderBottom = "none";
          scoreRow.style.borderRadius = "0";
          
          // POINT 5: Make container wider by reducing margins
          scoreRow.style.width = `calc(100vw - 20px)`;
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
          // POINT 5: Make container wider by reducing margins
          bottomButtons.style.cssText = "display: flex !important; flex-direction: row !important; justify-content: center !important; gap: 10px !important; width: calc(100vw - 20px) !important; margin: 5px auto !important;"; // POINT 3: Reduced margin from 10px to 5px
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
          scoreLeft.style.color = "#ef4444"; // POINT 2: Color the round score red
          scoreLeft.style.display = "flex";
          scoreLeft.style.alignItems = "center"; // POINT 2: Center vertically
        }
        
        if (scoreRight) {
          scoreRight.style.fontFamily = "'Trebuchet MS', Arial, sans-serif";
          scoreRight.style.fontWeight = "bold";
          scoreRight.style.width = "40%";
          scoreRight.style.textAlign = "right";
          scoreRight.style.justifyContent = "flex-end";
          scoreRight.style.color = "#1e40af"; // POINT 2: Color the total score dark blue
          scoreRight.style.display = "flex";
          scoreRight.style.alignItems = "center"; // POINT 2: Center vertically
        }
        
        // 5. Make game messages larger with more intense shadow (POINT 6)
        const gameMessages = document.getElementById('game-messages');
        if (gameMessages) {
          gameMessages.style.fontSize = "1.6rem";
          gameMessages.style.width = `calc(100vw - 20px)`; // POINT 5: Make container wider
          gameMessages.style.minHeight = "45px";
          gameMessages.style.textShadow = "0 0 15px white, 0 0 25px white, 0 0 35px white, 0 0 40px white, 0 0 45px white"; // POINT 6: More intense shadow
          gameMessages.style.marginBottom = "8px"; // POINT 3: Reduced margin to bottom buttons
        }
        
        // 6. Fix game controls container
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
          gameControls.style.display = "flex";
          gameControls.style.flexDirection = "row";
          gameControls.style.width = `calc(100vw - 20px)`; // POINT 5: Make container wider
          gameControls.style.margin = "12px auto 0";
          gameControls.style.gap = "8px";
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
      // 1. Enhanced game messages with wider white shadow (POINT 6)
      const gameMessages = document.getElementById('game-messages');
      if (gameMessages) {
        gameMessages.style.fontSize = '1.6rem';
        gameMessages.style.textShadow = '0 0 15px white, 0 0 25px white, 0 0 35px white, 0 0 40px white, 0 0 45px white';
        gameMessages.style.fontWeight = 'bold';
      }
      
      // 2. Add white shadow to title
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
      
      // 3-4. Adjust button widths
      const checkButton = document.getElementById('check-solution');
      if (checkButton) {
        checkButton.style.width = '20%'; // 10% less wide than original 25%
      }
      
      const recordButton = document.getElementById('record-score-btn');
      if (recordButton) {
        recordButton.style.width = '190px'; // 15% wider than original
        recordButton.style.border = '2px solid #166534';
        recordButton.style.borderBottomWidth = '3px';
      }
      
      const leaderboardButton = document.getElementById('leaderboard-btn');
      if (leaderboardButton) {
        leaderboardButton.style.width = '170px'; // 15% wider than original
        leaderboardButton.style.border = '2px solid #166534';
        leaderboardButton.style.borderBottomWidth = '3px';
      }
      
      // 5. Enhanced grid and score borders
      const scoreRow = document.querySelector('.score-row');
      if (scoreRow) {
        scoreRow.style.border = '3px solid #166534'; // Thicker green border
        scoreRow.style.borderBottom = 'none';
        scoreRow.style.height = "60px"; // POINT 2: Make score bar higher
      }
      
      const gridContainer = document.getElementById('grid-container');
      if (gridContainer) {
        gridContainer.style.border = '3px solid #166534'; // Matching green border
        gridContainer.style.borderTop = 'none';
      }
      
      // 6. Add green borders to level buttons
      document.querySelectorAll('.level-btn').forEach(btn => {
        btn.style.border = '2px solid #166534';
        btn.style.borderBottomWidth = '3px';
      });
      
      // 7. Make game control buttons crimson with white text
      document.querySelectorAll('.game-controls button').forEach(btn => {
        btn.style.backgroundColor = '#dc2626'; // Crimson red background
        btn.style.color = 'white';
        btn.style.border = '2px solid #166534'; // Green border
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
      
      // POINT 1: Adjust leaderboard table width and spacing
      const leaderboardTable = document.querySelector('.leaderboard-table');
      if (leaderboardTable) {
        leaderboardTable.style.width = '100%';
        leaderboardTable.style.maxWidth = '385px'; // 10% wider than original 350px
      }
      
      // POINT 1: Adjust leaderboard row column gap and add date column padding
      document.querySelectorAll('.leaderboard-row').forEach(row => {
        row.style.columnGap = '8px'; // Reduced from original gap
      });
      
      document.querySelectorAll('.leaderboard-cell.date').forEach(cell => {
        cell.style.paddingRight = '10px'; // Added padding to date column
      });
      
      // Enhance path arrows (additional tweaks to arrow colors to match new theme)
      document.querySelectorAll('.path-arrow svg').forEach(svg => {
        svg.style.fill = '#dc2626'; // Match crimson from buttons
        svg.style.stroke = 'white'; // White outline
      });
      
      console.log('Enhanced mobile styles applied successfully');
    }, 800); // Delay slightly longer than the basic styles to ensure we override them
  }
  
  // POINT 4: Fix for button animation
  function enhanceButtonAnimations() {
    // Improve game control buttons to pulse instead of staying colored
    const gameControlButtons = document.querySelectorAll('.game-controls button');
    
    gameControlButtons.forEach(button => {
      // Remove any existing click listeners to prevent duplicates
      button.removeEventListener('click', handleButtonClick);
      
      // Add our enhanced click handler
      button.addEventListener('click', handleButtonClick);
    });
    
    function handleButtonClick(e) {
      const button = e.currentTarget;
      
      // Remove any existing animation classes
      button.classList.remove('clicked');
      
      // Force a reflow to ensure animation restarts
      void button.offsetWidth;
      
      // Add animation class
      button.classList.add('clicked');
      
      // Remove class after animation completes (300ms matching the CSS animation)
      setTimeout(() => {
        button.classList.remove('clicked');
        
        // Also clear any inline background color style to avoid staying colored
        button.style.backgroundColor = '';
        button.classList.remove('active', 'selected');
      }, 300);
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
              messageElement.style.fontSize = "1.6rem"; // Increased from 1.4rem
              
              // POINT 5: Make container wider by reducing margins
              messageElement.style.width = `calc(100vw - 20px)`;
              
              // POINT 6: More intense white shadow
              messageElement.style.textShadow = "0 0 15px white, 0 0 25px white, 0 0 35px white, 0 0 40px white, 0 0 45px white";
              
              // POINT 3: Reduced margin to bottom buttons
              messageElement.style.marginBottom = "8px";
              
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
    
    // Add CSS for button pulse animation (POINT 4)
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
                  svg.style.fill = '#dc2626'; // Match crimson color from buttons
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
          svg.style.fill = '#dc2626'; // Match crimson color from buttons
          svg.style.stroke = 'white'; // White outline for better visibility
        }
      });
    }
  }
})();
