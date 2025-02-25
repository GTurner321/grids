// googleauth.js - Google Authentication Module

class GoogleAuth {
    constructor(sheetsApiUrl) {
        this.user = null;
        this.isLoggedIn = false;
        this.sheetsApiUrl = sheetsApiUrl; // URL to your Google Apps Script web app
        this.username = null;
        this.suggestedUsernames = [];
        this.listeners = new Set();

        // Bind methods
        this.handleAuthClick = this.handleAuthClick.bind(this);
        this.handleSignoutClick = this.handleSignoutClick.bind(this);
        this.onUserChange = this.onUserChange.bind(this);
        this.saveScore = this.saveScore.bind(this);
        this.selectUsername = this.selectUsername.bind(this);
        this.generateUsernames = this.generateUsernames.bind(this);
    }

    // Initialize Google Sign-In
    init() {
        // Add Google Sign-In script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
            // Initialize Google Identity Services client
            this.initializeGSIClient();
        };

        // Register event listener
        this.addLoginButtons();
    }

    initializeGSIClient() {
        // Initialize Google Identity Services client
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // REPLACE WITH YOUR CLIENT ID
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

    handleCredentialResponse(response) {
        // Decode the credential response
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

        // Check if user exists in our database, if not, generate usernames
        this.checkUserExists(this.user.id).then(exists => {
            if (!exists) {
                this.generateUsernames().then(usernames => {
                    this.suggestedUsernames = usernames;
                    this.showUsernameSelection();
                });
            } else {
                // Get the existing username
                this.getUserData(this.user.id).then(userData => {
                    this.username = userData.username;
                    this.onUserChange();
                });
            }
        });
    }

    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    }

    // Handle login button click
    handleAuthClick() {
        google.accounts.id.prompt();
    }

    // Handle logout button click
    handleSignoutClick() {
        this.user = null;
        this.isLoggedIn = false;
        this.username = null;
        google.accounts.id.disableAutoSelect();
        
        // Call listeners
        this.onUserChange();
        
        // Update UI
        document.getElementById('user-profile').style.display = 'none';
        document.getElementById('google-signin-button').style.display = 'block';
    }

    // Add login/logout buttons to the page
    addLoginButtons() {
        const headerElement = document.querySelector('.game-header');
        
        // Create user profile container
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
        logoutButton.addEventListener('click', this.handleSignoutClick);
        userProfileDiv.appendChild(logoutButton);
        
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
        
        // Username selection modal
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
        
        // Add elements to the page
        headerElement.appendChild(userProfileDiv);
        headerElement.appendChild(loginSection);
        document.body.appendChild(usernameModal);
        
        // Add event listener for username refresh
        document.getElementById('username-refresh').addEventListener('click', () => {
            this.generateUsernames().then(usernames => {
                this.suggestedUsernames = usernames;
                this.populateUsernameOptions();
            });
        });
    }

    // Check if user exists in our Google Sheet
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

    // Get user data from Google Sheet
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

    // Save user data to Google Sheet
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

    // Save score to Google Sheet
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

    // Generate AI usernames
    async generateUsernames() {
        try {
            const response = await fetch(`${this.sheetsApiUrl}?action=generateUsernames`);
            const data = await response.json();
            return data.usernames || [];
        } catch (error) {
            console.error('Error generating usernames:', error);
            return [
                'PuzzleMaster', 
                'MathGenius', 
                'PathFinder', 
                'GridWalker', 
                'NumberWizard'
            ];
        }
    }

    // Show username selection modal
    showUsernameSelection() {
        // Populate username options
        this.populateUsernameOptions();
        
        // Show modal
        document.getElementById('username-modal').style.display = 'flex';
    }

    // Populate username options in the modal
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

    // Select username and save user data
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
        this.onUserChange();
    }

    // Update UI when user changes
    onUserChange() {
        const userProfileDiv = document.getElementById('user-profile');
        const loginSection = document.getElementById('login-section');
        
        if (this.isLoggedIn && this.username) {
            // Update user profile
            document.getElementById('user-avatar').src = this.user.picture;
            document.getElementById('username-display').textContent = this.username;
            
            // Show user profile, hide sign-in button
            userProfileDiv.style.display = 'flex';
            loginSection.style.display = 'none';
        } else {
            // Hide user profile, show sign-in button
            userProfileDiv.style.display = 'none';
            loginSection.style.display = 'flex';
        }
        
        // Notify listeners
        this.notifyListeners();
    }

    // Add listener for user changes
    addListener(callback) {
        this.listeners.add(callback);
    }

    // Remove listener
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                isLoggedIn: this.isLoggedIn,
                username: this.username,
                user: this.user
            });
        });
    }

    // Get current user state
    getUserState() {
        return {
            isLoggedIn: this.isLoggedIn,
            username: this.username,
            user: this.user
        };
    }
    
    // Get high scores for a specific level
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
}

export default GoogleAuth;
