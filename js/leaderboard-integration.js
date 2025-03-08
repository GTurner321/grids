// leaderboard-integration.js - Fixed for proper updating

import supabaseLeaderboard from '/js/supabase-leaderboard.js';

// Function to load stylesheet
function loadStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.head.appendChild(link);
}

// Reset any stored user data
function resetUserSession() {
    localStorage.removeItem('pathPuzzleUsername');
    localStorage.removeItem('pathPuzzleLeaderboard');
    
    sessionStorage.removeItem('pathPuzzleUsername');
    sessionStorage.removeItem('pathPuzzleLeaderboard');
    
    console.log('User session data reset');
}

// Debounce function to prevent multiple rapid calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

class LeaderboardManager {
    constructor() {
        // Reset any existing data
        resetUserSession();
        
        // Configuration
        this.SCORE_THRESHOLD = 5000;
        this.REFRESH_INTERVAL = 30000; // 30 seconds
        
        // State
        this.leaderboardData = [];
        this.username = '';
        this.isUsernameSet = false;
        this.maxEntries = 20;
        this.sessionHighScore = 0;
        this.leaderboardVisible = false;
        this.leaderboardLoaded = false;
        this.lastRefreshTime = 0;
        this.refreshTimer = null;
        
        // Initialize UI
        this.loadStylesheet();
        this.createLeaderboardUI();
        this.addEventListeners();
        this.findScoreManager();
    }
    
