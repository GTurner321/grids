// scoremanager.js

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
    }

    updateDisplay() {
    const scoreComponent = document.getElementById('score-component');
    if (!scoreComponent) return;

    let html = '<div class="score-display">';
    
    // Max points (in gray)
    html += `<div class="max-points">Max for round: ${this.maxPoints}</div>`;
    
    // Placeholder for bonus (hidden until complete)
    html += `<div class="bonus">${this.roundComplete ? 
        `${this.calculateBasePoints()} + ${this.calculateTimeBonus()} bonus =` : 
        '&nbsp;'}</div>`;
    
    // Placeholder for round score (hidden until complete)
    html += `<div class="round-score">${this.roundComplete ? 
        `Score for round: ${this.roundScore}` : 
        '&nbsp;'}</div>`;
    
    // Total score (always visible, bold)
    html += `<div class="total-score">Total: ${this.totalScore}</div>`;
    
    html += '</div>';
    
    scoreComponent.innerHTML = html;

    // Show hidden elements if round is complete
    if (this.roundComplete) {
        const bonusEl = scoreComponent.querySelector('.bonus');
        const roundScoreEl = scoreComponent.querySelector('.round-score');
        bonusEl.style.visibility = 'visible';
        roundScoreEl.style.visibility = 'visible';
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
