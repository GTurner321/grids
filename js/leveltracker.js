// leveltracker.js - Updated to reset visual green progress on page load

class LevelTracker {
    constructor() {
        // Store which levels have been completed in THIS session
        this.completedLevels = new Set();
        
        // Flag to track if all levels have been completed before
        this.hasCompletedAllLevels = false;
        
        // Find and initialize the score bar
        this.findScoreBar();
        
        // Listen for score updates
        this.setupEventListeners();
        
        // Make available globally
        window.levelTracker = this;
        
        console.log('Level tracker initialized');
    }
    
    findScoreBar() {
        console.log('Looking for score bar...');
        
        // Look for exact score bar elements
        const scoreRow = document.querySelector('.score-row');
        
        if (scoreRow) {
            console.log('Score bar found, initializing segments');
            this.initializeScoreBar(scoreRow);
            
            // Start with NO completed level segments (clear any green backgrounds)
            // But still have blue backgrounds for unlockable levels
            
            // Dispatch levelTrackerReady event with empty completedLevels
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('levelTrackerReady', {
                    detail: {
                        completedLevels: []
                    }
                }));
                console.log('Level tracker ready event dispatched with empty completed levels');
            }, 200);
        } else {
            console.log('Score bar not found, will try again in 500ms');
            // Try again after a delay
            setTimeout(() => this.findScoreBar(), 500);
        }
    }
    
    initializeScoreBar(scoreRow) {
        // Make sure we don't add segments twice
        if (scoreRow.querySelector('.level-segment-container')) {
            console.log('Score bar segments already exist');
            return;
        }
        
        console.log('Adding level segments to score bar');
        
        // Create container for level segments
        const segmentContainer = document.createElement('div');
        segmentContainer.className = 'level-segment-container';
        
        // Create 10 level segments
        for (let i = 1; i <= 10; i++) {
            const segment = document.createElement('div');
            segment.className = 'level-segment';
            segment.dataset.level = i;
            segmentContainer.appendChild(segment);
        }
        
        // Insert at beginning of score row to be behind text
        scoreRow.insertBefore(segmentContainer, scoreRow.firstChild);
        
        // Make sure text is on top
        const leftText = scoreRow.querySelector('.score-left');
        const rightText = scoreRow.querySelector('.score-right');
        
        if (leftText) leftText.style.zIndex = '2';
        if (rightText) rightText.style.zIndex = '2';
    }
    
    setupEventListeners() {
        // Listen for score updates
        window.addEventListener('scoreUpdated', (event) => {
            if (event.detail && event.detail.roundComplete) {
                const level = event.detail.level;
                
                if (level >= 1 && level <= 10) {
                    this.markLevelCompleted(level);
                    
                    // Check if this is the first level completion
                    if (this.completedLevels.size === 1) {
                        setTimeout(() => {
                            if (window.gameController) {
                                window.gameController.showMessage('Complete all the levels to turn the score bar green!', 'info', 5000);
                            }
                        }, 2000);
                    }
                    
                    // Check if all levels are complete
                    if (this.completedLevels.size === 10 && !this.hasCompletedAllLevels) {
                        this.handleAllLevelsComplete();
                        this.hasCompletedAllLevels = true;
                    }
                }
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
                        
                        // Dispatch levelTrackerReady event with empty completedLevels
                        setTimeout(() => {
                            document.dispatchEvent(new CustomEvent('levelTrackerReady', {
                                detail: {
                                    completedLevels: []
                                }
                            }));
                            console.log('Level tracker ready event dispatched (from observer)');
                        }, 200);
                    }
                }
            });
        });
        
        // Start observing the document body
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    markLevelCompleted(level) {
        console.log(`Marking level ${level} as completed`);
        
        // Add to our set of completed levels for THIS session
        this.completedLevels.add(level);
        
        // Update visual segment - turn it green
        const segment = document.querySelector(`.level-segment[data-level="${level}"]`);
        if (segment) {
            segment.classList.add('completed');
            segment.style.backgroundColor = '#22c55e'; // Green color to ensure it overrides any blue
        } else {
            console.warn(`Segment for level ${level} not found`);
        }
        
        // Ensure level scroller updates to reflect newly unlocked levels
        if (window.levelScroller) {
            window.levelScroller.updateVisibleLevel();
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
    
    // We no longer need saveProgress and loadProgress methods
    // since we want to start fresh on page reload
    
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
        this.hasCompletedAllLevels = false;
        
        // Reset visual indicators
        document.querySelectorAll('.level-segment').forEach(segment => {
            segment.classList.remove('completed');
        });
        
        console.log('Progress reset');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.levelTracker = new LevelTracker();
});

export default LevelTracker;