    loadStylesheet() {
        loadStylesheet('./styles/leaderboard.css');
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
        usernamePrompt.textContent = 'RECORD YOUR SCORE - SUBMIT YOUR NAME:';
        usernamePrompt.className = 'username-prompt';
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper';
        
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'username-input';
        usernameInput.maxLength = 12;
        usernameInput.placeholder = 'Enter name (max 12 char)';
        
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
        const leaderboardTitle = document.createElement('button');
        leaderboardTitle.textContent = 'LEADERBOARD';
        leaderboardTitle.className = 'leaderboard-title-button';
        leaderboardTitle.id = 'leaderboard-toggle';
        
        // Add threshold subtitle
        const thresholdSubtitle = document.createElement('div');
        thresholdSubtitle.textContent = `CLICK TO REVEAL - SCORE ${this.SCORE_THRESHOLD}+`;
        thresholdSubtitle.className = 'leaderboard-subtitle';
        thresholdSubtitle.style.fontFamily = "'Courier New', monospace";
        thresholdSubtitle.style.fontSize = '0.8rem';
        thresholdSubtitle.style.color = '#718096'; // Lighter gray color
        thresholdSubtitle.style.textAlign = 'center';
        thresholdSubtitle.style.marginTop = '-10px';
        thresholdSubtitle.style.marginBottom = '10px';
        thresholdSubtitle.style.letterSpacing = '0.05em';
        thresholdSubtitle.style.fontWeight = 'bold';
        
        // Create leaderboard table (initially hidden)
        const leaderboardTable = document.createElement('div');
        leaderboardTable.className = 'leaderboard-table hidden';
        leaderboardTable.id = 'leaderboard-table';
        
        // Add all elements to the leaderboard section
        leaderboardSection.appendChild(usernameArea);
        leaderboardSection.appendChild(leaderboardTitle);
        leaderboardSection.appendChild(thresholdSubtitle);
        leaderboardSection.appendChild(leaderboardTable);
        
        // Find the game-container and append the leaderboard section
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(leaderboardSection);
        }
    }
    
    findScoreManager() {
        // First try to use the scoreManager directly imported via module
        import('./scoremanager.js').then(module => {
            if (module && module.scoreManager) {
                // Add it to window for easy access
                window.scoreManager = module.scoreManager;
                this.patchScoreManager(module.scoreManager);
                console.log('ScoreManager found via module import and patched successfully');
            } else {
                console.log('ScoreManager not found in module, checking window...');
                // Otherwise check window object
                if (window.scoreManager) {
                    this.patchScoreManager(window.scoreManager);
                    console.log('ScoreManager found in window and patched successfully');
                } else {
                    console.log('ScoreManager not found, setting up observer...');
                    // Set up an observer to wait for scoreManager
                    this.setupScoreManagerObserver();
                }
            }
        }).catch(err => {
            console.error('Error importing scoremanager module:', err);
            // Try to find it on window
            if (window.scoreManager) {
                this.patchScoreManager(window.scoreManager);
            } else {
                this.setupScoreManagerObserver();
            }
        });
    }
    
    setupScoreManagerObserver() {
        // Wait for scoreManager to be available on window
        const checkInterval = setInterval(() => {
            if (window.scoreManager) {
                clearInterval(checkInterval);
                this.patchScoreManager(window.scoreManager);
                console.log('ScoreManager found via observer and patched successfully');
            }
        }, 100);
        
        // Stop checking after 10 seconds to prevent infinite loop
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('ScoreManager not found after 10 seconds, leaderboard functionality may be limited');
        }, 10000);
    }
    
    patchScoreManager(scoreManager) {
        try {
            // Store reference to the original methods
            const originalCompletePuzzle = scoreManager.completePuzzle;
            const originalUpdateDisplay = scoreManager.updateDisplay;
            
            // Patch completePuzzle to ensure leaderboard is updated
            scoreManager.completePuzzle = () => {
                // Only run if this is the first time for this puzzle
                if (!scoreManager.roundComplete) {
                    // Call the original function first
                    originalCompletePuzzle.call(scoreManager);
                    
                    const score = scoreManager.totalScore;
                    console.log('Completed puzzle, total score:', score);
                    
                    // If username is set, update the score in leaderboard
                    if (this.isUsernameSet && score > 0) {
                        console.log('LeaderboardManager processing score:', score);
                        this.processScore(score);
                    }
                } else {
                    console.log('Puzzle already completed, not updating score again');
                }
            };
            
            return true;
        } catch (error) {
            console.error('Error patching ScoreManager:', error);
            return false;
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
            console.log('Score updated event received:', event.detail);
            const score = event.detail.score;
            if (this.isUsernameSet && score > 0) {
                this.processScore(score);
            }
        });

        // Add event listener for leaderboard toggle
        const toggleButton = document.getElementById('leaderboard-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleLeaderboardVisibility();
            });
        }
        
        // Set up periodic refresh for when the leaderboard is visible
        this.setupRefreshTimer();
        
        // Add visibility change listener to refresh when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.leaderboardVisible) {
                this.refreshLeaderboard();
            }
        });
    }
    
    setupRefreshTimer() {
        // Clear any existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Set up new timer
        this.refreshTimer = setInterval(() => {
            if (document.visibilityState === 'visible' && this.leaderboardVisible) {
                // Only refresh if it's been at least 30 seconds since last refresh
                const now = Date.now();
                if (now - this.lastRefreshTime >= this.REFRESH_INTERVAL) {
                    this.refreshLeaderboard();
                }
            }
        }, this.REFRESH_INTERVAL);
    }
    
    processScore(score) {
        console.log('Processing score:', score);
        
        // Check if score is a new session high score
        if (score > this.sessionHighScore) {
            this.sessionHighScore = score;
            console.log('New session high score:', score);
            
            // If username is set and score is high enough, update leaderboard
            if (this.isUsernameSet && score >= this.SCORE_THRESHOLD) {
                // Submit the score to the leaderboard
                this.submitScore(score);
                
                // Show the leaderboard if it's hidden and score meets threshold
                if (!this.leaderboardVisible) {
                    this.showLeaderboard();
                }
            } else if (this.isUsernameSet) {
                // For scores below threshold, just show a status message
                const pointsNeeded = this.SCORE_THRESHOLD - score;
                this.showUpdateStatus(
                    `Score tracked (needs ${pointsNeeded} more to reach leaderboard)`, 
                    'info'
                );
                setTimeout(() => this.hideUpdateStatus(), 3000);
            }
        } else {
            // Even if it's not a new high score, refresh the leaderboard
            // This ensures the latest standings are shown after each puzzle
            if (this.isUsernameSet && this.leaderboardVisible && score >= this.SCORE_THRESHOLD) {
                this.refreshLeaderboard();
            }
        }
    }
    
    async submitScore(score) {
        if (!this.isUsernameSet || score < this.SCORE_THRESHOLD) {
            console.log(`Score not submitted: ${!this.isUsernameSet ? 'username not set' : 'below threshold of ' + this.SCORE_THRESHOLD}`);
            return;
        }
        
        try {
            this.showUpdateStatus('Updating leaderboard...');
            
            // Submit the score
            const result = await supabaseLeaderboard.submitScore(this.username, score);
            
            if (result.success) {
                console.log('Score submitted successfully');
                
                // Refresh the leaderboard to show the updated scores
                await this.refreshLeaderboard();
                
                // Show success message
                this.showUpdateStatus('Score added to leaderboard!', 'success');
                
                // Hide status after 2 seconds
                setTimeout(() => {
                    this.hideUpdateStatus();
                }, 2000);
            } else {
                console.error('Error submitting score:', result.error);
                this.showUpdateStatus('Error updating score: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            this.showUpdateStatus('Error updating score', 'error');
        }
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
            let isApproved = false;
            
            try {
                const usernameCheckerModule = await import('./username-checker.js');
                const usernameChecker = usernameCheckerModule.default;
                isApproved = await usernameChecker.checkUsername(username);
            } catch (e) {
                console.warn('Could not load username checker, using fallback check');
                isApproved = this.checkUsername(username);
            }
            
            if (isApproved) {
                this.setUsername(username);
                
                // Hide the form and show welcome message
                const usernameForm = document.querySelector('.username-form');
                const welcomeMessage = document.getElementById('welcome-message');
                
                if (usernameForm && welcomeMessage) {
                    usernameForm.classList.add('hidden');
                    welcomeMessage.classList.remove('hidden');
                    welcomeMessage.textContent = `Hello ${username} - high scores will appear in the leaderboard below.`;
                }
                
                // Get current score
                const currentScore = this.getCurrentScore();
                
                // Process the current score
                if (currentScore > 0) {
                    this.processScore(currentScore);
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
    }
    
    getCurrentScore() {
        try {
            if (window.scoreManager) {
                return window.scoreManager.totalScore || 0;
            }
        } catch (error) {
            console.error('Error getting current score:', error);
        }
        return 0;
    }
    
    showUpdateStatus(message, type = 'info') {
        const existingStatus = document.getElementById('leaderboard-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const statusEl = document.createElement('div');
        statusEl.id = 'leaderboard-status';
        statusEl.className = `leaderboard-status ${type}`;
        statusEl.textContent = message;
        
        const leaderboardTable = document.getElementById('leaderboard-table');
        if (leaderboardTable && leaderboardTable.parentNode) {
            leaderboardTable.parentNode.insertBefore(statusEl, leaderboardTable);
        }
    }
    
    hideUpdateStatus() {
        const statusEl = document.getElementById('leaderboard-status');
        if (statusEl) {
            statusEl.remove();
        }
    }

    toggleLeaderboardVisibility() {
        const leaderboardTable = document.getElementById('leaderboard-table');
        const toggleButton = document.getElementById('leaderboard-toggle');
        
        if (leaderboardTable) {
            const isHidden = leaderboardTable.classList.contains('hidden');
            
            if (isHidden) {
                // Show the leaderboard
                this.showLeaderboard();
            } else {
                // Hide the leaderboard
                this.hideLeaderboard();
            }
        }
    }

    showLeaderboard() {
        const leaderboardTable = document.getElementById('leaderboard-table');
        const toggleButton = document.getElementById('leaderboard-toggle');
        
        if (leaderboardTable && leaderboardTable.classList.contains('hidden')) {
            // Show the leaderboard
            leaderboardTable.classList.remove('hidden');
            
            // Add active class to button
            if (toggleButton) {
                toggleButton.classList.add('active');
            }
            
            // Set leaderboard visible state
            this.leaderboardVisible = true;
            
            // Show loading indicator
            leaderboardTable.innerHTML = '<div class="leaderboard-row" style="justify-content: center; padding: 20px;">Loading leaderboard data...</div>';
            
            // Refresh the leaderboard data
            this.refreshLeaderboard();
        }
    }
    
    hideLeaderboard() {
        const leaderboardTable = document.getElementById('leaderboard-table');
        const toggleButton = document.getElementById('leaderboard-toggle');
        
        if (leaderboardTable && !leaderboardTable.classList.contains('hidden')) {
            // Hide the leaderboard
            leaderboardTable.classList.add('hidden');
            
            // Remove active class from button
            if (toggleButton) {
                toggleButton.classList.remove('active');
            }
            
            // Set leaderboard hidden state
            this.leaderboardVisible = false;
        }
    }
    
    async refreshLeaderboard() {
        try {
            // Record refresh time
            this.lastRefreshTime = Date.now();
            
            // Fetch fresh data from Supabase
            this.leaderboardData = await supabaseLeaderboard.getLeaderboard();
            
            // Render the updated leaderboard
            this.renderLeaderboard();
            
            return true;
        } catch (error) {
            console.error('Error refreshing leaderboard:', error);
            
            // Show error message in leaderboard
            const leaderboardTable = document.getElementById('leaderboard-table');
            if (leaderboardTable && this.leaderboardVisible) {
                leaderboardTable.innerHTML = '<div class="leaderboard-row" style="justify-content: center; padding: 20px; color: #e53e3e;">Error loading leaderboard data. Please try again later.</div>';
            }
            
            return false;
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
            
            // Add animation for new entries or score updates
            if (!this.leaderboardLoaded) {
                row.classList.add('new-entry');
                
                // Remove the animation class after it completes
                setTimeout(() => {
                    row.classList.remove('new-entry');
                }, 2000);
            }
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
        const dateStr = date.toLocaleDateString(undefined, {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit'
        });
        
        const dateCell = document.createElement('div');
        dateCell.className = 'leaderboard-cell date';
        dateCell.textContent = dateStr;
        
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
    
    // Mark as loaded
    this.leaderboardLoaded = true;
}
    
    // Helper method to check if user has a score on the leaderboard
     hasUserScoreOnLeaderboard() {
        if (!this.username || !this.leaderboardData || this.leaderboardData.length === 0) {
            return false;
        }
        
        return this.leaderboardData.some(entry => entry.name === this.username);
    }
    
    // Helper method to get user's current rank on the leaderboard
    getUserRank() {
        if (!this.username || !this.leaderboardData || this.leaderboardData.length === 0) {
            return null;
        }
        
        const userIndex = this.leaderboardData.findIndex(entry => entry.name === this.username);
        return userIndex !== -1 ? userIndex + 1 : null;
    }
}

// Initialize on DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
    try {
        // First reset any stored session data
        resetUserSession();
        
        // Load leaderboard stylesheet
        loadStylesheet('./styles/leaderboard.css');
        
        // Create and initialize the leaderboard
        window.leaderboardManager = new LeaderboardManager();
        
        console.log('Leaderboard initialized successfully');
    } catch (error) {
        console.error('Error initializing leaderboard system:', error);
    }
});

// Export for module usage
export default LeaderboardManager;
