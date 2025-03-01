// leaderboard-integration.js - Updated for Supabase integration

// Load CSS
function loadStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.head.appendChild(link);
}

// Load JS as module
function loadModule(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Load JS as regular script
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
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

// Connection status monitoring
function setupConnectionMonitoring() {
    // Create connection status indicator
    const connectionStatus = document.createElement('div');
    connectionStatus.id = 'connection-status';
    connectionStatus.className = 'connection-status';
    document.body.appendChild(connectionStatus);
    
    // Update connection status
    function updateConnectionStatus() {
        if (navigator.onLine) {
            connectionStatus.textContent = 'Online';
            connectionStatus.className = 'connection-status online';
            
            // Try to refresh leaderboard when we come back online
            if (window.leaderboardManager && typeof window.leaderboardManager.refreshLeaderboard === 'function') {
                window.leaderboardManager.refreshLeaderboard();
            }
        } else {
            connectionStatus.textContent = 'Offline';
            connectionStatus.className = 'connection-status offline';
        }
    }
    
    // Monitor connection changes
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Initial status
    updateConnectionStatus();
}

// Setup Supabase integration
async function setupSupabaseIntegration() {
    try {
        // Load Supabase JS from CDN
        await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        
        // Create the supabase-leaderboard.js module
        const supabaseLeaderboardContent = `
// supabase-leaderboard.js - Handles interaction with Supabase for the leaderboard

class SupabaseLeaderboard {
    constructor() {
        this.supabase = supabase.createClient(
            'https://zqintrlsxpdxbjspkskd.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaW50cmxzeHBkeGJqc3Brc2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjU0MTYsImV4cCI6MjA1NjQwMTQxNn0.5G1mEsD3skWtOcQ5ugmhYMfQ2obBm6kNKwnA-YH-yIw'
        );
        
        this.tableName = 'leaderboard_entries';
        this.initialized = false;
    }
    
    async initialize() {
        try {
            if (this.initialized) {
                return;
            }
            
            // Check if table exists, if not, we can't do much on the client side
            // A table should be created in Supabase dashboard using SQL Editor
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Supabase leaderboard:', error);
            throw error;
        }
    }
    
    async getLeaderboard() {
        try {
            await this.initialize();
            
            // Get current date minus 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const cutoffDate = sevenDaysAgo.toISOString();
            
            // Fetch leaderboard entries
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .gte('created_at', cutoffDate)
                .order('score', { ascending: false })
                .limit(20);
            
            if (error) {
                console.error('Error fetching leaderboard:', error);
                throw error;
            }
            
            // Transform data to match the expected format
            return data.map(entry => ({
                name: entry.name,
                score: entry.score,
                date: entry.created_at
            }));
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            // Return empty array on error to prevent app from breaking
            return [];
        }
    }
    
    async submitScore(name, score) {
        try {
            await this.initialize();
            
            if (!name || !score || score <= 0) {
                console.error('Invalid score submission');
                return { success: false, error: 'Invalid score submission' };
            }
            
            // First check if user has a higher score already
            const { data: existingEntries, error: fetchError } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('name', name)
                .order('score', { ascending: false })
                .limit(1);
            
            if (fetchError) {
                console.error('Error checking existing score:', fetchError);
                throw fetchError;
            }
            
            // If user has a higher score already, don't update
            if (existingEntries.length > 0 && existingEntries[0].score >= score) {
                return { 
                    success: true, 
                    updated: false, 
                    message: 'Existing score is higher' 
                };
            }
            
            // If user has a lower score or no score, insert new record
            const now = new Date().toISOString();
            
            // Check if we need to update or insert
            if (existingEntries.length > 0) {
                // Update existing entry
                const { error: updateError } = await this.supabase
                    .from(this.tableName)
                    .update({ 
                        score: score,
                        created_at: now
                    })
                    .eq('id', existingEntries[0].id);
                
                if (updateError) {
                    console.error('Error updating score:', updateError);
                    throw updateError;
                }
                
                return { 
                    success: true, 
                    updated: true, 
                    message: 'Score updated successfully' 
                };
            } else {
                // Insert new entry
                const { error: insertError } = await this.supabase
                    .from(this.tableName)
                    .insert([
                        { 
                            name, 
                            score, 
                            created_at: now
                        }
                    ]);
                
                if (insertError) {
                    console.error('Error inserting score:', insertError);
                    throw insertError;
                }
                
                return { 
                    success: true, 
                    updated: true, 
                    message: 'Score added successfully' 
                };
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            return { 
                success: false, 
                error: error.message || 'Error submitting score' 
            };
        }
    }
}

// Export a singleton instance
const supabaseLeaderboard = new SupabaseLeaderboard();
export default supabaseLeaderboard;
`;

        // Create the updated leaderboard.js module
        const leaderboardContent = `
// leaderboard.js - Updated to use Supabase
import supabaseLeaderboard from './supabase-leaderboard.js';

class LeaderboardManager {
    constructor() {
        this.leaderboardData = [];
        this.username = '';
        this.isUsernameSet = false;
        this.maxEntries = 20;
        
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
        
        // Create leaderboard title and loading indicator
        const leaderboardTitle = document.createElement('h2');
        leaderboardTitle.textContent = 'LEADERBOARD';
        leaderboardTitle.className = 'leaderboard-title';
        
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
            if (this.isUsernameSet && score > 0) {
                this.updateScore(score);
            }
        });
        
        // Set up periodic refresh every 60 seconds to keep leaderboard current
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refreshLeaderboard();
            }
        }, 60000); // Refresh every minute
        
        // Add visibility change listener to refresh when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshLeaderboard();
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
            let isApproved = false;
            
            try {
                const usernameCheckerModule = await import('./username-checker.js');
                const usernameChecker = usernameCheckerModule.default;
                isApproved = await usernameChecker.checkUsername(username);
            } catch (e) {
                console.warn('Could not load username checker module, using fallback check');
                isApproved = this.fallbackUsernameCheck(username);
            }
            
            if (isApproved) {
                this.setUsername(username);
                
                // Hide the form and show welcome message
                const usernameForm = document.querySelector('.username-form');
                const welcomeMessage = document.getElementById('welcome-message');
                
                if (usernameForm && welcomeMessage) {
                    usernameForm.classList.add('hidden');
                    welcomeMessage.classList.remove('hidden');
                    welcomeMessage.textContent = \`Hello \${username} - your top 20 score records in the leaderboard below.\`;
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
    
    fallbackUsernameCheck(username) {
        if (!username || username.length < 2 || username.length > 12) {
            return false;
        }
        
        const inappropriatePatterns = [
            /fuck/i, /shit/i, /ass(?!et|ign|ess|ist)/i, /damn/i, /cunt/i,
            /\\bn[i1l]gg[ae3]r/i, /\\bf[a@]g/i
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
        // We don't save to localStorage anymore - username is session-only
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
    
    async updateScore(score) {
        if (!this.isUsernameSet || score <= 0) return;
        
        try {
            // Show updating message
            this.showUpdateStatus('Updating score...');
            
            // Submit score to Supabase
            const result = await supabaseLeaderboard.submitScore(this.username, score);
            
            if (result.success) {
                // Refresh leaderboard data
                await this.refreshLeaderboard();
                this.showUpdateStatus('Score updated!', 'success');
                
                // Hide update status after 2 seconds
                setTimeout(() => {
                    this.hideUpdateStatus();
                }, 2000);
            } else {
                console.error('Error updating score:', result.error);
                this.showUpdateStatus('Error updating score', 'error');
            }
        } catch (error) {
            console.error('Error updating score:', error);
            this.showUpdateStatus('Error updating score', 'error');
        }
    }
    
    showUpdateStatus(message, type = 'info') {
        const statusEl = document.getElementById('leaderboard-status');
        if (!statusEl) {
            const newStatusEl = document.createElement('div');
            newStatusEl.id = 'leaderboard-status';
            newStatusEl.className = \`leaderboard-status \${type}\`;
            newStatusEl.textContent = message;
            
            const leaderboardTable = document.getElementById('leaderboard-table');
            if (leaderboardTable && leaderboardTable.parentNode) {
                leaderboardTable.parentNode.insertBefore(newStatusEl, leaderboardTable);
            }
        } else {
            statusEl.className = \`leaderboard-status \${type}\`;
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
            // Get fresh data from Supabase
            this.leaderboardData = await supabaseLeaderboard.getLeaderboard();
            this.renderLeaderboard();
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
            
            // Get leaderboard data from Supabase
            this.leaderboardData = await supabaseLeaderboard.getLeaderboard();
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Render the leaderboard
            this.renderLeaderboard();
            
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            this.leaderboardData = [];
            
            // Show error in leaderboard area
            const loadingIndicator = document.getElementById('leaderboard-loading');
            if (loadingIndicator) {
                loadingIndicator.textContent = 'Error loading leaderboard. Please refresh the page.';
                loadingIndicator.className += ' error';
            }
        }
    }
    
    renderLeaderboard() {
        const leaderboardTable = document.getElementById('leaderboard-table');
        const loadingIndicator = document.getElementById('leaderboard-loading');
        
        if (!leaderboardTable) return;
        
        // Hide loading indicator if it exists
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Store previous score for the current user
        let previousUserScore = null;
        const existingEntry = this.leaderboardData.find(item => item.name === this.username);
        if (existingEntry) {
            previousUserScore = existingEntry.score;
        }
        
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
                
                // Add animation if score changed
                if (previousUserScore !== null && previousUserScore !== entry.score) {
                    row.classList.add('new-entry');
                    
                    // Remove the animation class after it's done
                    setTimeout(() => {
                        row.classList.remove('new-entry');
                    }, 2000);
                }
            }
            
            const rankCell = document.createElement('div');
            rankCell.className = 'leaderboard-cell rank';
            rankCell.textContent = \`\${index + 1}\`;
            
            const nameCell = document.createElement('div');
            nameCell.className = 'leaderboard-cell name';
            nameCell.textContent = entry.name;
            
            const scoreCell = document.createElement('div');
            scoreCell.className = 'leaderboard-cell score';
            scoreCell.textContent = entry.score.toString();
            
            const date = new Date(entry.date);
            const dateCell = document.createElement('div');
            dateCell.className = 'leaderboard-cell date';
            dateCell.textContent = \`\${date.toLocaleDateString()}\`;
            
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

window.addEventListener('DOMContentLoaded', () => {
    // Wait a short time for the main game to initialize
    setTimeout(() => {
        window.leaderboardManager = new LeaderboardManager();
    }, 500);
});

export default LeaderboardManager;
`;

        // Create blobs for each module
        const supabaseLeaderboardBlob = new Blob([supabaseLeaderboardContent], { type: 'application/javascript' });
        const leaderboardBlob = new Blob([leaderboardContent], { type: 'application/javascript' });

        // Create URLs for the blobs
        window.supabaseLeaderboardUrl = URL.createObjectURL(supabaseLeaderboardBlob);
        window.leaderboardUrl = URL.createObjectURL(leaderboardBlob);

        // Create the score manager patch
        const scoreManagerPatchContent = `
// scoremanager-patch.js - Reset scores on page load and integrate with Supabase leaderboard
(function() {
    // Wait for the original scoreManager to be available
    const checkForScoreManager = setInterval(() => {
        if (window.scoreManager) {
            clearInterval(checkForScoreManager);
            
            // Reset the total score when the page loads
            window.scoreManager.totalScore = 0;
            window.scoreManager.updateDisplay();
            
            // Then patch the scoreManager
            patchScoreManager();
        }
    }, 100);
    
    function patchScoreManager() {
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
        
        console.log('ScoreManager patched successfully for Supabase leaderboard integration');
    }
})();
`;

        const scoreManagerPatchBlob = new Blob([scoreManagerPatchContent], { type: 'application/javascript' });
        window.scoreManagerPatchUrl = URL.createObjectURL(scoreManagerPatchBlob);

        // Create and initialize the modules
        const moduleScript = document.createElement('script');
        moduleScript.type = 'module';
        moduleScript.textContent = `
            import supabaseLeaderboard from "${window.supabaseLeaderboardUrl}";
            import LeaderboardManager from "${window.leaderboardUrl}";
            
            // Make them globally available
            window.supabaseLeaderboard = supabaseLeaderboard;
            window.LeaderboardManager = LeaderboardManager;
            
            // Initialize leaderboard manager
            setTimeout(() => {
                window.leaderboardManager = new LeaderboardManager();
            }, 500);
        `;
        document.body.appendChild(moduleScript);

        // Load score manager patch
        await loadScript(window.scoreManagerPatchUrl);

        // Set up connection monitoring
        setupConnectionMonitoring();

        console.log('Supabase leaderboard integration loaded successfully');
        return true;
    } catch (error) {
        console.error('Error setting up Supabase integration:', error);
        return false;
    }
}

// Initialize on DOM content loaded
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Reset user state at the start of each session
        resetUserState();
        
        // Load leaderboard stylesheet
        loadStylesheet('./styles/leaderboard.css');
        
        // Setup Supabase integration
        await setupSupabaseIntegration();
        
        console.log('Leaderboard system with Supabase integration initialized successfully');
    } catch (error) {
        console.error('Error initializing leaderboard system:', error);
        
        // Fallback to local storage if Supabase fails
        try {
            // Load the original modules
            await loadScript('./js/leaderboard.js');
            
            console.log('Fallback to local storage leaderboard successful');
        } catch (fallbackError) {
            console.error('Fatal error initializing leaderboard:', fallbackError);
        }
    }
});
