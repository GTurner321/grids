// leaderboard-integration.js - Optimized version with no loading indicator box

// Load CSS
function loadStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.head.appendChild(link);
}

// Reset any stored user data
function resetUserSession() {
    // Clear localStorage items related to the game
    localStorage.removeItem('pathPuzzleUsername');
    localStorage.removeItem('pathPuzzleLeaderboard');
    
    // Clear sessionStorage items too
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

// Create the leaderboard class
class LeaderboardManager {
    constructor() {
        // Reset any existing data
        resetUserSession();
    
    this.leaderboardData = [];
    this.username = '';
    this.isUsernameSet = false;
    this.maxEntries = 20;
    this.supabase = null;
    this.hasSubmittedScore = false;
    this.submissionTimestamps = new Map(); // Track submission times by score
    this.sessionHighScore = 0; // Track session high score
    this.scoreThreshold = 5000; // Only submit scores of 5000+
    this.leaderboardLoaded = false; // Track if leaderboard has been loaded
    
    // Add sessionId property for tracking the current session
    this.sessionId = null;
    
    // Pre-bind the updateScore method
    this.updateScore = debounce(this.updateScore.bind(this), 500);
    
    this.initSupabase();
    this.createLeaderboardUI();
    this.addEventListeners();
    
    // Find the scoreManager directly imported from module
    this.findScoreManager();
}
    
    async initSupabase() {
        try {
            // Try to dynamically import Supabase client
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.31.0');
            this.supabase = createClient(
                'https://zqintrlsxpdxbjspkskd.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaW50cmxzeHBkeGJqc3Brc2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjU0MTYsImV4cCI6MjA1NjQwMTQxNn0.5G1mEsD3skWtOcQ5ugmhYMfQ2obBm6kNKwnA-YH-yIw'
            );
            console.log('Supabase client initialized successfully');
            
            // Ensure the leaderboard table exists
            await this.initializeLeaderboardTable();
        } catch (error) {
            console.warn('Supabase client initialization failed:', error);
            this.supabase = null;
        }
    }
    
    async initializeLeaderboardTable() {
        if (!this.supabase) return false;
        
        try {
            // Create table via RPC
            const { error } = await this.supabase.rpc('create_leaderboard_table');
            
            if (error) {
                console.error('Error creating table via RPC:', error);
                return false;
            }
            
            console.log('Leaderboard table exists');
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
        thresholdSubtitle.textContent = 'CLICK TO REVEAL - SCORE 5000+';
        thresholdSubtitle.className = 'leaderboard-subtitle';
        thresholdSubtitle.style.fontFamily = "'Courier New', monospace";
        thresholdSubtitle.style.fontSize = '0.8rem'; // Changed from 0.8rem to match the source
        thresholdSubtitle.style.color = '#4a5568';
        thresholdSubtitle.style.textAlign = 'center';
        thresholdSubtitle.style.marginTop = '-10px';
        thresholdSubtitle.style.marginBottom = '10px'; // You might want to change this to 5px to match
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
                        console.log('LeaderboardManager submitting score:', score);
                        this.processScore(score);
                    }
                } else {
                    console.log('Puzzle already completed, not updating score again');
                }
            };
            
            // Also patch updateDisplay to emit events
            scoreManager.updateDisplay = function() {
                // Call the original function first
                originalUpdateDisplay.call(this);
                
                // Only dispatch events for completed rounds to avoid duplicate submissions
                if (this.roundComplete) {
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

        const toggleButton = document.getElementById('leaderboard-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleLeaderboardVisibility();
            });
        }
    }
    
    // New method to process scores - track session high score and determine if submission needed
    processScore(score) {
        console.log('Processing score:', score);
        
        // Check if score is a new session high score
        if (score > this.sessionHighScore) {
            this.sessionHighScore = score;
            console.log('New session high score:', score);
            
            // Only update the leaderboard UI initially for scores below threshold
            if (score < this.scoreThreshold) {
                this.showUpdateStatus(`Score tracked (needs ${this.scoreThreshold - score} more to reach leaderboard)`, 'info');
                setTimeout(() => this.hideUpdateStatus(), 3000);
                return;
            }
            
            // For scores over threshold, submit to leaderboard
            this.updateScore(score);
        } else {
            console.log('Score not higher than session high score:', this.sessionHighScore);
        }
    }
    
    // Fixed updateScore function - now a regular method
    async updateScore(score) {
        console.log('Debounced updateScore called with:', score);
        
        if (!this.isUsernameSet || score < this.scoreThreshold) {
            console.log(`Score not submitted: ${!this.isUsernameSet ? 'username not set' : 'below threshold of ' + this.scoreThreshold}`);
            return;
        }
        
        // Check if we've submitted a score recently
        const lastSubmissionTime = this.submissionTimestamps.get('lastSubmission');
        const now = Date.now();
        if (lastSubmissionTime && now - lastSubmissionTime < 10000) { // 10 seconds
            console.log('Preventing submission too soon after previous submission');
            return;
        }
        
        // Record this submission timestamp
        this.submissionTimestamps.set('lastSubmission', now);
        
        try {
            this.showUpdateStatus('Updating score...');
            
            if (this.supabase) {
                // Submit the score
                const result = await this.updateSupabaseScore(score);
                if (result) {
                    console.log('Score submitted successfully to Supabase');
                }
            } else {
                // Fallback to session-only leaderboard
                this.updateTemporaryScore(score);
                console.log('Score added to temporary leaderboard');
            }
            
            // Refresh the leaderboard display
            await this.refreshLeaderboard();
            
            // Show success message
            this.showUpdateStatus('Score added to leaderboard', 'success');
            
            // Hide status after 2 seconds
            setTimeout(() => {
                this.hideUpdateStatus();
            }, 2000);
            
        } catch (error) {
            console.error('Error updating score:', error);
            this.showUpdateStatus('Error updating score: ' + error.message, 'error');
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
                    welcomeMessage.textContent = `Hello ${username} - high scores will appear in the leaderboard below.`;
                }
                
                // Get current score and process it
                const currentScore = this.getCurrentScore();
                if (currentScore > 0) {
                    this.processScore(currentScore);
                }
                
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
                
                // Only load the leaderboard if the score is high enough or if it's already visible
                const leaderboardTable = document.getElementById('leaderboard-table');
                if (currentScore >= this.scoreThreshold || 
                    (leaderboardTable && !leaderboardTable.classList.contains('hidden'))) {
                    this.refreshLeaderboard();
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
    this.hasSubmittedScore = false; // Reset submission status for new username
    
    // Generate a new session ID for this username
    this.sessionId = `${username}-${Date.now()}`;
    console.log('New session created with ID:', this.sessionId);
}
    
    getCurrentScore() {
        try {
            // Try to get score from multiple places
            if (window.scoreManager) {
                return window.scoreManager.totalScore || 0;
            }
        } catch (error) {
            console.error('Error getting current score:', error);
        }
        return 0;
    }
    
    async updateSupabaseScore(score) {
    if (!this.supabase) return false;
    
    try {
        // Get current date/time
        const now = new Date().toISOString();
        
        // Create a session ID if we don't have one yet
        if (!this.sessionId) {
            // Generate a session ID based on username and timestamp
            this.sessionId = `${this.username}-${Date.now()}`;
            console.log('Created new session ID:', this.sessionId);
        }
        
        // First check if this user already has a score in this session
        const { data: sessionScores, error: sessionCheckError } = await this.supabase
            .from('leaderboard_entries')
            .select('id, score')
            .eq('name', this.username)
            .eq('session_id', this.sessionId)
            .order('score', { ascending: false });
            
        if (sessionCheckError) {
            console.error('Error checking for session entries:', sessionCheckError);
            throw sessionCheckError;
        }
        
        // If user already has entries from this session
        if (sessionScores && sessionScores.length > 0) {
            const highestSessionScore = sessionScores[0].score;
            
            // If they already have a higher score in this session, don't update
            if (highestSessionScore >= score) {
                console.log('User already has a higher score in this session:', highestSessionScore);
                return true; // Return true to avoid showing error
            }
            
            // New high score for this session - delete previous session entries
            console.log('Removing previous session scores for this user');
            
            // Delete all previous entries from this session
            const { error: deleteError } = await this.supabase
                .from('leaderboard_entries')
                .delete()
                .eq('session_id', this.sessionId);
                
            if (deleteError) {
                console.error('Error deleting session entries:', deleteError);
                // Continue anyway to insert the new score
            }
        }
        
        // Insert the new entry with the session ID
        const { error: insertError } = await this.supabase
            .from('leaderboard_entries')
            .insert([{
                name: this.username,
                score: score,
                created_at: now,
                session_id: this.sessionId
            }]);
                
        if (insertError) {
            console.error('Error inserting score to Supabase:', insertError);
            throw insertError;
        }
        
        console.log('Score added successfully to Supabase');
        return true;
    } catch (error) {
        console.error('Error updating Supabase score:', error);
        throw error;
    }
}
    
    updateTemporaryScore(score) {
        // Always add a new entry for this session (allows multiple entries per username)
        const now = new Date();
        const entry = {
            name: this.username,
            score: score,
            date: now.toISOString()
        };
        
        // Add the new entry
        this.leaderboardData.push(entry);
        
        // Sort and trim to maintain top scores
        this.leaderboardData.sort((a, b) => b.score - a.score);
        this.leaderboardData = this.leaderboardData.slice(0, this.maxEntries);
        
        this.renderLeaderboard();
        console.log('Score added to temporary leaderboard');
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

    toggleLeaderboardVisibility() {
        const leaderboardTable = document.getElementById('leaderboard-table');
        const toggleButton = document.getElementById('leaderboard-toggle');
        
        if (leaderboardTable) {
            const isHidden = leaderboardTable.classList.contains('hidden');
            
            if (isHidden) {
                // Show the leaderboard
                leaderboardTable.classList.remove('hidden');
                
                // Add active class to button to flip arrow
                if (toggleButton) {
                    toggleButton.classList.add('active');
                }
                
                // Show a loading message within the leaderboard table itself
                leaderboardTable.innerHTML = '<div class="leaderboard-row" style="justify-content: center; padding: 20px;">Loading leaderboard data...</div>';
                
                // Refresh the leaderboard data
                this.refreshLeaderboard();
            } else {
                // Hide the leaderboard
                leaderboardTable.classList.add('hidden');
                
                // Remove active class from button
                if (toggleButton) {
                    toggleButton.classList.remove('active');
                }
            }
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
            // Only load from Supabase if data isn't loaded yet or if we're forcing a refresh
            if (this.supabase && (!this.leaderboardLoaded || this.forceRefresh)) {
                await this.loadFromSupabase();
                this.leaderboardLoaded = true;
                this.forceRefresh = false;
            }
            
            // Render the leaderboard with whatever data we have
            this.renderLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            
            // If there was an error, still try to render what we have
            this.renderLeaderboard();
            
            // Show error message in the leaderboard
            const leaderboardTable = document.getElementById('leaderboard-table');
            if (leaderboardTable && leaderboardTable.childElementCount === 0) {
                leaderboardTable.innerHTML = '<div class="leaderboard-row" style="justify-content: center; padding: 20px; color: #e53e3e;">Error loading leaderboard data. Please try again later.</div>';
            }
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
            .gte('score', this.scoreThreshold) // Only fetch scores meeting the threshold
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
        
        console.log('Loaded leaderboard data from Supabase:', this.leaderboardData.length, 'entries');
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
