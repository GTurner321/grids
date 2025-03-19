// Combined scoremanager.js with patch functionality
class ScoreManager {
    constructor() {
        // Persistent total score
        this.totalScore = 0;
        
        // Current round state
        this.currentLevel = null;
        this.maxPoints = 0;
        this.checkCount = 0;
        this.removedSpares = false;
        this.startTime = null;
        this.roundComplete = false;
        this.roundScore = 0;
        
        // Initialize display
        this.updateDisplay();
        
        // Make it available globally
        window.scoreManager = this;
    }

startLevel(level) {
    this.currentLevel = level;
    // Updated level point values
    const levelPoints = {
        1: 500,
        2: 1000,
        3: 1500,
        4: 2000,
        5: 2500,
        6: 3000,
        7: 3500,
        8: 4000,
        9: 4500,
        10: 5000
    };
    this.maxPoints = levelPoints[level] || 2000;
        this.checkCount = 0;
        this.removedSpares = false;
        this.startTime = new Date();
        this.roundComplete = false;
        this.roundScore = 0;
        
        this.updateDisplay();
    }
    
    calculateTimeBonus() {
        if (!this.startTime) return 0;
        
        const secondsTaken = (new Date() - this.startTime) / 1000;
        const roundedSeconds = Math.ceil(secondsTaken / 10) * 10;
        
        return Math.ceil(this.maxPoints * (20 / roundedSeconds));
    }
    
    calculateBasePoints() {
        let points = this.maxPoints;
        
        // Apply check penalties
        if (this.checkCount > 0) {
            points *= Math.pow(0.75, this.checkCount);
        }
        
        // Apply spare removal penalty
        if (this.removedSpares) {
            points *= 0.667;
        }
        
        return Math.ceil(points);
    }
    
    handleCheck(isComplete) {
        if (!isComplete) {
            this.checkCount++;
        }
    }
    
    handleSpareRemoval() {
        this.removedSpares = true;
        this.updateDisplay();
    }
    
    completePuzzle() {
        // Skip if already completed this round
        if (this.roundComplete) {
            return;
        }
        
        this.roundComplete = true;
        const basePoints = this.calculateBasePoints();
        const timeBonus = this.calculateTimeBonus();
        this.roundScore = basePoints + timeBonus;
        this.totalScore += this.roundScore;
        
        this.updateDisplay();
        
        // Dispatch an event when score is updated
        this.dispatchScoreUpdate();
        
        // From patch: Ensure score is updated in leaderboard if username is set
        if (window.leaderboardManager && window.leaderboardManager.isUsernameSet) {
            window.leaderboardManager.updateScore(this.totalScore);
        }
    }
    
    dispatchScoreUpdate() {
        const event = new CustomEvent('scoreUpdated', {
            detail: {
                score: this.totalScore,
                level: this.currentLevel,
                roundScore: this.roundScore,
                roundComplete: this.roundComplete
            }
        });
        window.dispatchEvent(event);
    }
    
    updateDisplay() {
        // Update total score (always visible)
        const scoreTotalElement = document.getElementById('score-total');
        if (scoreTotalElement) {
            scoreTotalElement.textContent = `TOTAL: ${this.totalScore}`;
        }
        
        // Update bonus info (only when round is complete)
        const scoreBonusElement = document.getElementById('score-bonus');
        if (scoreBonusElement) {
            if (this.roundComplete) {
                // Format the display to show base points + bonus = round score
                const basePoints = this.calculateBasePoints();
                const timeBonus = this.calculateTimeBonus();
                
                scoreBonusElement.textContent = `${basePoints} + ${timeBonus} = ${this.roundScore}`;
                scoreBonusElement.style.visibility = 'visible';
                scoreBonusElement.style.color = '#ef4444'; // Red color for round score
            } else {
                // If username is displayed here, ensure it's dark blue
                if (scoreBonusElement.textContent && !scoreBonusElement.textContent.includes('+')) {
                    scoreBonusElement.style.color = '#1e40af'; // Dark blue for username
                }
                
                if (!scoreBonusElement.textContent) {
                    scoreBonusElement.style.visibility = 'hidden';
                }
            }
        }
        
        // Dispatch score updated event (from patch)
        const scoreUpdatedEvent = new CustomEvent('scoreUpdated', {
            detail: {
                score: this.totalScore,
                level: this.currentLevel,
                roundScore: this.roundScore,
                roundComplete: this.roundComplete
            }
        });
        
        window.dispatchEvent(scoreUpdatedEvent);
    }
    
    getCurrentState() {
        return {
            level: this.currentLevel,
            maxPoints: this.maxPoints,
            checkCount: this.checkCount,
            removedSpares: this.removedSpares,
            roundComplete: this.roundComplete,
            roundScore: this.roundScore,
            totalScore: this.totalScore
        };
    }
    
    // Reset scores (useful for testing)
    resetScores() {
        this.totalScore = 0;
        this.roundScore = 0;
        this.roundComplete = false;
        this.updateDisplay();
    }
}

// Export a single instance
export const scoreManager = new ScoreManager();
// Also make it available globally
window.scoreManager = scoreManager;

// Add functionality from scoremanager-patch.js
(function() {
    // Wait for the original scoreManager to be available
    const checkForScoreManager = setInterval(() => {
        if (window.scoreManager) {
            clearInterval(checkForScoreManager);
            
            // Reset the total score when the page loads
            window.scoreManager.totalScore = 0;
            window.scoreManager.updateDisplay();
            
            console.log('ScoreManager initialized with reset scores');
        }
    }, 100);
})();
