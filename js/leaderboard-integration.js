// leaderboard-integration.js - Simplified approach for local storage only

// Load CSS
function loadStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.head.appendChild(link);
}

// Reset user state for new session
function resetUserState() {
    // If there's an existing leaderboard manager, reset its state
    if (window.leaderboardManager) {
        window.leaderboardManager.username = '';
        window.leaderboardManager.isUsernameSet = false;
    }
    
    // Reset any UI elements if they exist
    setTimeout(() => {
        const usernameForm = document.querySelector('.username-form');
        const welcomeMessage = document.getElementById('welcome-message');
        
        if (usernameForm) {
            usernameForm.classList.remove('hidden');
        }
        
        if (welcomeMessage) {
            welcomeMessage.classList.add('hidden');
            welcomeMessage.textContent = '';
        }
        
        // Clear any input field value
        const usernameInput = document.getElementById('username-input');
        if (usernameInput) {
            usernameInput.value = '';
        }
    }, 100);
}

// Patch the ScoreManager
function patchScoreManager() {
    if (!window.scoreManager) return false;
    
    try {
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
        return true;
    } catch (error) {
        console.error('Error patching ScoreManager:', error);
        return false;
    }
}

// Create the leaderboard class
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
        
        // Create leaderboard title
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
    
    handleUsernameSubmission() {
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
            const isApproved = this.checkUsername(username);
            
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
                
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
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
    checkUsername(username) {
        if (!username || username.length < 2 || username.length > 12) {
            return false;
        }
        
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
    
    setUsername(username) {
        this.username = username;
        this.isUsernameSet = true;
        
        // Save to localStorage
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
            // Get leaderboard data from localStorage
            const storedData = localStorage.getItem('pathPuzzleLeaderboard');
            if (storedData) {
                this.leaderboardData = JSON.parse(storedData);
                this.filterAndSortLeaderboard(); // Clean up on load
            }
            
            // Get username from localStorage
            const storedUsername = localStorage.getItem('pathPuzzleUsername');
            if (storedUsername) {
                this.username = storedUsername;
                this.isUsernameSet = true;
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

// Initialize on DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
    try {
        // Reset any user state
        resetUserState();
        
        // Load leaderboard stylesheet
        loadStylesheet('./styles/leaderboard.css');
        
        // Create and initialize the local leaderboard
        window.leaderboardManager = new LeaderboardManager();
        
        // Patch score manager
        patchScoreManager();
        
        console.log('Local leaderboard initialized successfully');
    } catch (error) {
        console.error('Error initializing leaderboard system:', error);
    }
});
