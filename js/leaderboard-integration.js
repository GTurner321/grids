// leaderboard-integration.js - Updated with UI improvements

import supabaseLeaderboard from 'https://gturner321.github.io/grids/js/supabase-leaderboard.js';

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
        this.sessionId = null;
        this.sessionHighScore = 0; // Track session high score
        this.scoreThreshold = 5000; // Only submit scores of 5000+
        this.leaderboardLoaded = false; // Track if leaderboard has been loaded
        this.leaderboardVisible = false; // Track if leaderboard is visible
        this.lastSubmissionTime = 0; // Track last submission time
        
        // Pre-bind methods
        this.updateScore = debounce(this.updateScore.bind(this), 300);
        this.processScore = this.processScore.bind(this);
        
        this.initializeUI();
        this.initSupabase();
        this.addEventListeners();
        this.findScoreManager();
        this.initLevelButtonHandlers(); // Initialize level button handlers

        setTimeout(() => {
            const gameContainer = document.querySelector('.game-container');
            const bottomButtons = document.querySelector('.bottom-buttons');
                if (gameContainer && gameContainer.classList.contains('game-active') && bottomButtons) {
                    bottomButtons.style.display = 'flex';
                    bottomButtons.style.visibility = 'visible';
                    bottomButtons.style.opacity = '1';
                }
        }, 500);
    
    }
    
    initializeUI() {
    // Add bottom buttons container
    this.createBottomButtons();
    
    // Create username submission area
    this.createUsernameSubmissionArea();
    
    // Create leaderboard table
    this.createLeaderboardTable();
    
    // Setup an observer to ensure buttons stay visible
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && 
                    gameContainer.classList.contains('game-active')) {
                    const bottomButtons = document.querySelector('.bottom-buttons');
                    if (bottomButtons) {
                        bottomButtons.style.display = 'flex';
                        
                        // If username is already set, apply button styling
                        if (this.isUsernameSet) {
                            this.handleButtonsAfterSubmission();
                        }
                    }
                }
            });
        });
        
        observer.observe(gameContainer, { attributes: true });
    }
}
    
    createBottomButtons() {
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'bottom-buttons';
        
        // Record Name Button (changed from "Record Score")
        const recordScoreButton = document.createElement('button');
        recordScoreButton.id = 'record-score-btn';
        recordScoreButton.className = 'bottom-btn';
        recordScoreButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            RECORD NAME
        `;
        
        // Leaderboard Button
        const leaderboardButton = document.createElement('button');
        leaderboardButton.id = 'leaderboard-btn';
        leaderboardButton.className = 'bottom-btn';
        leaderboardButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"></path>
            </svg>
            LEADERBOARD
        `;
        
        buttonsContainer.appendChild(recordScoreButton);
        buttonsContainer.appendChild(leaderboardButton);
        
        gameContainer.appendChild(buttonsContainer);
    }
    
    createUsernameSubmissionArea() {
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        
        // Create username area container
        const usernameAreaContainer = document.createElement('div');
        usernameAreaContainer.id = 'username-area-container';
        usernameAreaContainer.style.display = 'none';
        usernameAreaContainer.style.marginTop = '10px';
        usernameAreaContainer.style.width = '100%';
        usernameAreaContainer.style.maxWidth = '400px';
        usernameAreaContainer.style.margin = '10px auto';
        
        // Username submission area
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
        
        const returnButton = document.createElement('button');
        returnButton.id = 'return-to-record-btn';
        returnButton.innerHTML = '&#9650;'; // Upwards triangle
        returnButton.style.background = 'none';
        returnButton.style.border = 'none';
        returnButton.style.color = '#3b82f6';
        returnButton.style.fontSize = '24px';
        returnButton.style.cursor = 'pointer';
        returnButton.style.marginTop = '10px';
        returnButton.style.transition = 'color 0.2s ease';
        
        const statusMessage = document.createElement('div');
        statusMessage.id = 'username-status';
        statusMessage.className = 'status-message';
        
        inputWrapper.appendChild(usernameInput);
        inputWrapper.appendChild(submitButton);
        
        usernameForm.appendChild(usernamePrompt);
        usernameForm.appendChild(inputWrapper);
        usernameForm.appendChild(statusMessage);
        usernameForm.appendChild(returnButton);
        
        usernameArea.appendChild(usernameForm);
        usernameAreaContainer.appendChild(usernameArea);
        
        gameContainer.appendChild(usernameAreaContainer);
    }
    
    createLeaderboardTable() {
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        
        // Create leaderboard table container
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.id = 'leaderboard-table-container';
        leaderboardContainer.style.display = 'none';
        leaderboardContainer.style.marginTop = '10px';
        leaderboardContainer.style.width = '100%';
        
        // Create the table div
        const leaderboardTable = document.createElement('div');
        leaderboardTable.className = 'leaderboard-table';
        leaderboardTable.id = 'leaderboard-table';
        
        leaderboardContainer.appendChild(leaderboardTable);
        
        // Add return button to the leaderboard
        const returnButton = document.createElement('button');
        returnButton.id = 'return-from-leaderboard-btn';
        returnButton.innerHTML = '&#9650;'; // Upwards triangle
        returnButton.style.background = 'none';
        returnButton.style.border = 'none';
        returnButton.style.color = '#3b82f6';
        returnButton.style.fontSize = '24px';
        returnButton.style.cursor = 'pointer';
        returnButton.style.marginTop = '10px';
        returnButton.style.transition = 'color 0.2s ease';
        returnButton.style.display = 'block';
        returnButton.style.margin = '10px auto';
        
        leaderboardContainer.appendChild(returnButton);
        gameContainer.appendChild(leaderboardContainer);
    }
    
    addEventListeners() {
        const recordScoreBtn = document.getElementById('record-score-btn');
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        const usernameAreaContainer = document.getElementById('username-area-container');
        const leaderboardTableContainer = document.getElementById('leaderboard-table-container');
        const returnToRecordBtn = document.getElementById('return-to-record-btn');
        const returnFromLeaderboardBtn = document.getElementById('return-from-leaderboard-btn');
        const submitUsernameBtn = document.getElementById('submit-username');
        
        // Record Score Button Click - Toggle behavior
        recordScoreBtn.addEventListener('click', () => {
            if (!this.isUsernameSet) {
                // Toggle visibility of username area
                if (usernameAreaContainer.style.display === 'block') {
                    usernameAreaContainer.style.display = 'none';
                } else {
                    usernameAreaContainer.style.display = 'block';
                    leaderboardTableContainer.style.display = 'none'; // Hide leaderboard if open
                }
            }
        });
        
        // Leaderboard Button Click - Toggle behavior
        leaderboardBtn.addEventListener('click', () => {
            if (leaderboardTableContainer.style.display === 'block') {
                leaderboardTableContainer.style.display = 'none';
            } else {
                leaderboardTableContainer.style.display = 'block';
                usernameAreaContainer.style.display = 'none'; // Hide username area if open
                this.loadLeaderboard(); // Load fresh data when opening
            }
        });
        
        // Return to Record Button Click
        if (returnToRecordBtn) {
            returnToRecordBtn.addEventListener('click', () => {
                usernameAreaContainer.style.display = 'none';
            });
        }
        
        // Return from Leaderboard Button Click
        if (returnFromLeaderboardBtn) {
            returnFromLeaderboardBtn.addEventListener('click', () => {
                leaderboardTableContainer.style.display = 'none';
            });
        }
        
        // Submit Username Button Click
        if (submitUsernameBtn) {
            submitUsernameBtn.addEventListener('click', () => {
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
            
            // Conditionally process score based on username set status
            if (!this.isUsernameSet && score >= this.scoreThreshold) {
                recordScoreBtn.classList.add('highlight');
            }
        });
    }
    
    // Initialize level button click handlers
    initLevelButtonHandlers() {
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', this.handleLevelButtonClick, { once: true }); // Only trigger once
        });
    }
    
    // Handle level button click to hide the level selector title
    handleLevelButtonClick() {
        const levelSelectorTitle = document.querySelector('.level-selector-title');
        if (levelSelectorTitle) {
            levelSelectorTitle.style.transition = 'opacity 0.5s ease-out';
            levelSelectorTitle.style.opacity = '0';
            
            // After transition, hide the element
            setTimeout(() => {
                levelSelectorTitle.style.display = 'none';
            }, 500);
        }
    }
    
    toggleLeaderboard() {
        const leaderboardTableContainer = document.getElementById('leaderboard-table-container');
        const usernameAreaContainer = document.getElementById('username-area-container');
        
        if (leaderboardTableContainer.style.display === 'none') {
            // Show leaderboard
            leaderboardTableContainer.style.display = 'block';
            usernameAreaContainer.style.display = 'none';
            
            // Load leaderboard data
            this.loadLeaderboard();
        } else {
            // Hide leaderboard
            leaderboardTableContainer.style.display = 'none';
        }
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
            
            // Also patch updateDisplay to emit events and update username display
            scoreManager.updateDisplay = function() {
                // Call the original function first
                originalUpdateDisplay.call(this);
                
                // If round is complete, show round score (red)
                // Otherwise, show username (gray) if available
                const scoreBonusElement = document.getElementById('score-bonus');
                if (scoreBonusElement) {
                    if (!this.roundComplete && window.leaderboardManager && window.leaderboardManager.username) {
                        scoreBonusElement.textContent = window.leaderboardManager.username;
                        scoreBonusElement.style.color = '#6b7280'; // Gray color
                        scoreBonusElement.style.visibility = 'visible';
                    }
                }
                
                // Dispatch score updated event regardless of round completion
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
            
            return true;
        } catch (error) {
            console.error('Error patching ScoreManager:', error);
            return false;
        }
    }

    processScore(score) {
        console.log('Processing score:', score);
        
        // Always update session high score if it's higher
        if (score > this.sessionHighScore) {
            this.sessionHighScore = score;
            console.log('New session high score:', score);
            
            // For scores below threshold, just show a message
            if (score < this.scoreThreshold) {
                this.showUpdateStatus(`Score tracked (needs ${this.scoreThreshold - score} more to reach leaderboard)`, 'info');
                setTimeout(() => this.hideUpdateStatus(), 3000);
                return;
            }
            
            // For scores over threshold, submit to leaderboard
            this.updateScore(score);
        } else if (score >= this.scoreThreshold && this.leaderboardVisible) {
            // If leaderboard is visible and score is above threshold, refresh leaderboard
            // even if it's not a new high score
            this.refreshLeaderboard();
        }
    }
    
    async updateScore(score) {
        console.log('updateScore called with:', score);
        
        if (!this.isUsernameSet || score < this.scoreThreshold) {
            console.log(`Score not submitted: ${!this.isUsernameSet ? 'username not set' : 'below threshold of ' + this.scoreThreshold}`);
            return;
        }
        
        // Throttle submissions to avoid API rate limits
        const now = Date.now();
        const timeSinceLastSubmission = now - this.lastSubmissionTime;
        if (timeSinceLastSubmission < 2000) { // 2 seconds minimum between submissions
            console.log('Throttling submission, too soon since last one');
            return;
        }
        
        this.lastSubmissionTime = now;
        
        try {
            this.showUpdateStatus('Updating score...');
            
            if (this.supabase) {
                // Submit the score
                const result = await this.updateSupabaseScore(score);
                if (result) {
                    console.log('Score submitted successfully to Supabase');
                    
                    // If the leaderboard is visible, refresh it
                    if (this.leaderboardVisible) {
                        await this.refreshLeaderboard();
                    }
                    
                    // Show success message
                    this.showUpdateStatus('Score added to leaderboard!', 'success');
                    
                    // Hide status after 2 seconds
                    setTimeout(() => {
                        this.hideUpdateStatus();
                    }, 2000);
                }
            } else {
                // Fallback to session-only leaderboard
                this.updateTemporaryScore(score);
                console.log('Score added to temporary leaderboard');
                this.showUpdateStatus('Score tracking enabled (offline mode)', 'info');
                setTimeout(() => this.hideUpdateStatus(), 2000);
            }
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
            
            // Hide the username area immediately
            const usernameAreaContainer = document.getElementById('username-area-container');
            if (usernameAreaContainer) {
                usernameAreaContainer.style.display = 'none';
            }
            
            // Get current score and process it
            const currentScore = this.getCurrentScore();
            if (currentScore > 0) {
                this.processScore(currentScore);
            }
            
            // Show welcome message in the game messages area using gameController
            if (window.gameController && window.gameController.showMessage) {
                window.gameController.showMessage(`Welcome ${username}! Score at least 5000 to make the leaderboard.`, 'info', 8000);
            }
            
            // Display username in score area
            const scoreLeftElement = document.getElementById('score-bonus');
            if (scoreLeftElement) {
                scoreLeftElement.textContent = username;
                scoreLeftElement.style.color = '#6b7280'; // Gray text
                scoreLeftElement.style.visibility = 'visible';
            }
            
            // Hide record button and center leaderboard button
            this.handleButtonsAfterSubmission();
            
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

// Helper method to handle buttons after username submission
handleButtonsAfterSubmission() {
    // Hide record name button
    const recordScoreBtn = document.getElementById('record-score-btn');
    if (recordScoreBtn) {
        recordScoreBtn.style.display = 'none';
    }
    
    // Center the leaderboard button
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const bottomButtons = document.querySelector('.bottom-buttons');
    if (leaderboardBtn && bottomButtons) {
        bottomButtons.classList.add('single-button');
        leaderboardBtn.style.margin = '0 auto';
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
        // Add a new entry for this session
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
            // Always force a fresh load from Supabase when refreshing
            this.forceRefresh = true;
            await this.loadLeaderboard();
            this.forceRefresh = false;
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
            }
            
            // Render the leaderboard with whatever data we have
            this.renderLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            
            // Show error message in the leaderboard
            const leaderboardTable = document.getElementById('leaderboard-table');
            if (leaderboardTable) {
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
        const leaderboardTableContainer = document.getElementById('leaderboard-table-container');
        if (!leaderboardTableContainer) return;
        
        const tableBody = leaderboardTableContainer.querySelector('.leaderboard-table');
        if (!tableBody) return;
        
        // Clear existing content
        tableBody.innerHTML = '';
        
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
        
        tableBody.appendChild(headerRow);
        
        // Add data rows
        this.leaderboardData.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            
            // Highlight current user
            if (entry.name === this.username) {
                row.classList.add('current-user');
                // Add animation for new entries
                if (entry.score === this.sessionHighScore) {
                    row.classList.add('new-entry');
                    
                    // Remove the animation class after it's done
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
            const dateCell = document.createElement('div');
            dateCell.className = 'leaderboard-cell date';
            dateCell.textContent = `${date.toLocaleDateString()}`;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);
            
            tableBody.appendChild(row);
        });
        
        // If no entries, show a message
        if (this.leaderboardData.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'leaderboard-row empty';
            emptyRow.textContent = 'No scores yet. Start playing to get on the leaderboard!';
            tableBody.appendChild(emptyRow);
        }
    }
}

// Add this function to fix button visibility issues
function fixBottomButtonsVisibility() {
  console.log('Running bottom buttons visibility fix');
  
  // Force the display of bottom buttons when game is active
  function checkAndShowButtons() {
    const gameContainer = document.querySelector('.game-container');
    const bottomButtons = document.querySelector('.bottom-buttons');
    
    if (gameContainer && gameContainer.classList.contains('game-active') && bottomButtons) {
      console.log('Game is active, showing bottom buttons');
      bottomButtons.style.display = 'flex';
      bottomButtons.style.visibility = 'visible';
      bottomButtons.style.opacity = '1';
      bottomButtons.style.height = 'auto';
      
      // Set z-index to ensure buttons appear above other elements
      bottomButtons.style.zIndex = '20';
      
      // Add !important to override any conflicting CSS rules
      bottomButtons.setAttribute('style', 
        'display: flex !important; visibility: visible !important; opacity: 1 !important; height: auto !important; z-index: 20 !important;');
    }
  }
  
  // Check immediately
  checkAndShowButtons();
  
  // Check again after a delay to catch late initialization
  setTimeout(checkAndShowButtons, 300);
  setTimeout(checkAndShowButtons, 1000);
  
  // Also set up a MutationObserver to watch for the game-active class
  const gameContainer = document.querySelector('.game-container');
  if (gameContainer) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && 
            gameContainer.classList.contains('game-active')) {
          checkAndShowButtons();
        }
      });
    });
    
    observer.observe(gameContainer, { attributes: true });
  }
}

// Run the fix immediately
fixBottomButtonsVisibility();

// Also run it when the window loads
window.addEventListener('load', fixBottomButtonsVisibility);

// And run it when any level button is clicked
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Wait a short time for the game to activate
    setTimeout(fixBottomButtonsVisibility, 200);
  });
});
