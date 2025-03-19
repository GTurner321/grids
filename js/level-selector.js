// level-selector.js - Scroll selector to replace level buttons

document.addEventListener('DOMContentLoaded', function() {
    // Replace the level buttons with a scroll selector
    replaceButtonsWithScroller();
    
    // Ensure the level selector responds to game state changes
    observeGameState();
});

function replaceButtonsWithScroller() {
    // Find the level buttons container
    const levelButtonsContainer = document.querySelector('.level-buttons');
    if (!levelButtonsContainer) {
        console.error('Level buttons container not found');
        return;
    }
    
    // Get all existing level buttons to preserve their data
    const levelButtons = Array.from(document.querySelectorAll('.level-btn'));
    const levels = levelButtons.map(btn => ({
        level: parseInt(btn.dataset.level),
        text: btn.textContent
    }));
    
    // Create the new scroll selector container
    const scrollSelectorContainer = document.createElement('div');
    scrollSelectorContainer.className = 'level-scroll-container';
    
    // Create the current level display
    const currentLevelDisplay = document.createElement('div');
    currentLevelDisplay.className = 'current-level-display';
    currentLevelDisplay.textContent = 'L1';
    
    // Create the scroll track
    const scrollTrack = document.createElement('div');
    scrollTrack.className = 'level-scroll-track';
    
    // Create the slider
    const slider = document.createElement('div');
    slider.className = 'level-scroll-slider';
    
    // Create the level markers
    const markers = document.createElement('div');
    markers.className = 'level-scroll-markers';
    
    // Add level markers
    for (let i = 1; i <= 10; i++) {
        const marker = document.createElement('div');
        marker.className = 'level-marker';
        marker.dataset.level = i;
        marker.textContent = i;
        markers.appendChild(marker);
    }
    
    // Add the thumb (draggable element)
    const thumb = document.createElement('div');
    thumb.className = 'level-scroll-thumb';
    slider.appendChild(thumb);
    
    // Put it all together
    scrollTrack.appendChild(slider);
    scrollTrack.appendChild(markers);
    scrollSelectorContainer.appendChild(currentLevelDisplay);
    scrollSelectorContainer.appendChild(scrollTrack);
    
    // Replace the buttons container with our new scroll selector
    levelButtonsContainer.parentNode.replaceChild(scrollSelectorContainer, levelButtonsContainer);
    
    // Add the styles
    addScrollSelectorStyles();
    
    // Set up the event listeners and dragging behavior
    setupScrollBehavior(thumb, slider, currentLevelDisplay);
}

function setupScrollBehavior(thumb, slider, levelDisplay) {
    const maxLevels = 10;
    let currentLevel = 1;
    let isDragging = false;
    let startX, startLeft;
    
    // Calculate the position for a specific level
    const getPositionForLevel = (level) => {
        const sliderWidth = slider.clientWidth;
        const thumbWidth = thumb.clientWidth;
        const availableWidth = sliderWidth - thumbWidth;
        return (level - 1) * (availableWidth / (maxLevels - 1));
    };
    
    // Get the level from a position
    const getLevelFromPosition = (position) => {
        const sliderWidth = slider.clientWidth;
        const thumbWidth = thumb.clientWidth;
        const availableWidth = sliderWidth - thumbWidth;
        const level = Math.round((position / availableWidth) * (maxLevels - 1) + 1);
        return Math.max(1, Math.min(maxLevels, level));
    };
    
    // Set the position of the thumb based on the level
    const setThumbPosition = (level) => {
        const position = getPositionForLevel(level);
        thumb.style.left = `${position}px`;
        currentLevel = level;
        levelDisplay.textContent = `L${level}`;
        
        // Highlight the corresponding marker
        document.querySelectorAll('.level-marker').forEach(marker => {
            const markerLevel = parseInt(marker.dataset.level);
            marker.classList.toggle('active', markerLevel === level);
        });
    };
    
    // Start the game with the selected level
    const startGameWithLevel = (level) => {
        // Find the game controller
        const gameController = window.gameController;
        if (gameController && typeof gameController.startLevel === 'function') {
            gameController.startLevel(level);
            console.log(`Starting level ${level}`);
        } else {
            console.error('Game controller not found or startLevel method not available');
        }
    };
    
    // Mouse & Touch events for dragging
    const onStart = (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        startLeft = parseInt(window.getComputedStyle(thumb).left) || 0;
        
        // Add dragging class for styling
        thumb.classList.add('dragging');
        
        // Add event listeners for move and end events
        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
        } else {
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        }
    };
    
    const onMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const deltaX = x - startX;
        let newLeft = startLeft + deltaX;
        
        // Constrain to slider width
        const sliderWidth = slider.clientWidth;
        const thumbWidth = thumb.clientWidth;
        newLeft = Math.max(0, Math.min(sliderWidth - thumbWidth, newLeft));
        
        // Update thumb position
        thumb.style.left = `${newLeft}px`;
        
        // Calculate the level
        const level = getLevelFromPosition(newLeft);
        levelDisplay.textContent = `L${level}`;
        
        // Highlight the corresponding marker
        document.querySelectorAll('.level-marker').forEach(marker => {
            const markerLevel = parseInt(marker.dataset.level);
            marker.classList.toggle('active', markerLevel === level);
        });
    };
    
    const onEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        // Remove dragging class
        thumb.classList.remove('dragging');
        
        // Remove event listeners
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        
        // Get the final level
        const position = parseInt(window.getComputedStyle(thumb).left) || 0;
        const level = getLevelFromPosition(position);
        
        // Snap to the closest level
        setThumbPosition(level);
        
        // Start the game with this level
        startGameWithLevel(level);
    };
    
    // Add event listeners for thumb dragging
    thumb.addEventListener('mousedown', onStart);
    thumb.addEventListener('touchstart', onStart, { passive: false });
    
    // Add click handling for markers
    document.querySelectorAll('.level-marker').forEach(marker => {
        marker.addEventListener('click', () => {
            const level = parseInt(marker.dataset.level);
            setThumbPosition(level);
            startGameWithLevel(level);
        });
    });
    
    // Click handling for the slider track
    slider.addEventListener('click', (e) => {
        // Ignore if the click was on the thumb
        if (e.target === thumb) return;
        
        const sliderRect = slider.getBoundingClientRect();
        const clickX = e.clientX - sliderRect.left;
        const thumbWidth = thumb.clientWidth;
        
        // Calculate position accounting for thumb width
        let newLeft = clickX - (thumbWidth / 2);
        const maxLeft = slider.clientWidth - thumbWidth;
        newLeft = Math.max(0, Math.min(maxLeft, newLeft));
        
        // Get the level from the position
        const level = getLevelFromPosition(newLeft);
        
        // Set the position and start the game
        setThumbPosition(level);
        startGameWithLevel(level);
    });
    
    // Initialize the thumb position
    setThumbPosition(1);
    
    // Set up window resize handling
    window.addEventListener('resize', () => {
        // Re-position the thumb based on the current level
        setThumbPosition(currentLevel);
    });
}

function addScrollSelectorStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Level Scroll Selector Styles */
        .level-scroll-container {
            width: 100%;
            max-width: 640px;
            margin: 0 auto 16px;
            padding: 0 20px;
            box-sizing: border-box;
        }
        
        .current-level-display {
            font-family: 'Black Ops One', 'Trebuchet MS', Arial, sans-serif;
            font-size: 1.8rem;
            color: #3b82f6;
            text-align: center;
            margin-bottom: 8px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .level-scroll-track {
            position: relative;
            height: 60px;
            width: 100%;
        }
        
        .level-scroll-slider {
            position: absolute;
            top: 15px;
            left: 0;
            right: 0;
            height: 10px;
            background: #e2e8f0;
            border-radius: 5px;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .level-scroll-thumb {
            position: absolute;
            top: -5px;
            left: 0;
            width: 20px;
            height: 20px;
            background-color: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: transform 0.1s, box-shadow 0.1s;
        }
        
        .level-scroll-thumb:hover,
        .level-scroll-thumb.dragging {
            transform: scale(1.1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
            background-color: #2563eb;
        }
        
        .level-scroll-markers {
            position: absolute;
            top: 30px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
        }
        
        .level-marker {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            font-weight: bold;
            color: #64748b;
            background-color: #f1f5f9;
            border: 2px solid #cbd5e1;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Trebuchet MS', Arial, sans-serif;
            transform: translateX(-12px);
        }
        
        .level-marker:hover {
            color: #3b82f6;
            border-color: #3b82f6;
            transform: translateX(-12px) scale(1.1);
        }
        
        .level-marker.active {
            color: white;
            background-color: #3b82f6;
            border-color: #2563eb;
            transform: translateX(-12px) scale(1.1);
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
            .level-scroll-container {
                padding: 0 10px;
            }
            
            .current-level-display {
                font-size: 1.6rem;
            }
            
            .level-scroll-track {
                height: 70px;
            }
            
            .level-scroll-thumb {
                width: 24px;
                height: 24px;
                top: -7px;
            }
            
            .level-marker {
                width: 20px;
                height: 20px;
                font-size: 0.75rem;
                transform: translateX(-10px);
            }
            
            .level-marker:hover,
            .level-marker.active {
                transform: translateX(-10px) scale(1.1);
            }
        }
        
        /* Touch device optimizations */
        @media (pointer: coarse) {
            .level-scroll-thumb {
                width: 28px;
                height: 28px;
                top: -9px;
            }
            
            .level-marker {
                width: 28px;
                height: 28px;
                transform: translateX(-14px);
            }
            
            .level-marker:hover,
            .level-marker.active {
                transform: translateX(-14px) scale(1.1);
            }
            
            .level-scroll-slider {
                height: 12px;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

function observeGameState() {
    // Watch for game state changes
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isGameActive = gameContainer.classList.contains('game-active');
                    
                    // Hide the level selector when game is active
                    const levelSelector = document.querySelector('.level-scroll-container');
                    if (levelSelector) {
                        levelSelector.style.opacity = isGameActive ? '0' : '1';
                        levelSelector.style.visibility = isGameActive ? 'hidden' : 'visible';
                        
                        // For better performance, remove from DOM after fade out
                        if (isGameActive) {
                            setTimeout(() => {
                                levelSelector.style.display = 'none';
                            }, 500);
                        } else {
                            levelSelector.style.display = '';
                        }
                    }
                }
            });
        });
        
        observer.observe(gameContainer, { attributes: true });
    }
}

// Default export for module systems
export default {};
