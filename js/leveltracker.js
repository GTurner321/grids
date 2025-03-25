// leveltracker.js - Modified to prevent loading saved levels for unlocking but maintain score bar functionality

class LevelTracker {
    constructor() {
        // Store which levels have been completed in THIS session
        this.completedLevels = new Set();
        
        // Store which levels have been visually marked as completed
        this.visuallyCompletedLevels = new Set();
        
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
            
            // Load saved visual progress for score bar, but NOT for level unlocking
            setTimeout(() => this.loadVisualProgress(), 100);
            
            // Dispatch levelTrackerReady event with empty completedLevels
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('levelTrackerReady', {
                    detail: {
                        completedLevels: [] // Empty array for level unlocking
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
                    if (this.visuallyCompletedLevels.size === 10 && !this.hasCompletedAllLevels) {
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
                        
                        // Load saved visual progress for score bar
                        setTimeout(() => this.loadVisualProgress(), 100);
                        
                        // Dispatch levelTrackerReady event with empty completedLevels
                        setTimeout(() => {
                            document.dispatchEvent(new CustomEvent('levelTrackerReady', {
                                detail: {
                                    completedLevels: [] // Empty array for level unlocking
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
        
        // Add to visually completed levels
        this.visuallyCompletedLevels.add(level);
        
        // Update visual segment
        const segment = document.querySelector(`.level-segment[data-level="${level}"]`);
        if (segment) {
            segment.classList.add('completed');
        } else {
            console.warn(`Segment for level ${level} not found`);
        }
        
        // Save progress (only for visual indication)
        this.saveProgress();
        
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
    
    saveProgress() {
        try {
            const completedArray = Array.from(this.visuallyCompletedLevels);
            const progressData = {
                completedLevels: completedArray,
                hasCompletedAllLevels: this.hasCompletedAllLevels
            };
            
            localStorage.setItem('mathPathCompletedLevels', JSON.stringify(progressData));
            console.log('Visual progress saved:', progressData);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    // Load visual progress ONLY for score bar background
    loadVisualProgress() {
        try {
            console.log('Loading saved visual progress for score bar...');
            const savedData = localStorage.getItem('mathPathCompletedLevels');
            
            if (!savedData) {
                console.log('No saved progress found');
                return;
            }
            
            const progressData = JSON.parse(savedData);
            
            console.log('Loading visual indicators for score bar');
            
            // Handle both the new format and the old format
            if (progressData && typeof progressData === 'object' && progressData.completedLevels) {
                // New format
                progressData.completedLevels.forEach(level => {
                    // Only update visually completed levels, NOT the session completed levels
                    this.visuallyCompletedLevels.add(level);
                    
                    // Update UI
                    const segment = document.querySelector(`.level-segment[data-level="${level}"]`);
                    if (segment) {
                        segment.classList.add('completed');
                    }
                });
                
                this.hasCompletedAllLevels = !!progressData.hasCompletedAllLevels;
            } else if (Array.isArray(progressData)) {
                // Old format (just an array of levels)
                progressData.forEach(level => {
                    // Only update visually completed levels, NOT the session completed levels
                    this.visuallyCompletedLevels.add(level);
                    
                    // Update UI
                    const segment = document.querySelector(`.level-segment[data-level="${level}"]`);
                    if (segment) {
                        segment.classList.add('completed');
                    }
                });
                
                this.hasCompletedAllLevels = this.visuallyCompletedLevels.size === 10;
            }
            
            console.log('Visual progress loaded successfully');
            
        } catch (error) {
            console.error('Error loading visual progress:', error);
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
        this.visuallyCompletedLevels.clear();
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
