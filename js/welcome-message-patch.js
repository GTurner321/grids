// This update adds auto-hiding welcome message functionality

/**
 * Function to handle username submission success
 * @param {string} username - The submitted username
 */
function handleUsernameSuccess(username) {
    // Update the level selector title to include the username
    const levelSelectorTitle = document.querySelector('.level-selector-title');
    if (levelSelectorTitle) {
        levelSelectorTitle.textContent = `CHOOSE YOUR LEVEL, ${username}`;
    }
    
    // Hide the username submission area
    const usernameAreaContainer = document.getElementById('username-area-container');
    if (usernameAreaContainer) {
        // Add smooth fade-out transition
        usernameAreaContainer.style.transition = 'opacity 1s ease-out';
        usernameAreaContainer.style.opacity = '0';
        
        // After transition, hide the element
        setTimeout(() => {
            usernameAreaContainer.style.display = 'none';
        }, 1000);
    }
    
    // Hide the record score button
    const recordScoreBtn = document.getElementById('record-score-btn');
    if (recordScoreBtn) {
        recordScoreBtn.style.display = 'none';
    }
}

export default handleUsernameSuccess;
