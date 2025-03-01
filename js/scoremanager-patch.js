// scoremanager-patch.js
// This file extends the original scoreManager with events for the leaderboard

(function() {
    // Wait for the original scoreManager to be available
    const checkForScoreManager = setInterval(() => {
        if (window.scoreManager) {
            clearInterval(checkForScoreManager);
            patchScoreManager();
        }
    }, 100);
    
    function patchScoreManager() {
        // Store the original updateDisplay function
        const originalUpdateDisplay = window.scoreManager.updateDisplay;
        
        // Override the updateDisplay function to dispatch events
        window.scoreManager.updateDisplay = function() {
            // Call the original function first
            originalUpdateDisplay.call(this);
            
            // Dispatch score updated event
            const scoreUpdatedEvent = new CustomEvent('scoreUpdated', {
                detail: {
                    score: this.totalScore,
                    level: this.currentLevel,
                    roundScore: this.roundScore,
                    roundComplete: this.roundComplete
                }
            });
            
            window.dispatchEvent(scoreUpdatedEvent);
        };
        
        // Patch completePuzzle to ensure leaderboard is updated
        const originalCompletePuzzle = window.scoreManager.completePuzzle;
        
        window.scoreManager.completePuzzle = function() {
            // Call the original function first
            originalCompletePuzzle.call(this);
            
            // Ensure score is updated in leaderboard if username is set
            if (window.leaderboardManager && window.leaderboardManager.isUsernameSet) {
                window.leaderboardManager.updateScore(this.totalScore);
            }
        };
        
        console.log('ScoreManager patched successfully for leaderboard integration');
    }
})();
