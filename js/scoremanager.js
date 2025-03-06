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
        this.roundComplete = true;
        const basePoints = this.calculateBasePoints();
        const timeBonus = this.calculateTimeBonus();
        this.roundScore = basePoints + timeBonus;
        this.totalScore += this.roundScore;
        
        this.updateDisplay();
        
        // Dispatch an event when score is updated
        const event = new CustomEvent('scoreUpdated', {
            detail: {
                score: this.totalScore,
                level: this.currentLevel,
                roundScore: this.roundScore
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
                scoreBonusElement.textContent = `${this.calculateBasePoints()} + ${this.calculateTimeBonus()} bonus = ${this.roundScore}`;
                scoreBonusElement.style.visibility = 'visible';
            } else {
                scoreBonusElement.textContent = '';
                scoreBonusElement.style.visibility = 'hidden';
            }
        }
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
}
// Export a single instance
export const scoreManager = new ScoreManager();
// Also make it available globally
window.scoreManager = scoreManager;
