// leaderboard-integration.js
// This file loads all leaderboard components

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

// Copy module to the js directory
async function setupModules() {
    // We'll create the modules in a way that can be imported
    try {
        // Create the username checker module
        const usernameCheckerContent = `
        // username-checker.js
        class UsernameChecker {
            constructor() {
                this.inappropriatePatterns = [
                    /fuck/i, /shit/i, /ass(?!et|ign|ess|ist)/i, /damn/i, /cunt/i, /dick/i,
                    /bitch/i, /bastard/i, /penis/i, /vagina/i, /porn/i, /sex/i,
                    /nazi/i, /hitler/i, /kill/i, /murder/i, /suicide/i, /rape/i,
                    /\\bn[i1l]gg[ae3]r/i, /\\bf[a@]g/i, /\\bh[o0]e/i, /\\bwh[o0]re/i,
                    /69/i, /420/i, /\\ba55/i, /\\bp[o0]rn/i, /\\bcum/i
                ];
            }
            
            async checkUsername(username) {
                if (!username || username.length < 2 || username.length > 12) {
                    return false;
                }
                
                for (const pattern of this.inappropriatePatterns) {
                    if (pattern.test(username)) {
                        return false;
                    }
                }
                
                const normalizedUsername = username
                    .replace(/1/g, 'i')
                    .replace(/3/g, 'e')
                    .replace(/4/g, 'a')
                    .replace(/5/g, 's')
                    .replace(/0/g, 'o')
                    .replace(/\\$/g, 's')
                    .replace(/@/g, 'a');
                    
                for (const pattern of this.inappropriatePatterns) {
                    if (pattern.test(normalizedUsername)) {
                        return false;
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                return true;
            }
        }
        
        const usernameChecker = new UsernameChecker();
        export default usernameChecker;
        `;

        // Create the leaderboard module
        const leaderboardContent = `
        // leaderboard.js
        class LeaderboardManager {
            constructor() {
                this.leaderboardData = [];
                this.username = '';
                this.isUsernameSet = false;
                this.maxEntries = 20;
                this.maxDays = 7;
                
                this.loadLeaderboard();
                this.createLeaderboardUI();
                this.addEventListeners();
            }
            
            createLeaderboardUI() {
                const leaderboardSection = document.createElement('section');
                leaderboardSection.className = 'leaderboard-section';
                
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
                
                const welcomeMessage = document.createElement('div');
                welcomeMessage.id = 'welcome-message';
                welcomeMessage.className = 'welcome-message hidden';
                
                usernameArea.appendChild(usernameForm);
                usernameArea.appendChild(welcomeMessage);
                
                const leaderboardTitle = document.createElement('h2');
                leaderboardTitle.textContent = 'LEADERBOARD';
                leaderboardTitle.className = 'leaderboard-title';
                
                const leaderboardTable = document.createElement('div');
                leaderboardTable.className = 'leaderboard-table';
                leaderboardTable.id = 'leaderboard-table';
                
                leaderboardSection.appendChild(usernameArea);
                leaderboardSection.appendChild(leaderboardTitle);
                leaderboardSection.appendChild(leaderboardTable);
                
                const gameContainer = document.querySelector('.game-container');
                if (gameContainer) {
                    gameContainer.appendChild(leaderboardSection);
                }
            }
            
            addEventListeners() {
                const submitButton = document.getElementById('submit-username');
                if (submitButton) {
                    submitButton.addEventListener('click', () => {
                        this.handleUsernameSubmission();
                    });
                }
                
                const usernameInput = document.getElementById('username-input');
                if (usernameInput) {
                    usernameInput.addEventListener('keyup', (event) => {
                        if (event.key === 'Enter') {
                            this.handleUsernameSubmission();
                        }
                    });
                }
                
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
                        
                        const usernameForm = document.querySelector('.username-form');
                        const welcomeMessage = document.getElementById('welcome-message');
                        
                        if (usernameForm && welcomeMessage) {
                            usernameForm.classList.add('hidden');
                            welcomeMessage.classList.remove('hidden');
                            welcomeMessage.textContent = \`Hello \${username} - your top 20 score records in the leaderboard below.\`;
                        }
                        
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
                localStorage.setItem('pathPuzzleUsername', username);
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
            
            updateScore(score) {
                if (!this.isUsernameSet || score <= 0) return;
                
                const now = new Date();
                const entry = {
                    name: this.username,
                    score: score,
                    date: now.toISOString()
                };
                
                const existingIndex = this.leaderboardData.findIndex(item => item.name === this.username);
                
                if (existingIndex !== -1) {
                    if (score > this.leaderboardData[existingIndex].score) {
                        this.leaderboardData[existingIndex] = entry;
                    }
                } else {
                    this.leaderboardData.push(entry);
                }
                
                this.filterAndSortLeaderboard();
                this.saveLeaderboard();
                this.renderLeaderboard();
            }
            
            filterAndSortLeaderboard() {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - this.maxDays);
                
                this.leaderboardData = this.leaderboardData.filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= cutoffDate;
                });
                
                this.leaderboardData.sort((a, b) => b.score - a.score);
                this.leaderboardData = this.leaderboardData.slice(0, this.maxEntries);
            }
            
            loadLeaderboard() {
                try {
                    const storedData = localStorage.getItem('pathPuzzleLeaderboard');
                    if (storedData) {
                        this.leaderboardData = JSON.parse(storedData);
                        this.filterAndSortLeaderboard();
                    }
                    
                    const storedUsername = localStorage.getItem('pathPuzzleUsername');
                    if (storedUsername) {
                        this.username = storedUsername;
                        this.isUsernameSet = true;
                        
                        setTimeout(() => {
                            const usernameForm = document.querySelector('.username-form');
                            const welcomeMessage = document.getElementById('welcome-message');
                            
                            if (usernameForm && welcomeMessage) {
                                usernameForm.classList.add('hidden');
                                welcomeMessage.classList.remove('hidden');
                                welcomeMessage.textContent = \`Hello \${this.username} - your top 20 score records in the leaderboard below.\`;
                            }
                        }, 500);
                    }
                    
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
                
                leaderboardTable.innerHTML = '';
                
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
                
                this.leaderboardData.forEach((entry, index) => {
                    const row = document.createElement('div');
                    row.className = 'leaderboard-row';
                    
                    if (entry.name === this.username) {
                        row.classList.add('current-user');
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
                
                if (this.leaderboardData.length === 0) {
                    const emptyRow = document.createElement('div');
                    emptyRow.className = 'leaderboard-row empty';
                    emptyRow.textContent = 'No scores yet. Start playing to get on the leaderboard!';
                    leaderboardTable.appendChild(emptyRow);
                }
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.leaderboardManager = new LeaderboardManager();
            }, 500);
        });

        export default LeaderboardManager;
        `;

        // Create the score manager patch
        const scoreManagerPatchContent = `
        // scoremanager-patch.js
        (function() {
            const checkForScoreManager = setInterval(() => {
                if (window.scoreManager) {
                    clearInterval(checkForScoreManager);
                    patchScoreManager();
                }
            }, 100);
            
            function patchScoreManager() {
                const originalUpdateDisplay = window.scoreManager.updateDisplay;
                
                window.scoreManager.updateDisplay = function() {
                    originalUpdateDisplay.call(this);
                    
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
                
                const originalCompletePuzzle = window.scoreManager.completePuzzle;
                
                window.scoreManager.completePuzzle = function() {
                    originalCompletePuzzle.call(this);
                    
                    if (window.leaderboardManager && window.leaderboardManager.isUsernameSet) {
                        window.leaderboardManager.updateScore(this.totalScore);
                    }
                };
                
                console.log('ScoreManager patched successfully for leaderboard integration');
            }
        })();
        `;

        // Create a blob for each module
        const usernameCheckerBlob = new Blob([usernameCheckerContent], { type: 'application/javascript' });
        const leaderboardBlob = new Blob([leaderboardContent], { type: 'application/javascript' });
        const scoreManagerPatchBlob = new Blob([scoreManagerPatchContent], { type: 'application/javascript' });

        // Create URLs for the blobs
        window.usernameCheckerUrl = URL.createObjectURL(usernameCheckerBlob);
        window.leaderboardUrl = URL.createObjectURL(leaderboardBlob);
        window.scoreManagerPatchUrl = URL.createObjectURL(scoreManagerPatchBlob);
    } catch (error) {
        console.error('Error setting up modules:', error);
    }
}

