// scoremanager.js - Updated with Google Auth integration
import GoogleAuth from './googleauth.js';

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
        
        // Google Auth
        this.googleAuth = new GoogleAuth(https://script.google.com/macros/s/AKfycbw1Va9YfX2Pehg6MQbNK6dJCIRnCHkmnS1G1YHFPwDVSM7lki_bpD0hV87I-v0vTz0oYw/exec); // Replace with your deployed Apps Script URL
        this.googleAuth.init();
        
        // Add listener for user changes
        this.googleAuth.addListener(this.handleUserChange.bind(this));
        
        // Initialize display
        this.updateDisplay();
        
        // Add high scores modal
        this.createHighScoresModal();
    }
    
    handleUserChange(userState) {
        // Update UI if needed
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
    
    async completePuzzle() {
        this.roundComplete = true;
        const basePoints = this.calculateBasePoints();
        const timeBonus = this.calculateTimeBonus();
        this.roundScore = basePoints + timeBonus;
        this.totalScore += this.roundScore;
        
        // Save score to Google Sheets if user is logged in
        if (this.googleAuth.isLoggedIn) {
            try {
                await this.googleAuth.saveScore(this.currentLevel, this.roundScore);
                console.log('Score saved successfully');
                
                // Show success message
                this.showMessage('Score saved to leaderboard!', 'success');
                
                // Show high scores if user just completed a level
                setTimeout(() => {
                    this.showHighScores(this.currentLevel);
                }, 2000);
            } catch (error) {
                console.error('Error saving score:', error);
            }
        } else {
            // Show login prompt with option to save score
            this.showLoginPrompt();
        }
        
        this.updateDisplay();
    }
    
    showLoginPrompt() {
        this.showMessage('Sign in to save scores and see leaderboards!', 'info');
    }
    
    showMessage(text, type = 'info', duration = 5000) {
        const messageElement = document.getElementById('game-messages');
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = `message-box ${type}`;
            
            // Clear after duration
            setTimeout(() => {
                if (messageElement.textContent === text) {
                    messageElement.textContent = '';
                    messageElement.className = 'message-box';
                }
            }, duration);
        }
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
        
        // Update high scores button visibility
        const highScoresButton = document.getElementById('high-scores-btn');
        if (highScoresButton) {
            highScoresButton.style.display = this.googleAuth.isLoggedIn ? 'block' : 'none';
        }
    }
    
    createHighScoresModal() {
        // Create high scores button
        const controlsContainer = document.querySelector('.game-controls');
        const highScoresButton = document.createElement('button');
        highScoresButton.id = 'high-scores-btn';
        highScoresButton.style.display = 'none'; // Hidden by default
        
        highScoresButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Leaderboard
        `;
        
        highScoresButton.addEventListener('click', () => {
            this.showHighScores();
        });
        
        controlsContainer.appendChild(highScoresButton);
        
        // Create high scores modal
        const highScoresModal = document.createElement('div');
        highScoresModal.id = 'high-scores-modal';
        highScoresModal.className = 'rules-modal';
        highScoresModal.style.display = 'none';
        
        highScoresModal.innerHTML = `
            <div class="rules-content">
                <h2 class="rules-title">LEADERBOARD</h2>
                <div class="level-buttons">
                    <button type="button" class="level-btn high-score-level-btn" data-level="1">L1</button>
                    <button type="button" class="level-btn high-score-level-btn" data-level="2">L2</button>
                    <button type="button" class="level-btn high-score-level-btn" data-level="3">L3</button>
                    <button type="button" class="level-btn high-score-level-btn" data-level="4">L4</button>
                    <button type="button" class="level-btn high-score-level-btn" data-level="5">L5</button>
                </div>
                <div id="high-scores-content" class="rules-section">
                    <p>Loading scores...</p>
                </div>
                <div class="rules-button-container">
                    <button id="close-high-scores" class="start-button">
                        CLOSE
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(highScoresModal);
        
        // Add event listeners
        document.getElementById('close-high-scores').addEventListener('click', () => {
            highScoresModal.style.display = 'none';
        });
        
        // Add level button listeners
        document.querySelectorAll('.high-score-level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.loadHighScores(level);
                
                // Update active button
                document.querySelectorAll('.high-score-level-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
            });
        });
    }
    
    async showHighScores(level = 1) {
        const modal = document.getElementById('high-scores-modal');
        if (!modal) return;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Set active level button
        document.querySelectorAll('.high-score-level-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
        });
        
        // Load scores for the selected level
        await this.loadHighScores(level);
    }
    
    async loadHighScores(level) {
        const contentElement = document.getElementById('high-scores-content');
        if (!contentElement) return;
        
        // Show loading
        contentElement.innerHTML = '<p>Loading scores...</p>';
        
        try {
            // Get high scores
            const scores = await this.googleAuth.getHighScores(level);
            
            if (scores.length === 0) {
                contentElement.innerHTML = '<p>No scores recorded for this level yet.</p>';
                return;
            }
            
            // Build scores table
            let html = `
                <table style="width: 100%; text-align: center; margin-top: 10px;">
                    <tr>
                        <th style="color: #fde047;">Rank</th>
                        <th style="color: #fde047;">Player</th>
                        <th style="color: #fde047;">Score</th>
                    </tr>
            `;
            
            scores.forEach((score, index) => {
                const isCurrentUser = this.googleAuth.username === score.username;
                const rowStyle = isCurrentUser ? 'background-color: rgba(34, 197, 94, 0.2);' : '';
                
                html += `
                    <tr style="${rowStyle}">
                        <td>${index + 1}</td>
                        <td>${score.username}</td>
                        <td>${score.score}</td>
                    </tr>
                `;
            });
            
            html += '</table>';
            contentElement.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading high scores:', error);
            contentElement.innerHTML = '<p>Error loading scores. Please try again later.</p>';
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
