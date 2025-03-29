// leveltracker.js - Enhanced with 3D segment styling and improved level tracking

class LevelTracker {
constructor() {
    // Store which levels have been completed in THIS session
    this.completedLevels = new Set();
    
    // Track unlocked levels (ensure level 1 is always unlocked)
    this.unlockedLevels = new Set([1]);
    
    // Track current active level
    this.currentLevel = 1;
    
    // Flag to track if all levels have been completed before
    this.hasCompletedAllLevels = false;
    
    // Level just completed (for celebration animation)
    this.justCompletedLevel = null;
    
    // Initialize the score bar segments
    this.findScoreBar();
    
    // Listen for score updates and other game events
    this.setupEventListeners();
    
    // Make available globally
    window.levelTracker = this;
    
    console.log('Level tracker initialized');
}
  
findScoreBar() {
    console.log('Looking for score bar...');
    
    // Look for score bar elements
    const scoreRow = document.querySelector('.score-row');
    
    if (scoreRow) {
        console.log('Score bar found, initializing segments');
        this.initializeScoreBar(scoreRow);
        this.syncWithLevelScroller(); // Add this line here
        
        // Dispatch levelTrackerReady event
        setTimeout(() => {
            // existing code...
        }, 200);
        } else {
            console.log('Score bar not found, will try again in 500ms');
            // Try again after a delay
            setTimeout(() => this.findScoreBar(), 500);
        }
    }
    
initializeScoreBar(scoreRow) {
    // Make sure we don't add segments twice
    let segmentContainer = scoreRow.querySelector('.level-segment-container');
    if (!segmentContainer) {
        console.log('Creating segment container');
        // Create container for level segments
        segmentContainer = document.createElement('div');
        segmentContainer.className = 'level-segment-container';
        
        // Insert at beginning of score row to be behind text
        scoreRow.insertBefore(segmentContainer, scoreRow.firstChild);
    } else {
        console.log('Score bar segments container already exists');
    }
    
    // Clear any existing segments
    segmentContainer.innerHTML = '';
    
    // Create 10 level segments with enhanced 3D styling
    for (let i = 1; i <= 10; i++) {
        const segment = document.createElement('div');
        // IMPORTANT: Always add the base class
        segment.className = 'level-segment';
        
        // Always apply proper styling class
        if (this.completedLevels.has(i)) {
            segment.classList.add('completed');
            segment.setAttribute('title', `Level ${i} completed`);
        } else if (i === 1 || this.unlockedLevels.has(i)) { 
            // IMPORTANT: Ensure level 1 is always unlocked
            segment.classList.add('unlocked');
            segment.setAttribute('title', `Level ${i} unlocked`);
        } else {
            // Locked segments don't need an additional class
            segment.setAttribute('title', `Level ${i} locked`);
        }
        
        // Add current level indicator if applicable
        if (i === this.currentLevel && !this.completedLevels.has(i)) {
            segment.classList.add('current');
        }
        
        // Add the celebrate class if it's the just completed level
        if (i === this.justCompletedLevel) {
            segment.classList.add('celebrate');
        }
        
        // Store level number as data attribute
        segment.dataset.level = i;
        
        // Append to container
        segmentContainer.appendChild(segment);
    }
    
    // Make sure text is on top
    const leftText = scoreRow.querySelector('.score-left');
    const rightText = scoreRow.querySelector('.score-right');
    
    if (leftText) leftText.style.zIndex = '2';
    if (rightText) rightText.style.zIndex = '2';
}

// Similarly, update the updateScoreBarSegments method:
updateScoreBarSegments() {
    console.log('Updating score bar segments');
    
    // Get the container for level segments
    const segmentContainer = document.querySelector('.level-segment-container');
    if (!segmentContainer) {
        console.warn('Level segment container not found, will try to initialize');
        this.findScoreBar();
        return;
    }
    
    // Update each segment based on current status
    for (let i = 1; i <= 10; i++) {
        const segment = segmentContainer.querySelector(`[data-level="${i}"]`);
        if (!segment) continue;
        
        // Reset classes but KEEP the base class
        segment.className = 'level-segment';
        
        // Apply proper styling class for each segment's state
        if (this.completedLevels.has(i)) {
            segment.classList.add('completed');
            segment.setAttribute('title', `Level ${i} completed`);
        } else if (i === 1 || this.unlockedLevels.has(i)) {
            // IMPORTANT: Ensure level 1 is always unlocked
            segment.classList.add('unlocked');
            segment.setAttribute('title', `Level ${i} unlocked`);
        } else {
            // Locked segments don't need an additional class
            segment.setAttribute('title', `Level ${i} locked`);
        }
        
        // Add current level indicator if applicable
        if (i === this.currentLevel && !this.completedLevels.has(i)) {
            segment.classList.add('current');
        }
        
        // Add celebration animation for just completed level
        if (i === this.justCompletedLevel) {
            segment.classList.add('celebrate');
        }
    }
}

// Add this method to leveltracker.js
syncWithLevelScroller() {
    // Only proceed if levelScroller exists
    if (!window.levelScroller) return;
    
    // Clear any direct styling on segments that might conflict with our CSS classes
    const segments = document.querySelectorAll('.level-segment');
    segments.forEach(segment => {
        // Remove any inline background color styling
        segment.style.removeProperty('background-color');
    });
    
    // Update our unlockedLevels based on the game's progression rules
    this.unlockedLevels.clear();
    
    // Level 1 is always unlocked
    this.unlockedLevels.add(1);
    
    // Apply the same logic as levelscroller.js
    for (let level = 2; level <= 10; level++) {
        // Levels 1-3 are always unlocked
        if (level <= 3) {
            this.unlockedLevels.add(level);
        }
        // Levels 4-6 are unlocked if any level from 1-3 is completed
        else if (level <= 6 && [1, 2, 3].some(lvl => this.completedLevels.has(lvl))) {
            this.unlockedLevels.add(level);
        }
        // Levels 7-10 are unlocked if any level from 4-6 is completed
        else if (level <= 10 && [4, 5, 6].some(lvl => this.completedLevels.has(lvl))) {
            this.unlockedLevels.add(level);
        }
    }
    
    // Update the segments
    this.updateScoreBarSegments();
}
    
setupEventListeners() {
    // Listen for score updates
    window.addEventListener('scoreUpdated', (event) => {
        if (event.detail && event.detail.roundComplete) {
            const level = event.detail.level;
            
            if (level >= 1 && level <= 10) {
                this.markLevelCompleted(level);
                
                // Check if all levels are complete
                if (this.completedLevels.size === 10 && !this.hasCompletedAllLevels) {
                    this.handleAllLevelsComplete();
                    this.hasCompletedAllLevels = true;
                }
            }
        }
    });
    
    // Listen for level changes
    window.addEventListener('levelChanged', (event) => {
        if (event.detail && event.detail.level) {
            this.setCurrentLevel(event.detail.level);
        }
    });
    
    // Listen for level unlocks
    window.addEventListener('levelUnlocked', (event) => {
        if (event.detail && event.detail.level) {
            this.unlockLevel(event.detail.level);
        }
    });
    
    // Observer to detect when score row is added to the DOM
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if the score row was added
                const scoreRow = document.querySelector('.score-row');
                if (scoreRow && !scoreRow.querySelector('.level-segment-container')) {
                    this.initializeScoreBar(scoreRow);
                }
            }
        });
    });
    
    // Start observing the document body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Listen for game controller ready event
    document.addEventListener('gameControllerReady', () => {
        // Check if we need to update the level unlocker
        this.updateLevelUnlocker();
        // Sync with level scroller to ensure segments match game rules
        this.syncWithLevelScroller();
    });
}
    
