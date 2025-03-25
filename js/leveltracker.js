// leveltracker.js - Tracks completed levels in the score bar only

class LevelTracker {
    constructor() {
        // Store which levels have been completed
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
            
            // Load saved progress only AFTER initializing the score bar
            setTimeout(() => this.loadProgress(), 100);
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
                        this.saveProgress();
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
                        setTimeout(() => this.loadProgress(), 100);
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
        
        // Add to our set of completed levels
        this.completedLevels.add(level);
        
        // Update visual segment
        const segment = document.querySelector(`.level-segment[data-level="${level}"]`);
        if (segment) {
            segment.classList.add('completed');
        } else {
            console.warn(`Segment for level ${level} not found`);
        }
        
        // Save progress
        this.saveProgress();
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
    
    saveProgress() {
        try {
            const completedArray = Array.from(this.completedLevels);
            const progressData = {
                completedLevels: completedArray,
                hasCompletedAllLevels: this.hasCompletedAllLevels
            };
            
            localStorage.setItem('mathPathCompletedLevels', JSON.stringify(progressData));
            console.log('Progress saved:', progressData);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    loadProgress() {
        try {
            console.log('Loading saved progress...');
            const savedData = localStorage.getItem('mathPathCompletedLevels');
            
            if (!savedData) {
                console.log('No saved progress found');
                return;
            }
            
            const progressData = JSON.parse(savedData);
            
            // On page refresh, we load completion data but DO NOT apply visual indicators
            // This ensures the score bar always starts blue
            console.log('Loading completed levels data (visual indicators will remain blue on refresh)');
            
            // Handle both the new format and the old format
            if (progressData && typeof progressData === 'object' && progressData.completedLevels) {
                // New format
                progressData.completedLevels.forEach(level => {
                    this.completedLevels.add(level);
                    // Note: We intentionally don't update visual indicators on page load
                });
                
            this.hasCompletedAllLevels = !!progressData.hasCompletedAllLevels;
            } else if (Array.isArray(progressData)) {
                // Old format (just an array of levels)
                progressData.forEach(level => {
                    this.completedLevels.add(level);
                    // Note: We intentionally don't update visual indicators on page load
                });
                
                this.hasCompletedAllLevels = this.completedLevels.size === 10;
            }
            
            // Dispatch an event to notify that level tracker is ready
            document.dispatchEvent(new CustomEvent('levelTrackerReady', {
                detail: {
                    completedLevels: Array.from(this.completedLevels)
                }
            }));
            
            console.log('Level tracker ready event dispatched');
            
            // Call updateLevelUnlocker
            this.updateLevelUnlocker();
            
        } catch (error) {
            console.error('Error loading progress:', error);
        }
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
        this.hasCompletedAllLevels = false;
        localStorage.removeItem('mathPathCompletedLevels');
        
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
