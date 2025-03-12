// This update adds auto-hiding welcome message functionality and updates text content

/**
 * Function to handle username submission success
 * @param {string} username - The submitted username
 * @param {number} currentScore - Current score to process
 */
function handleUsernameSuccess(username) {
    // Hide the form and show welcome message
    const usernameForm = document.querySelector('.username-form');
    const welcomeMessage = document.getElementById('welcome-message');
    const usernameArea = document.querySelector('.username-area');
    
    if (usernameForm && welcomeMessage) {
        // Hide the form
        usernameForm.classList.add('hidden');
        
        // Show and update welcome message
        welcomeMessage.classList.remove('hidden');
        welcomeMessage.textContent = `Hello ${username} - high scores will make it onto the leaderboard - scores last for one week - click to reveal the leaderboard, or it reveals automatically if you score high enough`;
        
        // Center the text
        welcomeMessage.style.textAlign = 'center';
        
        // Set a timeout to hide the welcome message after 15 seconds
        setTimeout(() => {
            // Fade out the entire username area
            if (usernameArea) {
                // Add CSS transition for smooth fade-out
                usernameArea.style.transition = 'opacity 1s ease-out';
                usernameArea.style.opacity = '0';
                
                // After the transition completes, hide the element
                setTimeout(() => {
                    usernameArea.style.display = 'none';
                }, 1000);
            }
        }, 15000); // 15 seconds
    }
}

// Add this code to the page to patch the leaderboardManager when it becomes available
(function patchLeaderboardManager() {
    // Check if leaderboardManager exists
    if (window.leaderboardManager) {
        patchHandleUsernameSubmission();
    } else {
        // If not, set up an observer to wait for it
        const checkInterval = setInterval(() => {
            if (window.leaderboardManager) {
                clearInterval(checkInterval);
                patchHandleUsernameSubmission();
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }
    
    function patchHandleUsernameSubmission() {
        // Store reference to the original method
        const originalHandleUsernameSubmission = window.leaderboardManager.handleUsernameSubmission;
        
        // Replace the method with our own implementation
        window.leaderboardManager.handleUsernameSubmission = async function() {
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
                    isApproved = this.checkUsername ? this.checkUsername(username) : true;
                }
                
                if (isApproved) {
                    this.setUsername(username);
                    
                    // Use our custom success handler instead of the original code
                    handleUsernameSuccess(username);
                    
                    // Get current score and process it
                    const currentScore = this.getCurrentScore();
                    if (currentScore > 0) {
                        this.processScore(currentScore);
                    }
                    
                    statusMessage.textContent = '';
                    statusMessage.className = 'status-message';
                    
                    // Only show the leaderboard if the score is high enough
                    if (currentScore >= (this.scoreThreshold || 5000)) {
                        if (this.showLeaderboard) {
                            this.showLeaderboard();
                        }
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
        };
        
        console.log('LeaderboardManager handleUsernameSubmission method patched successfully');
    }
})();
