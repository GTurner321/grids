// leaderboard-integration.js - Modified to work with Supabase without user persistence

// Load CSS
function loadStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.head.appendChild(link);
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
            
            console.log('Completed puzzle, total score:', this.totalScore);
            
            // Ensure score is updated in leaderboard if username is set
            if (window.leaderboardManager && window.leaderboardManager.isUsernameSet) {
                console.log('Updating score via completePuzzle');
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
        this.supabase = null;
        
        this.initSupabase();
        this.loadLeaderboard();
        this.createLeaderboardUI();
        this.addEventListeners();
    }
    
    async initSupabase() {
        try {
            // Try to dynamically import Supabase client
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js');
            this.supabase = createClient(
                'https://zqintrlsxpdxbjspkskd.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaW50cmxzeHBkeGJqc3Brc2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjU0MTYsImV4cCI6MjA1NjQwMTQxNn0.5G1mEsD3skWtOcQ5ugmhYMfQ2obBm6kNKwnA-YH-yIw'
            );
            console.log('Supabase client initialized successfully');
            
            // Ensure the leaderboard table exists
            await this.initializeLeaderboardTable();
        } catch (error) {
            console.warn('Supabase client initialization failed, will use local storage:', error);
            this.supabase = null;
        }
    }
    
    async initializeLeaderboardTable() {
        if (!this.supabase) return false;
        
        try {
            // Check if table exists by attempting to query it
            const { error } = await this.supabase
                .from('leaderboard_entries')
                .select('id')
                .limit(1);
                
            if (error && error.code === '42P01') {
                // Table doesn't exist, try to create it via RPC
                console.log('Leaderboard table does not exist, creating...');
                const { error: rpcError } = await this.supabase.rpc('create_leaderboard_table');
                
                if (rpcError) {
                    console.error('Error creating table via RPC:', rpcError);
                    return false;
                }
                
                console.log('Leaderboard table created successfully via RPC');
            } else if (error) {
                console.error('Error checking leaderboard table:', error);
                return false;
            } else {
                console.log('Leaderboard table exists');
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing leaderboard table:', error);
            return false;
        }
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
        
        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'leaderboard-loading';
        loadingIndicator.className = 'leaderboard-loading';
        loadingIndicator.textContent = 'Loading leaderboard...';
        
        const leaderboardTable = document.createElement('div');
        leaderboardTable.className = 'leaderboard-table';
        leaderboardTable.id = 'leaderboard-table';
        
        // Add all elements to the leaderboard section
        leaderboardSection.appendChild(usernameArea);
        leaderboardSection.appendChild(leaderboardTitle);
        leaderboardSection.appendChild(loadingIndicator);
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
            console.log('Score updated event fired:', score);
            if (this.isUsernameSet) {
                console.log('Username is set, updating score:', this.username, score);
                this.updateScore(score);
            } else {
                console.log('Username not set, not updating score');
            }
        });
        
        // Set up periodic refresh every 60 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refreshLeaderboard();
            }
        }, 60000);
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
                // Try to use the username checker module
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
                    welcomeMessage.textContent = `Hello ${username} - your score will appear in the leaderboard below.`;
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
        // No longer storing in localStorage to reset on page refresh
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
    
    async updateScore(score) {
        console.log('updateScore called with:', score);
        
        if (!this.isUsernameSet || score <= 0) {
            console.log('Score not updated: username not set or score <= 0');
            return;
        }
        
        try {
            this.showUpdateStatus('Updating score...');
            
            if (this.supabase) {
                // Try to update score in Supabase
                await this.updateSupabaseScore(score);
            } else {
                // Fallback to session storage (not localStorage)
                console.log('Using session storage for score update');
                this.updateSessionScore(score);
            }
            
            // Refresh the leaderboard display
            await this.refreshLeaderboard();
            
            // Show success message
            this.showUpdateStatus('Score updated successfully', 'success');
            
            // Hide status after 2 seconds
            setTimeout(() => {
                this.hideUpdateStatus();
            }, 2000);
            
        } catch (error) {
            console.error('Error updating score:', error);
            this.showUpdateStatus('Error updating score', 'error');
        }
    }
    
    async updateSupabaseScore(score) {
        if (!this.supabase) return false;
        
        try {
            // Get current date/time
            const now = new Date().toISOString();
            
            // Insert new entry (we don't need to check for existing entries
            // since we don't store username between sessions)
            const { error: insertError } = await this.supabase
                .from('leaderboard_entries')
                .insert([
                    { 
                        name: this.username, 
                        score: score, 
                        created_at: now
                    }
                ]);
            
            if (insertError) {
                console.error('Error inserting score:', insertError);
                throw insertError;
            }
            
            console.log('Score added successfully to Supabase');
            return true;
            
        } catch (error) {
            console.error('Error updating Supabase score:', error);
            // Throw to trigger fallback to session storage
            throw error;
        }
    }
    
    updateSessionScore(score) {
        // Use session storage instead of localStorage
        const now = new Date();
        const entry = {
            name: this.username,
            score: score,
            date: now.toISOString()
        };
        
        // Get existing session data
        let sessionData = [];
        try {
            const storedData = sessionStorage.getItem('pathPuzzleLeaderboard');
            sessionData = storedData ? JSON.parse(storedData) : [];
        } catch (e) {
            console.error('Error parsing session storage:', e);
        }
        
        // Always add the new entry
        sessionData.push(entry);
        
        // Sort and limit entries
        sessionData.sort((a, b) => b.score - a.score);
        sessionData = sessionData.slice(0, this.maxEntries);
        
        // Save to session storage
        sessionStorage.setItem('pathPuzzleLeaderboard', JSON.stringify(sessionData));
        
        // Add to leaderboard data for display
        this.leaderboardData.push(entry);
        this.leaderboardData.sort((a, b) => b.score - a.score);
        this.leaderboardData = this.leaderboardData.slice(0, this.maxEntries);
        
        this.renderLeaderboard();
    }
    
    showUpdateStatus(message, type = 'info') {
        const statusEl = document.getElementById('leaderboard-status');
        if (!statusEl) {
            const newStatusEl = document.createElement('div');
            newStatusEl.id = 'leaderboard-status';
            newStatusEl.className = `leaderboard-status ${type}`;
            newStatusEl.textContent = message;
            
            const leaderboardTable = document.getElementById('leaderboard-table');
            if (leaderboardTable && leaderboardTable.parentNode) {
                leaderboardTable.parentNode.insertBefore(newStatusEl, leaderboardTable);
            }
        } else {
            statusEl.className = `leaderboard-status ${type}`;
            statusEl.textContent = message;
            statusEl.style.display = 'block';
        }
    }
    
    hideUpdateStatus() {
        const statusEl = document.getElementById('leaderboard-status');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }
    
    async refreshLeaderboard() {
        try {
            await this.loadLeaderboard();
            return true;
        } catch (error) {
            console.error('Error refreshing leaderboard:', error);
            return false;
        }
    }
    
    async loadLeaderboard() {
        try {
            // Show loading state
            const loadingIndicator = document.getElementById('leaderboard-loading');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            if (this.supabase) {
                // Try to load from Supabase
                await this.loadFromSupabase();
            } else {
                // Fallback to session storage
                this.loadFromSessionStorage();
            }
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Render the leaderboard
            this.renderLeaderboard();
            
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            
            // Fallback to session storage
            this.loadFromSessionStorage();
            
            // Hide loading indicator
            const loadingIndicator = document.getElementById('leaderboard-loading');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Render whatever data we have
            this.renderLeaderboard();
        }
    }
    
    async loadFromSupabase() {
        if (!this.supabase) throw new Error('Supabase client not initialized');
        
        // Get current date minus 7 days for filtering
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString();
        
        // Fetch leaderboard entries from Supabase
        const { data, error } = await this.supabase
            .from('leaderboard_entries')
            .select('*')
            .gte('created_at', cutoffDate)
            .order('score', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Error fetching from Supabase:', error);
            throw error;
        }
        
        this.leaderboardData = data.map(entry => ({
            name: entry.name,
            score: entry.score,
            date: entry.created_at
        }));
        
        console.log('Loaded leaderboard data from Supabase:', this.leaderboardData);
    }
    
    loadFromSessionStorage() {
        try {
            // Use session storage instead of localStorage
            const storedData = sessionStorage.getItem('pathPuzzleLeaderboard');
            this.leaderboardData = storedData ? JSON.parse(storedData) : [];
            
            // Sort by score
            this.leaderboardData.sort((a, b) => b.score - a.score);
            
            console.log('Loaded leaderboard data from sessionStorage:', this.leaderboardData);
        } catch (error) {
            console.error('Error loading from sessionStorage:', error);
            this.leaderboardData = [];
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
        // Load leaderboard stylesheet
        loadStylesheet('./styles/leaderboard.css');
        
        // Create and initialize the leaderboard
        window.leaderboardManager = new LeaderboardManager();
        
        // Patch score manager
        patchScoreManager();
        
        console.log('Leaderboard initialized successfully');
    } catch (error) {
        console.error('Error initializing leaderboard system:', error);
    }
});
