// leaderboard-integration.js - Revised version for modal behavior

import supabaseLeaderboard from 'https://gturner321.github.io/grids/js/supabase-leaderboard.js';

// Helper functions
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

// Utility function to create and append an element
function createElement(type, attributes = {}, children = []) {
    const element = document.createElement(type);
    
    // Add attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Add children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

// Main LeaderboardManager class
class LeaderboardManager {
    constructor() {
        // Reset any existing data
        resetUserSession();
    
        // Initialize state
        this.leaderboardData = [];
        this.username = '';
        this.isUsernameSet = false;
        this.maxEntries = 20;
        this.supabase = null;
        this.sessionId = null;
        this.sessionHighScore = 0;
        this.scoreThreshold = 5000; // Only submit scores of 5000+
        this.leaderboardLoaded = false;
        this.leaderboardVisible = false;
        this.lastSubmissionTime = 0;
        this.modalsCreated = false;
        
        // Pre-bind methods to maintain context
        this.updateScore = debounce(this.updateScore.bind(this), 300);
        this.processScore = this.processScore.bind(this);
        
        // Initialize components when game becomes active
        this.listenForGameActive();
        this.initSupabase();
        this.findScoreManager();
    }
    
    // Listen for game active state to initialize UI
    listenForGameActive() {
        // Watch for game active state changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const gameContainer = document.querySelector('.game-container');
                    if (gameContainer && gameContainer.classList.contains('game-active')) {
                        // Game is now active, create UI if not already done
                        if (!this.modalsCreated) {
                            console.log('Game active, creating leaderboard UI');
                            this.createUI();
                            this.modalsCreated = true;
                        }
                    }
                }
            });
        });
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            observer.observe(gameContainer, { attributes: true });
        }
        
        // Also listen for gameStart event as a backup
        window.addEventListener('gameStart', () => {
            if (!this.modalsCreated) {
                console.log('Game started, creating leaderboard UI');
                setTimeout(() => {
                    this.createUI();
                    this.modalsCreated = true;
                }, 500); // Short delay to ensure DOM is ready
            }
        });
    }
    
    // Create all UI elements
    createUI() {
        // Create bottom buttons first (always visible when game is active)
        this.createBottomButtons();
        
        // Create modals but don't show them yet
        this.createModals();
        
        // Add all event listeners
        this.addEventListeners();
        
        // Check button visibility to make sure they appear
        this.checkButtonVisibility();
        setTimeout(() => this.checkButtonVisibility(), 500);
        setTimeout(() => this.checkButtonVisibility(), 1000);
    }
    
    // Create bottom buttons
    createBottomButtons() {
        const gameBoard = document.querySelector('.game-board');
        if (!gameBoard) {
            console.error('Game board not found');
            return;
        }
        
        // Check if buttons already exist
        if (document.getElementById('bottom-buttons')) {
            console.log('Bottom buttons already exist');
            return;
        }
        
        console.log('Creating bottom buttons');
        
        const buttonsContainer = createElement('div', {
            className: 'bottom-buttons',
            id: 'bottom-buttons'
        });
        
        // Record Name Button
        const recordScoreButton = createElement('button', {
            id: 'record-score-btn',
            className: 'bottom-btn metallic-button',
            innerHTML: `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                RECORD NAME
            `
        });
        
        // Leaderboard Button
        const leaderboardButton = createElement('button', {
            id: 'leaderboard-btn',
            className: 'bottom-btn metallic-button',
            innerHTML: `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9l6 6 6-6"></path>
                </svg>
                LEADERBOARD
            `
        });
        
        buttonsContainer.appendChild(recordScoreButton);
        buttonsContainer.appendChild(leaderboardButton);
        
        gameBoard.appendChild(buttonsContainer);
        
        console.log('Bottom buttons created');
    }
    
    // Create modals for username input and leaderboard
    createModals() {
        // First check if modals already exist
        if (document.getElementById('username-area-container') || 
            document.getElementById('leaderboard-table-container')) {
            console.log('Modals already exist');
            return;
        }
        
        console.log('Creating modals');
        
        // Create username submission modal
        this.createUsernameModal();
        
        // Create leaderboard modal
        this.createLeaderboardModal();
        
        console.log('Modals created');
    }
    
    // Create username submission modal
    createUsernameModal() {
        // Create the modal backdrop
        const usernameAreaContainer = createElement('div', {
            id: 'username-area-container',
            className: 'modal-backdrop'
        });
        
        // Set initial visibility to hidden
        usernameAreaContainer.style.display = 'none';
        usernameAreaContainer.style.visibility = 'hidden';
        usernameAreaContainer.style.opacity = '0';
        
        // Create the modal content
        const usernameArea = createElement('div', {
            className: 'username-area styled-box'
        });
        
        // Create form elements
        const usernameForm = createElement('div', {
            className: 'username-form'
        });
        
        const usernamePrompt = createElement('p', {
            className: 'username-prompt',
            textContent: 'RECORD YOUR SCORE - SUBMIT YOUR NAME:'
        });
        
        const inputWrapper = createElement('div', {
            className: 'input-wrapper'
        });
        
        const usernameInput = createElement('input', {
            type: 'text',
            id: 'username-input',
            maxLength: '12',
            placeholder: 'Enter name (max 12 char)'
        });
        
        const submitButton = createElement('button', {
            id: 'submit-username',
            className: 'metallic-button',
            textContent: 'Submit'
        });
        
        const statusMessage = createElement('div', {
            id: 'username-status',
            className: 'status-message'
        });
        
        // Create close button
        const returnButton = createElement('button', {
            id: 'return-to-record-btn',
            className: 'metallic-button return-button',
            innerHTML: '&times;'
        });
        
        // Assemble the modal
        inputWrapper.appendChild(usernameInput);
        inputWrapper.appendChild(submitButton);
        
        usernameForm.appendChild(usernamePrompt);
        usernameForm.appendChild(inputWrapper);
        usernameForm.appendChild(statusMessage);
        
        usernameArea.appendChild(usernameForm);
        usernameArea.appendChild(returnButton);
        
        usernameAreaContainer.appendChild(usernameArea);
        
        // Add to body for proper modal behavior (not nested in game container)
        document.body.appendChild(usernameAreaContainer);
    }
    
    // Create leaderboard modal
    createLeaderboardModal() {
        // Create the modal backdrop
        const leaderboardContainer = createElement('div', {
            id: 'leaderboard-table-container',
            className: 'modal-backdrop'
        });
        
        // Set initial visibility to hidden
        leaderboardContainer.style.display = 'none';
        leaderboardContainer.style.visibility = 'hidden';
        leaderboardContainer.style.opacity = '0';
        
        // Create the title
        const leaderboardTitle = createElement('h2', {
            className: 'leaderboard-title',
            textContent: 'LEADERBOARD'
        });
        
        // Create the table
        const leaderboardTable = createElement('div', {
            id: 'leaderboard-table',
            className: 'leaderboard-table styled-box'
        });
        
        // Create close button
        const closeButton = createElement('button', {
            id: 'close-leaderboard-btn',
            className: 'metallic-button',
            textContent: 'CLOSE'
        });
        
        // Assemble the modal
        leaderboardContainer.appendChild(leaderboardTitle);
        leaderboardContainer.appendChild(leaderboardTable);
        leaderboardContainer.appendChild(closeButton);
        
        // Add to body for proper modal behavior (not nested in game container)
        document.body.appendChild(leaderboardContainer);
    }
    
    addEventListeners() {
    console.log('Adding event listeners to buttons and modals');
    
    // Get references to all buttons
    const recordScoreBtn = document.getElementById('record-score-btn');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const returnToRecordBtn = document.getElementById('return-to-record-btn');
    const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
    const submitUsernameBtn = document.getElementById('submit-username');
    const usernameInput = document.getElementById('username-input');
    
    // Handle Record Name button
    if (recordScoreBtn) {
        const newRecordBtn = recordScoreBtn.cloneNode(true);
        if (recordScoreBtn.parentNode) {
            recordScoreBtn.parentNode.replaceChild(newRecordBtn, recordScoreBtn);
            
            newRecordBtn.addEventListener('click', () => {
                console.log('RECORD BUTTON CLICKED');
                if (!this.isUsernameSet) {
                    this.showUsernameModal();
                }
            });
        }
    }
    
    // Handle Leaderboard button
    if (leaderboardBtn) {
        const newLeaderboardBtn = leaderboardBtn.cloneNode(true);
        if (leaderboardBtn.parentNode) {
            leaderboardBtn.parentNode.replaceChild(newLeaderboardBtn, leaderboardBtn);
            
            newLeaderboardBtn.addEventListener('click', () => {
                console.log('LEADERBOARD BUTTON CLICKED');
                this.toggleLeaderboardModal();
            });
        }
    }
    
    // Handle Return button (close username modal)
    if (returnToRecordBtn) {
        const newReturnBtn = returnToRecordBtn.cloneNode(true);
        if (returnToRecordBtn.parentNode) {
            returnToRecordBtn.parentNode.replaceChild(newReturnBtn, returnToRecordBtn);
            
            newReturnBtn.addEventListener('click', () => {
                console.log('RETURN BUTTON CLICKED');
                this.hideUsernameModal();
            });
        }
    }
    
    // Handle Close Leaderboard button
    if (closeLeaderboardBtn) {
        const newCloseBtn = closeLeaderboardBtn.cloneNode(true);
        if (closeLeaderboardBtn.parentNode) {
            closeLeaderboardBtn.parentNode.replaceChild(newCloseBtn, closeLeaderboardBtn);
            
            newCloseBtn.addEventListener('click', () => {
                console.log('CLOSE LEADERBOARD BUTTON CLICKED');
                this.hideLeaderboardModal();
            });
        }
    }
    
    // Handle Submit Username button
    if (submitUsernameBtn) {
        const newSubmitBtn = submitUsernameBtn.cloneNode(true);
        if (submitUsernameBtn.parentNode) {
            submitUsernameBtn.parentNode.replaceChild(newSubmitBtn, submitUsernameBtn);
            
            newSubmitBtn.addEventListener('click', () => {
                console.log('SUBMIT USERNAME BUTTON CLICKED');
                this.handleUsernameSubmission();
            });
        }
    }
    
    // Handle Enter key in username input
    if (usernameInput) {
        // Can't clone input with its value, so use a direct approach
        usernameInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                console.log('ENTER KEY PRESSED IN USERNAME INPUT');
                this.handleUsernameSubmission();
            }
        });
    }
    
    // Modal backdrop click handlers (to close modals when clicking outside)
    const usernameAreaContainer = document.getElementById('username-area-container');
    if (usernameAreaContainer) {
        usernameAreaContainer.addEventListener('click', (e) => {
            // Only close if clicking directly on the backdrop (not its children)
            if (e.target === usernameAreaContainer) {
                this.hideUsernameModal();
            }
        });
    }
    
    const leaderboardTableContainer = document.getElementById('leaderboard-table-container');
    if (leaderboardTableContainer) {
        leaderboardTableContainer.addEventListener('click', (e) => {
            // Only close if clicking directly on the backdrop (not its children)
            if (e.target === leaderboardTableContainer) {
                this.hideLeaderboardModal();
            }
        });
    }
    
    // Escape key handler to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.hideUsernameModal();
            this.hideLeaderboardModal();
        }
    });
    
    // Listen for score updates
    window.addEventListener('scoreUpdated', (event) => {
        const score = event.detail.score;
        
        // Highlight record button if score is high enough but username not set
        if (!this.isUsernameSet && score >= this.scoreThreshold && recordScoreBtn) {
            recordScoreBtn.classList.add('highlight');
        }
    });
}
    
    // Modal visibility handlers
    showUsernameModal() {
        const modal = document.getElementById('username-area-container');
        if (!modal) return;
        
        // Hide leaderboard modal if it's open
        this.hideLeaderboardModal();
        
        // Show username modal with animation
        modal.classList.add('visible');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        
        // Focus on input field
        setTimeout(() => {
            const input = document.getElementById('username-input');
            if (input) input.focus();
        }, 100);
    }
    
    hideUsernameModal() {
        const modal = document.getElementById('username-area-container');
        if (!modal) return;
        
        modal.classList.remove('visible');
        
        // Wait for animation to complete before hiding completely
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
        }, 300);
    }
    
    toggleLeaderboardModal() {
        const modal = document.getElementById('leaderboard-table-container');
        if (!modal) return;
        
        if (modal.classList.contains('visible')) {
            this.hideLeaderboardModal();
        } else {
            this.showLeaderboardModal();
        }
    }
    
    showLeaderboardModal() {
        const modal = document.getElementById('leaderboard-table-container');
        if (!modal) return;
        
        // Hide username modal if it's open
        this.hideUsernameModal();
        
        // Show leaderboard modal with animation
        modal.classList.add('visible');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        
        // Load leaderboard data
        this.loadLeaderboard();
    }
    
    hideLeaderboardModal() {
        const modal = document.getElementById('leaderboard-table-container');
        if (!modal) return;
        
        modal.classList.remove('visible');
        
        // Wait for animation to complete before hiding completely
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
        }, 300);
    }
    
    // Initialize Supabase
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
    
    // Initialize leaderboard table in Supabase
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
    
    // Find scoreManager instance
    findScoreManager() {
        // First try to use the scoreManager directly imported via module
        import('./scoremanager.js').then(module => {
            if (module && module.scoreManager) {
                // Add it to window for easy access
                window.scoreManager = module.scoreManager;
                this.patchScoreManager(module.scoreManager);
                console.log('ScoreManager found via module import and patched successfully');
            } else {
                // Otherwise check window object
                if (window.scoreManager) {
                    this.patchScoreManager(window.scoreManager);
                    console.log('ScoreManager found in window and patched successfully');
                } else {
                    // Set up an observer to wait for scoreManager
                    this.setupScoreManagerObserver();
                }
            }
        }).catch(err => {
            // Try to find it on window
            if (window.scoreManager) {
                this.patchScoreManager(window.scoreManager);
            } else {
                this.setupScoreManagerObserver();
            }
        });
    }
    
    // Set up observer to wait for scoreManager
    setupScoreManagerObserver() {
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
    
    // Patch the scoreManager to integrate with leaderboard
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
            
            return true;
        } catch (error) {
            console.error('Error patching ScoreManager:', error);
            return false;
        }
    }
    
    // Process score updates
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
            
            // Before making a Supabase request, check if score is high enough
            this.checkIfScoreQualifies(score).then(qualifies => {
                if (qualifies) {
                    // For scores over threshold that qualify, submit to leaderboard
                    this.updateScore(score);
                } else {
                    this.showUpdateStatus('Score improved but not high enough for leaderboard', 'info');
                    setTimeout(() => this.hideUpdateStatus(), 3000);
                }
            });
        } else if (score >= this.scoreThreshold && this.leaderboardVisible) {
            // Only refresh if the table is actually displayed
            this.refreshLeaderboard();
        }
    }

    async checkIfScoreQualifies(score) {
        // If we haven't loaded the leaderboard data yet, or we have fewer than 20 entries,
        // the score automatically qualifies
        if (!this.leaderboardLoaded || this.leaderboardData.length < 20) {
            return true;
        }
        
        // Find the lowest score in the leaderboard
        const scores = this.leaderboardData.map(entry => entry.score);
        const lowestScore = Math.min(...scores);
        
        // If the new score is higher than the lowest score, it qualifies
        return score > lowestScore;
    }
    
    // Update score in database
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
                    
                    // Always refresh the data after a successful update
                    await this.refreshLeaderboard();
                    
                    // Show success message
                    this.showUpdateStatus('Score added to leaderboard!', 'success');
                    
                    // If leaderboard is not visible, show it now
                    this.showLeaderboardModal();
                    
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
    
    // Handle username submission
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
                
                // Hide the username modal
                this.hideUsernameModal();
                
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
    
    handleButtonsAfterSubmission() {
        // Hide record name button using class
        const recordScoreBtn = document.getElementById('record-score-btn');
        if (recordScoreBtn) {
            recordScoreBtn.classList.add('hidden');
        }
        
        // Center the leaderboard button
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        const bottomButtons = document.getElementById('bottom-buttons');
        if (leaderboardBtn && bottomButtons) {
            bottomButtons.classList.add('single-button');
        }
    }
    
    // Check if username is appropriate
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
    
    // Set username and create session
    setUsername(username) {
        this.username = username;
        this.isUsernameSet = true;
        
        // Generate a new session ID for this username
        this.sessionId = `${username}-${Date.now()}`;
        console.log('New session created with ID:', this.sessionId);
    }
    
    // Get current score from scoreManager
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
    
    // Update score in Supabase
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
    
    // Update temporary score (offline mode)
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
    
    // Show update status
    showUpdateStatus(message, type = 'info') {
        // Create status element if it doesn't exist
        let statusEl = document.getElementById('leaderboard-status');
        
        if (!statusEl) {
            statusEl = createElement('div', {
                id: 'leaderboard-status',
                className: `leaderboard-status ${type}`,
                textContent: message
            });
            
            const leaderboardTable = document.getElementById('leaderboard-table');
            if (leaderboardTable && leaderboardTable.parentNode) {
                leaderboardTable.parentNode.insertBefore(statusEl, leaderboardTable);
            }
        } else {
            statusEl.className = `leaderboard-status ${type}`;
            statusEl.textContent = message;
            statusEl.style.display = 'block';
        }
    }
    
    // Hide update status
    hideUpdateStatus() {
        const statusEl = document.getElementById('leaderboard-status');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }
    
    // Refresh leaderboard data
    async refreshLeaderboard() {
        try {
            // Don't refresh if we're already loading
            if (this.isLoadingLeaderboard) {
                console.log('Already loading leaderboard, skipping refresh');
                return false;
            }
            
            // Don't refresh if we've loaded within the last 5 seconds
            const now = Date.now();
            if (this.lastLeaderboardLoad && now - this.lastLeaderboardLoad < 5000) {
                console.log('Leaderboard loaded recently, skipping refresh');
                return false;
            }
            
            // Refresh the data
            this.forceRefresh = true;
            await this.loadLeaderboard();
            this.forceRefresh = false;
            return true;
        } catch (error) {
            console.error('Error refreshing leaderboard:', error);
            return false;
        }
    }
    
    // Load leaderboard data from database
    async loadLeaderboard() {
        try {
            this.showUpdateStatus('Loading leaderboard data...', 'info');
            
            // Set a flag to indicate we're in the process of loading
            this.isLoadingLeaderboard = true;
            
            // Only load from Supabase if data isn't loaded yet or if we're forcing a refresh
            if (this.supabase && (!this.leaderboardLoaded || this.forceRefresh)) {
                await this.loadFromSupabase();
                this.leaderboardLoaded = true;
                this.lastLeaderboardLoad = Date.now();
            }
            
            // Render the leaderboard with whatever data we have
            this.renderLeaderboard();
            this.leaderboardVisible = true;
            
            // Clear loading state
            this.isLoadingLeaderboard = false;
            this.hideUpdateStatus();
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            
            // Show error message in the leaderboard
            const leaderboardTable = document.getElementById('leaderboard-table');
            if (leaderboardTable) {
                leaderboardTable.innerHTML = '<div class="leaderboard-row" style="justify-content: center; padding: 20px; color: #e53e3e;">Error loading leaderboard data. Please try again later.</div>';
            }
            
            // Clear loading state
            this.isLoadingLeaderboard = false;
            this.showUpdateStatus('Error loading leaderboard', 'error');
        }
    }
    
    // Load data from Supabase
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
    
    // Render leaderboard
    renderLeaderboard() {
        const leaderboardTable = document.getElementById('leaderboard-table');
        
        if (!leaderboardTable) return;
        
        // Store previous score for the current user
        let previousUserScore = null;
        const existingEntry = this.leaderboardData.find(item => item.name === this.username);
        if (existingEntry) {
            previousUserScore = existingEntry.score;
        }
        
        // Clear existing content
        leaderboardTable.innerHTML = '';
        
        // Create header row
        const headerRow = createElement('div', {
            className: 'leaderboard-row header'
        });
        
        const rankHeader = createElement('div', {
            className: 'leaderboard-cell rank',
            textContent: 'RANK'
        });
        
        const nameHeader = createElement('div', {
            className: 'leaderboard-cell name',
            textContent: 'NAME'
        });
        
        const scoreHeader = createElement('div', {
            className: 'leaderboard-cell score',
            textContent: 'SCORE'
        });
        
        const dateHeader = createElement('div', {
            className: 'leaderboard-cell date',
            textContent: 'DATE'
        });
        
        headerRow.appendChild(rankHeader);
        headerRow.appendChild(nameHeader);
        headerRow.appendChild(scoreHeader);
        headerRow.appendChild(dateHeader);
        
        leaderboardTable.appendChild(headerRow);
        
        // Add data rows
        this.leaderboardData.forEach((entry, index) => {
            const row = createElement('div', {
                className: 'leaderboard-row'
            });
            
            // Highlight current user
            if (entry.name === this.username) {
                row.classList.add('current-user');
                
                // Add animation if score changed
                if (previousUserScore !== null && previousUserScore !== entry.score) {
                    row.classList.add('new-entry');
                    
                    // Remove the animation class after it's done
                    setTimeout(() => {
                        row.classList.remove('new-entry');
                    }, 2000);
                }
            }
            
            const rankCell = createElement('div', {
                className: 'leaderboard-cell rank',
                textContent: `${index + 1}`
            });
            
            const nameCell = createElement('div', {
                className: 'leaderboard-cell name',
                textContent: entry.name
            });
            
            const scoreCell = createElement('div', {
                className: 'leaderboard-cell score',
                textContent: entry.score.toString()
            });
            
            const date = new Date(entry.date);
            const dateCell = createElement('div', {
                className: 'leaderboard-cell date',
                textContent: `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`
            });
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);
            
            leaderboardTable.appendChild(row);
        });
        
        // If no entries, show a message
        if (this.leaderboardData.length === 0) {
            const emptyRow = createElement('div', {
                className: 'leaderboard-row empty',
                textContent: 'No scores yet. Start playing to get on the leaderboard!'
            });
            leaderboardTable.appendChild(emptyRow);
        }
    }
    
    // Check if any modals are open
    isModalOpen() {
        const usernameAreaContainer = document.getElementById('username-area-container');
        const leaderboardTableContainer = document.getElementById('leaderboard-table-container');
        
        return (usernameAreaContainer && usernameAreaContainer.classList.contains('visible')) || 
               (leaderboardTableContainer && leaderboardTableContainer.classList.contains('visible'));
    }
    
    // Check button visibility
    checkButtonVisibility() {
        const gameContainer = document.querySelector('.game-container');
        const bottomButtons = document.getElementById('bottom-buttons');
        
        if (gameContainer && bottomButtons) {
            console.log('Checking buttons visibility:', 
                gameContainer.classList.contains('game-active') ? 'game active' : 'game not active');
            
            // Make sure the buttons are ALWAYS visible when game is active
            if (gameContainer.classList.contains('game-active')) {
                // IMPORTANT: Set both the style directly AND add classes
                bottomButtons.style.display = 'flex';
                bottomButtons.style.visibility = 'visible';
                bottomButtons.style.height = 'auto';
                bottomButtons.style.opacity = '1';
                bottomButtons.style.position = 'relative';
                bottomButtons.style.zIndex = '50';
                bottomButtons.style.margin = '15px auto';
                
                // Also add classes for CSS targeting
                bottomButtons.classList.remove('hidden');
                
                // If username is set, apply the proper button layout
                if (this.isUsernameSet) {
                    this.handleButtonsAfterSubmission();
                }
            }
        }
    }
}

