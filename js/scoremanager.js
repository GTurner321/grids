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
        this.maxPoints = 1000 * level;
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
        
        return Math.ceil(1000 * this.currentLevel * (20 / roundedSeconds));
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
    
    // Update to the updateDisplay method in scoremanager.js

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
        } else {
            scoreBonusElement.textContent = '';
            scoreBonusElement.style.visibility = 'hidden';
        }
    }
    
    // Each time we update the display, dispatch the score update event
    // This ensures the leaderboard always has the latest score
    this.dispatchScoreUpdate();
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
