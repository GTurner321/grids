// grid-zoom.js - Add zoom functionality for the grid on small screens
// This standalone file adds a zoom control for the grid that expands by 30% with navigation controls

(function() {
    // Configuration
    const ZOOM_FACTOR = 1.3; // 30% zoom increase
    const SCROLL_AMOUNT = 50; // How many pixels to scroll per click
    const SHOW_ON_DESKTOP = false; // Whether to show on desktop (wider than 768px)

    // Initialize when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', init);

    // State
    let isZoomed = false;
    let zoomButton = null;
    let scrollButtons = {
        up: null,
        right: null,
        down: null,
        left: null
    };
    let scrollContainer = null;

    // Main initialization function
    function init() {
        console.log('Initializing grid zoom functionality...');
        
        // Check if we're on mobile
        if (!SHOW_ON_DESKTOP && window.innerWidth > 768) {
            console.log('Not showing zoom on desktop');
            return;
        }
        
        // Wait for grid to be ready
        waitForGrid();
    }

    // Wait for grid to be fully loaded before adding zoom controls
    function waitForGrid() {
        const gridContainer = document.getElementById('grid-container');
        
        if (!gridContainer) {
            console.log('Grid container not ready, waiting...');
            setTimeout(waitForGrid, 500);
            return;
        }
        
        // Also check for cells to be present
        const cells = gridContainer.querySelectorAll('.grid-cell');
        if (cells.length === 0) {
            console.log('Grid cells not ready, waiting...');
            setTimeout(waitForGrid, 500);
            return;
        }
        
        console.log('Grid is ready, adding zoom controls');
        
        // Add the zoom button and related controls
        addZoomControls();
        
        // Listen for game start events to ensure zoom controls are visible
        window.addEventListener('gameStart', ensureZoomButtonVisible);
        
        // Also listen for window resize to handle orientation changes
        window.addEventListener('resize', handleWindowResize);
    }

    // Add zoom button and navigation controls
    function addZoomControls() {
        // Create the zoom button
        createZoomButton();
        
        // Create the scroll container (will be used when zoomed)
        createScrollContainer();
        
        // Create the scroll buttons (hidden initially)
        createScrollButtons();
        
        // Add the CSS styles
        addZoomStyles();
    }

    // Create zoom button in the top right corner
    function createZoomButton() {
        // Check if button already exists
        if (document.getElementById('grid-zoom-button')) {
            zoomButton = document.getElementById('grid-zoom-button');
            return;
        }
        
        zoomButton = document.createElement('button');
        zoomButton.id = 'grid-zoom-button';
        zoomButton.className = 'grid-zoom-button';
        zoomButton.title = 'Zoom grid';
        zoomButton.setAttribute('aria-label', 'Zoom grid');
        
        // Add zoom icon SVG
        zoomButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
        `;
        
        // Add click handler
        zoomButton.addEventListener('click', toggleZoom);
        
        // Add to the DOM - near the grid container
        const gridContainer = document.getElementById('grid-container');
        const gameBoard = document.querySelector('.game-board');
        
        if (gridContainer && gridContainer.parentNode) {
            gridContainer.parentNode.appendChild(zoomButton);
        } else if (gameBoard) {
            gameBoard.appendChild(zoomButton);
        } else {
            document.body.appendChild(zoomButton);
        }
    }

    // Create the scroll container that wraps the grid when zoomed
    function createScrollContainer() {
        // Check if container already exists
        if (document.getElementById('grid-scroll-container')) {
            scrollContainer = document.getElementById('grid-scroll-container');
            return;
        }
        
        scrollContainer = document.createElement('div');
        scrollContainer.id = 'grid-scroll-container';
        scrollContainer.className = 'grid-scroll-container';
        
        // Hide initially
        scrollContainer.style.display = 'none';
        
        const gridContainer = document.getElementById('grid-container');
        if (gridContainer && gridContainer.parentNode) {
            // Insert the scroll container before the grid container
            gridContainer.parentNode.insertBefore(scrollContainer, gridContainer);
            
            // Move the grid container inside the scroll container
            scrollContainer.appendChild(gridContainer);
        }
    }

    // Create the scroll buttons for navigation when zoomed
    function createScrollButtons() {
        const buttonData = [
            { id: 'up', icon: 'M18 15l-6-6-6 6', position: 'top' },
            { id: 'right', icon: 'M9 18l6-6-6-6', position: 'right' },
            { id: 'down', icon: 'M6 9l6 6 6-6', position: 'bottom' },
            { id: 'left', icon: 'M15 18l-6-6 6-6', position: 'left' }
        ];
        
        buttonData.forEach(data => {
            // Check if button already exists
            if (document.getElementById(`grid-scroll-${data.id}`)) {
                scrollButtons[data.id] = document.getElementById(`grid-scroll-${data.id}`);
                return;
            }
            
            const button = document.createElement('button');
            button.id = `grid-scroll-${data.id}`;
            button.className = `grid-scroll-button grid-scroll-${data.id}`;
            button.title = `Scroll ${data.id}`;
            button.setAttribute('aria-label', `Scroll ${data.id}`);
            
            // Add arrow icon SVG
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="${data.icon}"></polyline>
                </svg>
            `;
            
            // Add click handler for scrolling
            button.addEventListener('click', () => scrollGrid(data.id));
            
            // Hide initially
            button.style.display = 'none';
            
            // Store reference
            scrollButtons[data.id] = button;
            
            // Add to the DOM
            document.body.appendChild(button);
        });
    }

    // Toggle zoom state
    function toggleZoom() {
        isZoomed = !isZoomed;
        
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;
        
        if (isZoomed) {
            // Apply zoom
            applyZoom();
            
            // Update button to show "cancel zoom" icon
            zoomButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
            `;
            zoomButton.title = 'Cancel zoom';
            zoomButton.setAttribute('aria-label', 'Cancel zoom');
            
            // Show navigation buttons
            updateScrollButtonsVisibility();
        } else {
            // Remove zoom
            removeZoom();
            
            // Restore zoom button icon
            zoomButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
            `;
            zoomButton.title = 'Zoom grid';
            zoomButton.setAttribute('aria-label', 'Zoom grid');
            
            // Hide navigation buttons
            Object.values(scrollButtons).forEach(button => {
                button.style.display = 'none';
            });
        }
    }

    // Apply zoom to the grid
    function applyZoom() {
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;
        
        // Make the scroll container visible
        scrollContainer.style.display = 'block';
        
        // Apply transform scale to the grid container
        gridContainer.style.transform = `scale(${ZOOM_FACTOR})`;
        gridContainer.style.transformOrigin = 'center center';
        
        // Adjust the scroll container size to fit the zoomed grid
        // First determine grid actual size
        let gridWidth = gridContainer.offsetWidth;
        let gridHeight = gridContainer.offsetHeight;
        
        // Make container size match original grid size (creates scrollable area)
        scrollContainer.style.width = `${gridWidth}px`;
        scrollContainer.style.height = `${gridHeight}px`;
        scrollContainer.style.overflow = 'hidden';
        scrollContainer.style.position = 'relative';
        
        // Center the grid initially
        scrollContainer.scrollLeft = (gridWidth * ZOOM_FACTOR - gridWidth) / 2;
        scrollContainer.scrollTop = (gridHeight * ZOOM_FACTOR - gridHeight) / 2;
        
        // Add zoomed class to body for styling
        document.body.classList.add('grid-zoomed');
        
        // Schedule a check of scroll limits
        setTimeout(updateScrollButtonsVisibility, 100);
    }

    // Remove zoom from grid
    function removeZoom() {
        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;
        
        // Reset transform
        gridContainer.style.transform = 'scale(1)';
        
        // Hide scroll container (but keep the grid visible)
        setTimeout(() => {
            if (!isZoomed) { // Double-check we're still not zoomed
                scrollContainer.style.display = 'none';
                gridContainer.style.display = 'grid'; // Ensure grid stays visible
            }
        }, 300); // Short delay to allow transition to complete
        
        // Remove zoomed class from body
        document.body.classList.remove('grid-zoomed');
    }

    // Scroll the grid when navigation buttons are clicked
    function scrollGrid(direction) {
        if (!scrollContainer) return;
        
        switch (direction) {
            case 'up':
                scrollContainer.scrollTop -= SCROLL_AMOUNT;
                break;
            case 'right':
                scrollContainer.scrollLeft += SCROLL_AMOUNT;
                break;
            case 'down':
                scrollContainer.scrollTop += SCROLL_AMOUNT;
                break;
            case 'left':
                scrollContainer.scrollLeft -= SCROLL_AMOUNT;
                break;
        }
        
        // Update which scroll buttons should be visible
        updateScrollButtonsVisibility();
    }

    // Update which scroll buttons should be visible based on scroll position
    function updateScrollButtonsVisibility() {
        if (!isZoomed || !scrollContainer) {
            // Hide all if not zoomed
            Object.values(scrollButtons).forEach(button => {
                button.style.display = 'none';
            });
            return;
        }
        
        // Calculate scroll limits
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollTop = scrollContainer.scrollTop;
        const scrollWidth = scrollContainer.scrollWidth;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientWidth = scrollContainer.clientWidth;
        const clientHeight = scrollContainer.clientHeight;
        
        // Show/hide buttons based on scroll position
        scrollButtons.up.style.display = scrollTop > 5 ? 'flex' : 'none';
        scrollButtons.right.style.display = scrollLeft < (scrollWidth - clientWidth - 5) ? 'flex' : 'none';
        scrollButtons.down.style.display = scrollTop < (scrollHeight - clientHeight - 5) ? 'flex' : 'none';
        scrollButtons.left.style.display = scrollLeft > 5 ? 'flex' : 'none';
    }

    // Ensure zoom button is visible when game starts
    function ensureZoomButtonVisible() {
        if (zoomButton) {
            console.log('Ensuring zoom button is visible after game start');
            
            // Ensure button is shown
            zoomButton.style.display = 'flex';
            zoomButton.style.opacity = '1';
            
            // If we were previously zoomed, re-apply the zoom
            if (isZoomed) {
                setTimeout(() => {
                    applyZoom();
                    updateScrollButtonsVisibility();
                }, 500); // Short delay to ensure grid is fully loaded
            }
        }
    }

    // Handle window resize and orientation changes
    function handleWindowResize() {
        // If we're zoomed, update the zoom and scroll buttons
        if (isZoomed) {
            setTimeout(() => {
                applyZoom();
                updateScrollButtonsVisibility();
            }, 300); // Short delay to ensure resize is complete
        }
        
        // Hide zoom button on desktop if configured that way
        if (!SHOW_ON_DESKTOP && window.innerWidth > 768) {
            if (zoomButton) zoomButton.style.display = 'none';
            
            // If zoomed, reset zoom on desktop
            if (isZoomed) {
                isZoomed = false;
                removeZoom();
            }
        } else {
            // Show zoom button on mobile
            if (zoomButton) zoomButton.style.display = 'flex';
        }
    }

    // Add the CSS styles
    function addZoomStyles() {
        // Check if styles already exist
        if (document.getElementById('grid-zoom-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'grid-zoom-styles';
        style.textContent = `
            /* Zoom button styles */
            .grid-zoom-button {
                display: flex;
                position: absolute;
                top: 10px;
                right: 10px;
                width: 36px;
                height: 36px;
                background-color: #ffffff;
                border: 2px solid #60a5fa;
                border-radius: 50%;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                z-index: 100;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            }
            
            .grid-zoom-button:hover {
                background-color: #f0f9ff;
            }
            
            .grid-zoom-button svg {
                width: 20px;
                height: 20px;
                color: #1e40af;
            }
            
            /* Scroll container styles */
            .grid-scroll-container {
                margin: 0 auto;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            /* Scroll buttons styles */
            .grid-scroll-button {
                display: flex;
                position: fixed;
                justify-content: center;
                align-items: center;
                width: 36px;
                height: 36px;
                background-color: #ffffff;
                border: 2px solid #60a5fa;
                border-radius: 50%;
                cursor: pointer;
                z-index: 100;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                opacity: 0.8;
                transition: opacity 0.3s ease;
            }
            
            .grid-scroll-button:hover {
                opacity: 1;
            }
            
            .grid-scroll-button svg {
                width: 20px;
                height: 20px;
                color: #1e40af;
            }
            
            /* Position the scroll buttons */
            .grid-scroll-up {
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .grid-scroll-right {
                top: 50%;
                right: 10px;
                transform: translateY(-50%);
            }
            
            .grid-scroll-down {
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .grid-scroll-left {
                top: 50%;
                left: 10px;
                transform: translateY(-50%);
            }
            
            /* Zoom transition */
            #grid-container {
                transition: transform 0.3s ease;
            }
            
            /* Mobile specific adjustments */
            @media (max-width: 768px) {
                .grid-zoom-button {
                    top: 5px;
                    right: 5px;
                    width: 32px;
                    height: 32px;
                }
                
                .grid-zoom-button svg {
                    width: 18px;
                    height: 18px;
                }
                
                .grid-scroll-button {
                    width: 32px;
                    height: 32px;
                }
                
                .grid-scroll-button svg {
                    width: 18px;
                    height: 18px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Public API
    window.gridZoom = {
        toggle: toggleZoom,
        zoomIn: function() {
            if (!isZoomed) toggleZoom();
        },
        zoomOut: function() {
            if (isZoomed) toggleZoom();
        },
        refresh: function() {
            if (isZoomed) {
                applyZoom();
                updateScrollButtonsVisibility();
            }
        }
    };
})();