// Initialize the leaderboard manager when DOM content is loaded
window.addEventListener('DOMContentLoaded', () => {
    try {
        // Reset any stored session data
        resetUserSession();
        
        // Create and initialize the leaderboard
        window.leaderboardManager = new LeaderboardManager();
        
        console.log('Leaderboard initialized successfully');
    } catch (error) {
        console.error('Error initializing leaderboard system:', error);
    }
});

// Force buttons to be visible when the page loads
window.addEventListener('load', () => {
    if (window.leaderboardManager) {
        window.leaderboardManager.checkButtonVisibility();
    }
});

// Force check buttons on game start
window.addEventListener('gameStart', () => {
    if (window.leaderboardManager) {
        setTimeout(() => window.leaderboardManager.checkButtonVisibility(), 100);
        setTimeout(() => window.leaderboardManager.checkButtonVisibility(), 500);
        setTimeout(() => window.leaderboardManager.checkButtonVisibility(), 1000);
    }
});

// Also check button visibility when a level button is clicked
document.addEventListener('DOMContentLoaded', () => {
    // Add listeners to all level buttons
    document.querySelectorAll('.level-btn, .level-btn-scrollable').forEach(btn => {
        btn.addEventListener('click', () => {
            // Check buttons after level selection (with delays)
            setTimeout(() => {
                if (window.leaderboardManager) {
                    window.leaderboardManager.checkButtonVisibility();
                }
            }, 200);
            
            setTimeout(() => {
                if (window.leaderboardManager) {
                    window.leaderboardManager.checkButtonVisibility();
                }
            }, 1000);
        });
    });
});

// Export for module usage
export default LeaderboardManager;