markLevelCompleted(level) {
    console.log(`Marking level ${level} as completed`);
    
    // Add to our set of completed levels for THIS session
    this.completedLevels.add(level);
    
    // Track this level as the just completed one for animation
    this.justCompletedLevel = level;
    
    // Unlock the next level if not already unlocked
    if (level < 10) {
        this.unlockLevel(level + 1);
    }
    
    // Update visual segments
    this.updateScoreBarSegments();
    this.syncWithLevelScroller(); // Add this line here
    
    // After 5 seconds, clear the celebration animation
    setTimeout(() => {
        // existing code...
    }, 5000);
        
        // Ensure level scroller updates to reflect newly unlocked levels
        if (window.levelScroller) {
            window.levelScroller.updateVisibleLevel();
        }
        
        // Dispatch levelCompleted event
        document.dispatchEvent(new CustomEvent('levelCompleted', {
            detail: {
                level: level,
                completedLevels: Array.from(this.completedLevels),
                unlockedLevels: Array.from(this.unlockedLevels)
            }
        }));
    }
    
unlockLevel(level) {
    if (level >= 1 && level <= 10 && !this.unlockedLevels.has(level)) {
        console.log(`Unlocking level ${level}`);
        
        // Unlock the specified level
        this.unlockedLevels.add(level);
        
        // Important: Also unlock any previous levels that might not be unlocked yet
        for (let i = 1; i < level; i++) {
            this.unlockedLevels.add(i);
        }
        
        this.updateScoreBarSegments();
        
        // Dispatch levelUnlocked event
        document.dispatchEvent(new CustomEvent('levelsUnlocked', {
            detail: {
                unlockedLevels: Array.from(this.unlockedLevels)
            }
        }));
    }
}
    
    setCurrentLevel(level) {
        if (level >= 1 && level <= 10) {
            console.log(`Setting current level to ${level}`);
            this.currentLevel = level;
            this.updateScoreBarSegments();
        }
    }
    
    handleAllLevelsComplete() {
        console.log('All levels complete!');
        
        // Show a congratulatory message
        setTimeout(() => {
            if (window.gameController) {
                window.gameController.showMessage('Congratulations! You have completed all levels!', 'success', 8000);
            }
        }, 3000);
    }
    
    updateLevelUnlocker() {
        // Check if level scroller exists
        if (window.levelScroller) {
            console.log('Updating level unlock status based on completed levels');
            // Directly update the level scroller UI
            window.levelScroller.updateVisibleLevel();
        } else {
            console.log('Level scroller not available yet');
            // Try again in a short while
            setTimeout(() => this.updateLevelUnlocker(), 200);
        }
    }
    
    resetProgress() {
        // Clear stored progress
        this.completedLevels.clear();
        this.unlockedLevels = new Set([1]); // Keep level 1 unlocked
        this.hasCompletedAllLevels = false;
        this.justCompletedLevel = null;
        
        // Reset visual indicators
        this.updateScoreBarSegments();
        
        console.log('Progress reset');
    }
    
    // Helper method to check if a level is unlocked
    isLevelUnlocked(level) {
        return this.unlockedLevels.has(level);
    }
    
    // Helper method to check if a level is completed
    isLevelCompleted(level) {
        return this.completedLevels.has(level);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.levelTracker = new LevelTracker();
});

// Make it available globally
window.LevelTracker = LevelTracker;

export default LevelTracker;