// Initialize on DOM content loaded
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load leaderboard stylesheet
        loadStylesheet('styles/leaderboard.css');
        
        // Setup modules
        await setupModules();
        
        // Load score manager patch first (to ensure events are ready)
        await loadScript(window.scoreManagerPatchUrl);
        
        // Load username checker and leaderboard modules
        const moduleScript = document.createElement('script');
        moduleScript.type = 'module';
        moduleScript.textContent = `
            import usernameChecker from "${window.usernameCheckerUrl}";
            import LeaderboardManager from "${window.leaderboardUrl}";
            
            // Make them globally available
            window.usernameChecker = usernameChecker;
            window.LeaderboardManager = LeaderboardManager;
            
            // Initialize leaderboard manager
            window.leaderboardManager = new LeaderboardManager();
            
            // Setup sample data (for testing only - can be removed in production)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('sample') || localStorage.getItem('pathPuzzleShowSample') === 'true') {
                localStorage.setItem('pathPuzzleShowSample', 'true');
                
                // Add sample data if leaderboard is empty
                setTimeout(() => {
                    if (window.leaderboardManager && window.leaderboardManager.leaderboardData.length === 0) {
                        generateSampleData();
                    }
                }, 1000);
            }
            
            function generateSampleData() {
                const sampleNames = [
                    'Alex', 'Bailey', 'Casey', 'Dakota', 'Emery', 
                    'Finley', 'Greer', 'Harper', 'Indigo', 'Jordan'
                ];
                
                const currentDate = new Date();
                const sampleData = [];
                
                for (let i = 0; i < sampleNames.length; i++) {
                    // Generate a date within the last 5 days
                    const date = new Date(currentDate);
                    date.setDate(date.getDate() - Math.floor(Math.random() * 5));
                    
                    // Generate random score (higher index = lower score)
                    const score = Math.floor(5000 - (i * 250) + (Math.random() * 200));
                    
                    sampleData.push({
                        name: sampleNames[i],
                        score: score,
                        date: date.toISOString()
                    });
                }
                
                // Sort by score (highest first)
                sampleData.sort((a, b) => b.score - a.score);
                
                // Add to leaderboard
                window.leaderboardManager.leaderboardData = sampleData;
                window.leaderboardManager.saveLeaderboard();
                window.leaderboardManager.renderLeaderboard();
                
                console.log('Added sample leaderboard data for testing');
            }
        `;
        document.body.appendChild(moduleScript);
        
        console.log('Leaderboard system loaded successfully');
    } catch (error) {
        console.error('Error loading leaderboard system:', error);
    }
});
