// leveltracker.js - Enhanced with 3D segment styling and improved level tracking

class LevelTracker {
    constructor() {
        // Store which levels have been completed in THIS session
        this.completedLevels = new Set();
        
        // Track unlocked levels (start with level 1 always unlocked)
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
            
            // Dispatch levelTrackerReady event
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('levelTrackerReady', {
                    detail: {
                        completedLevels: Array.from(this.completedLevels),
                        unlockedLevels: Array.from(this.unlockedLevels),
                        currentLevel: this.currentLevel
                    }
                }));
                console.log('Level tracker ready event dispatched');
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
    
    // Get max unlocked level to determine which segments should be unlocked
    const maxUnlockedLevel = Math.max(...Array.from(this.unlockedLevels));
    
    // Create 10 level segments with enhanced 3D styling
    for (let i = 1; i <= 10; i++) {
        const segment = document.createElement('div');
        segment.className = 'level-segment';
        
        // Always apply proper styling class - THIS IS THE KEY CHANGE
        // All segments up to max unlocked level get 'unlocked' class
        if (this.completedLevels.has(i)) {
            segment.classList.add('completed');
            segment.setAttribute('title', `Level ${i} completed`);
        } else if (i <= maxUnlockedLevel) {
            segment.classList.add('unlocked');
            segment.setAttribute('title', `Level ${i} unlocked`);
        } else {
            // Locked segments get no additional class
            segment.setAttribute('title', `Level ${i} locked`);
        }
        
        // Add current level indicator if applicable
        if (i === this.currentLevel && !this.completedLevels.has(i)) {
            segment.classList.add('current');
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
    
updateScoreBarSegments() {
    console.log('Updating score bar segments');
    
    // Get the container for level segments
    const segmentContainer = document.querySelector('.level-segment-container');
    if (!segmentContainer) {
        console.warn('Level segment container not found, will try to initialize');
        this.findScoreBar();
        return;
    }
    
    // Get max unlocked level to determine which segments should be unlocked
    const maxUnlockedLevel = Math.max(...Array.from(this.unlockedLevels));
    
    // Update each segment based on current status
    for (let i = 1; i <= 10; i++) {
        const segment = segmentContainer.querySelector(`[data-level="${i}"]`);
        if (!segment) continue;
        
        // Reset classes
        segment.className = 'level-segment';
        
        // Apply proper styling class for each segment's state
        if (this.completedLevels.has(i)) {
            segment.classList.add('completed');
            segment.setAttribute('title', `Level ${i} completed`);
        } else if (i <= maxUnlockedLevel) {
            segment.classList.add('unlocked');
            segment.setAttribute('title', `Level ${i} unlocked`);
        } else {
            // Locked segments get no additional class
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
        
        // After 5 seconds, clear the celebration animation
        setTimeout(() => {
            this.justCompletedLevel = null;
            this.updateScoreBarSegments();
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
            this.unlockedLevels.add(level);
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
