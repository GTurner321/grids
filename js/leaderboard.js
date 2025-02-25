// leaderboard.js - Standalone leaderboard and authentication system
// This doesn't modify the core game functionality

class LeaderboardSystem {
    constructor(sheetsApiUrl) {
        // Auth state
        this.user = null;
        this.isLoggedIn = false;
        this.username = null;
        this.suggestedUsernames = [];
        
        // Configuration
        this.sheetsApiUrl = sheetsApiUrl; // URL to your Google Apps Script web app
        
        // Initialize UI elements
        this.createUIElements();
        
        // Load Google Sign-In API
        this.loadGoogleAPI();
    }
    
    // Load Google Sign-In API script
    loadGoogleAPI() {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        script.onload = () => {
            this.initGoogleAuth();
        };
    }
    
    // Initialize Google Auth
    initGoogleAuth() {
        if (!window.google) {
            console.error('Google API not loaded');
            return;
        }
        
        // Initialize Google Identity Services client
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // REPLACE with your client ID
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        // Display the Sign In With Google button
        google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large', width: 240 }
        );
    }
    
    // Handle Google Sign-In response
    handleCredentialResponse(response) {
        const credential = response.credential;
        const payload = this.parseJwt(credential);
        
        this.user = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            token: credential
        };
        
        this.isLoggedIn = true;
        
        // Check if user exists, otherwise show username selection
        this.checkUserExists(this.user.id).then(exists => {
            if (!exists) {
                this.generateUsernames().then(usernames => {
                    this.suggestedUsernames = usernames;
                    this.showUsernameSelection();
                });
            } else {
                // Get existing username
                this.getUserData(this.user.id).then(userData => {
                    this.username = userData.username;
                    this.updateUI();
                });
            }
        });
    }
    
    // Parse JWT token from Google Sign-In
    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    }
    
    // Create UI elements for auth and leaderboard
    createUIElements() {
        // Create auth container
        const headerElement = document.querySelector('.game-header');
        
        // Create login section
        const loginSection = document.createElement('div');
        loginSection.id = 'login-section';
        loginSection.style.display = 'flex';
        loginSection.style.flexDirection = 'column';
        loginSection.style.alignItems = 'center';
        loginSection.style.marginBottom = '10px';
        
        // Add a label
        const loginLabel = document.createElement('div');
        loginLabel.textContent = 'Sign in to save scores:';
        loginLabel.style.fontSize = '0.8rem';
        loginLabel.style.marginBottom = '5px';
        loginLabel.style.fontFamily = 'monospace';
        loginSection.appendChild(loginLabel);
        
        // Google Sign-in button container
        const signInButtonDiv = document.createElement('div');
        signInButtonDiv.id = 'google-signin-button';
        loginSection.appendChild(signInButtonDiv);
        
        // User profile container (hidden by default)
        const userProfileDiv = document.createElement('div');
        userProfileDiv.id = 'user-profile';
        userProfileDiv.style.display = 'none';
        userProfileDiv.style.marginBottom = '10px';
        userProfileDiv.style.display = 'flex';
        userProfileDiv.style.alignItems = 'center';
        userProfileDiv.style.justifyContent = 'center';
        userProfileDiv.style.gap = '10px';
        
        // User avatar
        const userAvatar = document.createElement('img');
        userAvatar.id = 'user-avatar';
        userAvatar.style.width = '32px';
        userAvatar.style.height = '32px';
        userAvatar.style.borderRadius = '50%';
        userProfileDiv.appendChild(userAvatar);
        
        // Username display
        const usernameSpan = document.createElement('span');
        usernameSpan.id = 'username-display';
        usernameSpan.style.fontFamily = 'monospace';
        usernameSpan.style.fontWeight = 'bold';
        userProfileDiv.appendChild(usernameSpan);
        
        // Logout button
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Sign Out';
        logoutButton.style.fontSize = '0.8rem';
        logoutButton.style.padding = '4px 8px';
        logoutButton.addEventListener('click', this.handleSignOut.bind(this));
        userProfileDiv.appendChild(logoutButton);
        
        // Add elements to header
        headerElement.appendChild(userProfileDiv);
        headerElement.appendChild(loginSection);
        
        // Create username selection modal
        const usernameModal = document.createElement('div');
        usernameModal.id = 'username-modal';
        usernameModal.className = 'rules-modal';
        usernameModal.style.display = 'none';
        
        usernameModal.innerHTML = `
            <div class="rules-content" style="max-width: 320px;">
                <h2 class="rules-title">Choose Your Username</h2>
                <div id="username-options" class="rules-section">
                    <p>Loading suggestions...</p>
                </div>
                <div class="rules-button-container">
                    <button id="username-refresh" class="level-btn">
                        More Options
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(usernameModal);
        
        // Add refresh button listener
        document.getElementById('username-refresh').addEventListener('click', () => {
            this.generateUsernames().then(usernames => {
                this.suggestedUsernames = usernames;
                this.populateUsernameOptions();
            });
        });
        
        // Create leaderboard button
        const controlsContainer = document.querySelector('.game-controls');
        const leaderboardButton = document.createElement('button');
        leaderboardButton.id = 'leaderboard-btn';
        leaderboardButton.style.display = 'none'; // Hidden by default
        
        leaderboardButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Leaderboard
        `;
        
        leaderboardButton.addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        controlsContainer.appendChild(leaderboardButton);
        
        // Create leaderboard modal
        const leaderboardModal = document.createElement('div');
        leaderboardModal.id = 'leaderboard-modal';
        leaderboardModal.className = 'rules-modal';
        leaderboardModal.style.display = 'none';
        
        leaderboardModal.innerHTML = `
            <div class="rules-content">
                <h2 class="rules-title">LEADERBOARD</h2>
                <div class="level-buttons">
                    <button type="button" class="level-btn leaderboard-level-btn" data-level="1">L1</button>
                    <button type="button" class="level-btn leaderboard-level-btn" data-level="2">L2</button>
                    <button type="button" class="level-btn leaderboard-level-btn" data-level="3">L3</button>
                    <button type="button" class="level-btn leaderboard-level-btn" data-level="4">L4</button>
                    <button type="button" class="level-btn leaderboard-level-btn" data-level="5">L5</button>
                </div>
                <div id="leaderboard-content" class="rules-section">
                    <p>Loading scores...</p>
                </div>
                <div class="rules-button-container">
                    <button id="close-leaderboard" class="start-button">
                        CLOSE
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(leaderboardModal);
        
        // Add event listeners
        document.getElementById('close-leaderboard').addEventListener('click', () => {
            leaderboardModal.style.display = 'none';
        });
        
        // Add level button listeners
        document.querySelectorAll('.leaderboard-level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.loadLeaderboardScores(level);
                
                // Update active button
                document.querySelectorAll('.leaderboard-level-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
            });
        });
        
        // Add score listener
        this.setupScoreListener();
    }
    
    // Listen for game completions to save scores
    setupScoreListener() {
        // Check for game completions by observing DOM changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    const scoreBonusElement = document.getElementById('score-bonus');
                    const gameMessagesElement = document.getElementById('game-messages');
                    
                    // Check if a puzzle was just completed (score bonus is visible)
                    if (scoreBonusElement && scoreBonusElement.style.visibility === 'visible') {
                        // Get current level and score
                        const levelIndicator = document.querySelector('.level-btn.active');
                        if (!levelIndicator) return;
                        
                        const level = parseInt(levelIndicator.dataset.level);
                        const scoreText = scoreBonusElement.textContent;
                        const totalScore = document.getElementById('score-total').textContent;
                        
                        // Extract the score from the format: "basePoints + timeBonus = totalScore"
                        const match = scoreText.match(/\= (\d+)$/);
                        if (!match) return;
                        
                        const score = parseInt(match[1]);
                        
                        // If user is logged in, save score
                        if (this.isLoggedIn && this.username) {
                            this.saveScore(level, score).then(success => {
                                if (success) {
                                    // Show success message
                                    this.showToast('Score saved to leaderboard!');
                                    
                                    // Show leaderboard after a delay
                                    setTimeout(() => {
                                        this.showLeaderboard(level);
                                    }, 2000);
                                }
                            });
                        } else {
                            // Prompt to sign in
                            this.showToast('Sign in to save scores and see leaderboards!');
                        }
                    }
                }
            });
        });
        
        // Observe the game board for changes
        observer.observe(document.querySelector('main.game-board'), {
            childList: true,
            subtree: true,
            attributes: true
        });
    }
    
    // Show toast message
    showToast(message, duration = 3000) {
        const messageElement = document.getElementById('game-messages');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = 'message-box info';
            
            // Clear after duration
            setTimeout(() => {
                if (messageElement.textContent === message) {
                    messageElement.textContent = '';
                    messageElement.className = 'message-box';
                }
            }, duration);
        }
    }
    
    // Handle sign out
    handleSignOut() {
        this.user = null;
        this.isLoggedIn = false;
        this.username = null;
        
        if (window.google) {
            google.accounts.id.disableAutoSelect();
        }
        
        this.updateUI();
    }
    
    // Update UI based on auth state
    updateUI() {
        const userProfileDiv = document.getElementById('user-profile');
        const loginSection = document.getElementById('login-section');
        const leaderboardButton = document.getElementById('leaderboard-btn');
        
        if (this.isLoggedIn && this.username) {
            // Update user profile
            document.getElementById('user-avatar').src = this.user.picture;
            document.getElementById('username-display').textContent = this.username;
            
            // Show user profile, hide login section
            userProfileDiv.style.display = 'flex';
            loginSection.style.display = 'none';
            
            // Show leaderboard button
            leaderboardButton.style.display = 'block';
        } else {
            // Hide user profile, show login section
            userProfileDiv.style.display = 'none';
            loginSection.style.display = 'flex';
            
            // Hide leaderboard button
            leaderboardButton.style.display = 'none';
        }
    }
    
    // Show username selection modal
    showUsernameSelection() {
        this.populateUsernameOptions();
        document.getElementById('username-modal').style.display = 'flex';
    }
    
    // Populate username options
    populateUsernameOptions() {
        const optionsContainer = document.getElementById('username-options');
        optionsContainer.innerHTML = '';
        
        this.suggestedUsernames.forEach(username => {
            const button = document.createElement('button');
            button.className = 'level-btn';
            button.style.margin = '5px';
            button.style.width = '100%';
            button.textContent = username;
            button.addEventListener('click', () => this.selectUsername(username));
            optionsContainer.appendChild(button);
        });
    }
    
    // Select a username
    async selectUsername(username) {
        this.username = username;
        
        // Save user data
        const userData = {
            userId: this.user.id,
            email: this.user.email,
            name: this.user.name,
            username: username,
            created: new Date().toISOString()
        };
        
        await this.saveUserData(userData);
        
        // Hide modal
        document.getElementById('username-modal').style.display = 'none';
        
        // Update UI
        this.updateUI();
    }
    
    // Show leaderboard
    async showLeaderboard(level = 1) {
        const modal = document.getElementById('leaderboard-modal');
        if (!modal) return;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Set active level button
        document.querySelectorAll('.leaderboard-level-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
        });
        
        // Load scores for the selected level
        await this.loadLeaderboardScores(level);
    }
    
    // Load leaderboard scores
    async loadLeaderboardScores(level) {
        const contentElement = document.getElementById('leaderboard-content');
        if (!contentElement) return;
        
        // Show loading
        contentElement.innerHTML = '<p>Loading scores...</p>';
        
        try {
            // Get high scores
            const scores = await this.getHighScores(level);
            
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
                const isCurrentUser = this.username === score.username;
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
    
    // API METHODS
    
    // Check if user exists
    async checkUserExists(userId) {
        try {
            const response = await fetch(`${this.sheetsApiUrl}?action=checkUser&userId=${userId}`);
            const data = await response.json();
            return data.exists;
        } catch (error) {
            console.error('Error checking if user exists:', error);
            return false;
        }
    }
    
    // Get user data
    async getUserData(userId) {
        try {
            const response = await fetch(`${this.sheetsApiUrl}?action=getUserData&userId=${userId}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }
    
    // Save user data
    async saveUserData(userData) {
        try {
            const response = await fetch(this.sheetsApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'saveUser',
                    data: userData
                }),
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }
    
    // Save score
    async saveScore(level, score) {
        if (!this.isLoggedIn || !this.username) {
            console.warn('User not logged in or username not set');
            return false;
        }
        
        try {
            const scoreData = {
                userId: this.user.id,
                username: this.username,
                level: level,
                score: score,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(this.sheetsApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'saveScore',
                    data: scoreData
                }),
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error saving score:', error);
            return false;
        }
    }
    
    // Get high scores
    async getHighScores(level) {
        try {
            const response = await fetch(`${this.sheetsApiUrl}?action=getHighScores&level=${level}`);
            const data = await response.json();
            return data.scores || [];
        } catch (error) {
            console.error('Error getting high scores:', error);
            return [];
        }
    }
    
    // Generate usernames
    async generateUsernames() {
        try {
            const response = await fetch(`${this.sheetsApiUrl}?action=generateUsernames`);
            const data = await response.json();
            return data.usernames || [];
        } catch (error) {
            console.error('Error generating usernames:', error);
            return [
                'PuzzleMaster' + Math.floor(Math.random() * 100), 
                'MathGenius' + Math.floor(Math.random() * 100), 
                'PathFinder' + Math.floor(Math.random() * 100), 
                'GridWalker' + Math.floor(Math.random() * 100), 
                'NumberWizard' + Math.floor(Math.random() * 100)
            ];
        }
    }
}

// Initialize leaderboard system when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Initialize the leaderboard system with your Apps Script URL
    window.leaderboardSystem = new LeaderboardSystem('https://script.google.com/macros/s/AKfycbw1Va9YfX2Pehg6MQbNK6dJCIRnCHkmnS1G1YHFPwDVSM7lki_bpD0hV87I-v0vTz0oYw/exec');
});
