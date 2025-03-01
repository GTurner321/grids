// leaderboard.js
class LeaderboardManager {
    constructor() {
        this.leaderboardData = [];
        this.username = '';
        this.isUsernameSet = false;
        this.maxEntries = 20;
        this.maxDays = 7; // Maximum days to keep scores
        
        this.loadLeaderboard();
        this.createLeaderboardUI();
        this.addEventListeners();
    }
    
    createLeaderboardUI() {
        // Create leaderboard container
        const leaderboardSection = document.createElement('section');
        leaderboardSection.className = 'leaderboard-section';
        
        // Create username submission area
        const usernameArea = document.createElement('div');
        usernameArea.className = 'username-area';
        
        const usernameForm = document.createElement('div');
        usernameForm.className = 'username-form';
        
        const usernamePrompt = document.createElement('p');
        usernamePrompt.textContent = 'Record your score - submit your name:';
        usernamePrompt.className = 'username-prompt';
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper';
        
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'username-input';
        usernameInput.maxLength = 12;
        usernameInput.placeholder = 'Enter your name (max 12 chars)';
        
        const submitButton = document.createElement('button');
        submitButton.id = 'submit-username';
        submitButton.textContent = 'Submit';
        
        inputWrapper.appendChild(usernameInput);
        inputWrapper.appendChild(submitButton);
        
        const statusMessage = document.createElement('div');
        statusMessage.id = 'username-status';
        statusMessage.className = 'status-message';
        
        usernameForm.appendChild(usernamePrompt);
        usernameForm.appendChild(inputWrapper);
        usernameForm.appendChild(statusMessage);
        
        // Create welcome message area (initially hidden)
        const welcomeMessage = document.createElement('div');
        welcomeMessage.id = 'welcome-message';
        welcomeMessage.className = 'welcome-message hidden';
        
        usernameArea.appendChild(usernameForm);
        usernameArea.appendChild(welcomeMessage);
        
        // Create leaderboard table
        const leaderboardTitle = document.createElement('h2');
        leaderboardTitle.textContent = 'LEADERBOARD';
        leaderboardTitle.className = 'leaderboard-title';
        
        const leaderboardTable = document.createElement('div');
        leaderboardTable.className = 'leaderboard-table';
        leaderboardTable.id = 'leaderboard-table';
        
        // Add all elements to the leaderboard section
        leaderboardSection.appendChild(usernameArea);
        leaderboardSection.appendChild(leaderboardTitle);
        leaderboardSection.appendChild(leaderboardTable);
        
        // Find the game-container and append the leaderboard section
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(leaderboardSection);
        }
    }
    
    addEventListeners() {
        // Add event listener for username submission
        const submitButton = document.getElementById('submit-username');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                this.handleUsernameSubmission();
            });
        }
        
        // Listen for Enter key in the input field
        const usernameInput = document.getElementById('username-input');
        if (usernameInput) {
            usernameInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    this.handleUsernameSubmission();
                }
            });
        }
        
        // Listen for score updates
        window.addEventListener('scoreUpdated', (event) => {
            const score = event.detail.score;
            if (this.isUsernameSet) {
                this.updateScore(score);
            }
        });
    }
    
    async handleUsernameSubmission() {
        const usernameInput = document.getElementById('username-input');
        const statusMessage = document.getElementById('username-status');
        const username = usernameInput.value.trim();
        
        if (!username) {
            statusMessage.textContent = 'Please enter a name.';
            statusMessage.className = 'status-message error';
            return;
        }
        
        // Show checking message
        statusMessage.textContent = 'Checking name...';
        statusMessage.className = 'status-message checking';
        
        try {
            const isApproved = await this.checkUsername(username);
            
            if (isApproved) {
                this.setUsername(username);
                
                // Hide the form and show welcome message
                const usernameForm = document.querySelector('.username-form');
                const welcomeMessage = document.getElementById('welcome-message');
                
                if (usernameForm && welcomeMessage) {
                    usernameForm.classList.add('hidden');
                    welcomeMessage.classList.remove('hidden');
                    welcomeMessage.textContent = `Hello ${username} - your top 20 score records in the leaderboard below.`;
                }
                
                // Get current score and update leaderboard
                const currentScore = this.getCurrentScore();
                if (currentScore > 0) {
                    this.updateScore(currentScore);
                }
                
            } else {
                statusMessage.textContent = 'Username not appropriate for family-friendly environment. Please try another.';
                statusMessage.className = 'status-message error';
            }
        } catch (error) {
            console.error('Error checking username:', error);
            statusMessage.textContent = 'Error checking username. Please try again.';
            statusMessage.className = 'status-message error';
        }
    }
    
    async checkUsername(username) {
        try {
            // Import the username checker module
            const usernameCheckerModule = await import('./username-checker.js');
            const usernameChecker = usernameCheckerModule.default;
            
            // Use the username checker to validate the username
            return await usernameChecker.checkUsername(username);
        } catch (error) {
            console.error('Error using username checker:', error);
            
            // Fallback to basic checks if module fails to load
            if (!username || username.length < 2 || username.length > 12) {
                return false;
            }
            
            // Basic pattern check
            const inappropriatePatterns = [
                /fuck/i, /shit/i, /ass(?!et|ign|ess|ist)/i, /damn/i, /cunt/i,
                /\bn[i1l]gg[ae3]r/i, /\bf[a@]g/i
            ];
            
            for (const pattern of inappropriatePatterns) {
                if (pattern.test(username)) {
                    return false;
                }
            }
            
            return true;
        }
    }
    
    setUsername(username) {
        this.username = username;
        this.isUsernameSet = true;
        
        // Save username to localStorage
        localStorage.setItem('pathPuzzleUsername', username);
    }
    
    getCurrentScore() {
        // Get current score from scoreManager
        try {
            if (window.scoreManager) {
                return window.scoreManager.totalScore || 0;
            }
        } catch (error) {
            console.error('Error getting current score:', error);
        }
        return 0;
    }
    
    updateScore(score) {
        if (!this.isUsernameSet || score <= 0) return;
        
        const now = new Date();
        const entry = {
            name: this.username,
            score: score,
            date: now.toISOString()
        };
        
        // Check if user already has an entry
        const existingIndex = this.leaderboardData.findIndex(item => item.name === this.username);
        
        if (existingIndex !== -1) {
            // Update if new score is higher
            if (score > this.leaderboardData[existingIndex].score) {
                this.leaderboardData[existingIndex] = entry;
            }
        } else {
            // Add new entry
            this.leaderboardData.push(entry);
        }
        
        // Sort and limit entries
        this.filterAndSortLeaderboard();
        
        // Save and render
        this.saveLeaderboard();
        this.renderLeaderboard();
    }
    
    filterAndSortLeaderboard() {
        // Filter out entries older than maxDays
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.maxDays);
        
        this.leaderboardData = this.leaderboardData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= cutoffDate;
        });
        
        // Sort by score (descending)
        this.leaderboardData.sort((a, b) => b.score - a.score);
        
        // Limit to maxEntries
        this.leaderboardData = this.leaderboardData.slice(0, this.maxEntries);
    }
    
    loadLeaderboard() {
        try {
            // Get from localStorage
            const storedData = localStorage.getItem('pathPuzzleLeaderboard');
            if (storedData) {
                this.leaderboardData = JSON.parse(storedData);
                this.filterAndSortLeaderboard(); // Clean up on load
            }
            
            // Check for stored username
            const storedUsername = localStorage.getItem('pathPuzzleUsername');
            if (storedUsername) {
                this.username = storedUsername;
                this.isUsernameSet = true;
                
                // Update UI to reflect saved username
                setTimeout(() => {
                    const usernameForm = document.querySelector('.username-form');
                    const welcomeMessage = document.getElementById('welcome-message');
                    
                    if (usernameForm && welcomeMessage) {
                        usernameForm.classList.add('hidden');
                        welcomeMessage.classList.remove('hidden');
                        welcomeMessage.textContent = `Hello ${this.username} - your top 20 score records in the leaderboard below.`;
                    }
                }, 500); // Small delay to ensure DOM is ready
            }
            
            // Render the leaderboard
            this.renderLeaderboard();
            
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            this.leaderboardData = [];
        }
    }
    
    saveLeaderboard() {
        try {
            localStorage.setItem('pathPuzzleLeaderboard', JSON.stringify(this.leaderboardData));
        } catch (error) {
            console.error('Error saving leaderboard data:', error);
        }
    }
    
    renderLeaderboard() {
        const leaderboardTable = document.getElementById('leaderboard-table');
        if (!leaderboardTable) return;
        
        // Clear existing content
        leaderboardTable.innerHTML = '';
        
        // Create header row
        const headerRow = document.createElement('div');
        headerRow.className = 'leaderboard-row header';
        
        const rankHeader = document.createElement('div');
        rankHeader.className = 'leaderboard-cell rank';
        rankHeader.textContent = 'RANK';
        
        const nameHeader = document.createElement('div');
        nameHeader.className = 'leaderboard-cell name';
        nameHeader.textContent = 'NAME';
        
        const scoreHeader = document.createElement('div');
        scoreHeader.className = 'leaderboard-cell score';
        scoreHeader.textContent = 'SCORE';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'leaderboard-cell date';
        dateHeader.textContent = 'DATE';
        
        headerRow.appendChild(rankHeader);
        headerRow.appendChild(nameHeader);
        headerRow.appendChild(scoreHeader);
        headerRow.appendChild(dateHeader);
        
        leaderboardTable.appendChild(headerRow);
        
        // Add data rows
        this.leaderboardData.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            
            // Highlight current user
            if (entry.name === this.username) {
                row.classList.add('current-user');
            }
            
            const rankCell = document.createElement('div');
            rankCell.className = 'leaderboard-cell rank';
            rankCell.textContent = `${index + 1}`;
            
            const nameCell = document.createElement('div');
            nameCell.className = 'leaderboard-cell name';
            nameCell.textContent = entry.name;
            
            const scoreCell = document.createElement('div');
            scoreCell.className = 'leaderboard-cell score';
            scoreCell.textContent = entry.score.toString();
            
            const date = new Date(entry.date);
            const dateCell = document.createElement('div');
            dateCell.className = 'leaderboard-cell date';
            dateCell.textContent = `${date.toLocaleDateString()}`;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);
            
            leaderboardTable.appendChild(row);
        });
        
        // If no entries, show a message
        if (this.leaderboardData.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'leaderboard-row empty';
            emptyRow.textContent = 'No scores yet. Start playing to get on the leaderboard!';
            leaderboardTable.appendChild(emptyRow);
        }
    }
}

// Initialize leaderboard when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Wait a short time for the main game to initialize
    setTimeout(() => {
        window.leaderboardManager = new LeaderboardManager();
    }, 500);
});

export default LeaderboardManager;
