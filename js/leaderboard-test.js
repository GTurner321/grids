// leaderboard-test.js - Helper script to test leaderboard functionality

// Wait for page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Leaderboard test script loaded');
    
    // Wait for both scoreManager and leaderboardManager to be available
    const checkInterval = setInterval(() => {
        if (window.scoreManager && window.leaderboardManager) {
            clearInterval(checkInterval);
            console.log('Both scoreManager and leaderboardManager available, initializing test tools');
            initLeaderboardTesting();
        }
    }, 100);
    
    // Stop checking after 10 seconds to prevent infinite loop
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 10000);
});

function initLeaderboardTesting() {
    // Add a small test panel to the page
    const testPanel = document.createElement('div');
    testPanel.style.position = 'fixed';
    testPanel.style.bottom = '10px';
    testPanel.style.right = '10px';
    testPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    testPanel.style.padding = '10px';
    testPanel.style.borderRadius = '5px';
    testPanel.style.border = '1px solid #ccc';
    testPanel.style.zIndex = '9999';
    testPanel.style.fontSize = '12px';
    testPanel.style.display = 'none'; // Hidden by default
    
    // Toggle button to show/hide the panel
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Test Tools';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '10000';
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.backgroundColor = '#f0f0f0';
    toggleButton.style.border = '1px solid #ccc';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = '12px';
    
    toggleButton.addEventListener('click', () => {
        if (testPanel.style.display === 'none') {
            testPanel.style.display = 'block';
            toggleButton.textContent = 'Hide Tools';
        } else {
            testPanel.style.display = 'none';
            toggleButton.textContent = 'Test Tools';
        }
    });
    
    // Add content to the test panel
    testPanel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold;">Leaderboard Test Tools</div>
        <div style="margin-bottom: 5px;">
            <label>Add Points: 
                <select id="test-points">
                    <option value="1000">1000</option>
                    <option value="3000">3000</option>
                    <option value="5000">5000</option>
                    <option value="10000">10000</option>
                    <option value="20000">20000</option>
                </select>
            </label>
            <button id="add-points">Add</button>
        </div>
        <div style="margin-bottom: 5px;">
            <button id="refresh-leaderboard">Refresh Leaderboard</button>
        </div>
        <div style="margin-bottom: 5px;">
            <button id="reset-score">Reset Score</button>
        </div>
        <div id="test-status" style="margin-top: 10px; font-size: 11px;"></div>
    `;
    
    // Add event listeners to the buttons
    document.body.appendChild(testPanel);
    document.body.appendChild(toggleButton);
    
    // Add points button
    const addPointsButton = document.getElementById('add-points');
    if (addPointsButton) {
        addPointsButton.addEventListener('click', () => {
            const pointsSelect = document.getElementById('test-points');
            const points = parseInt(pointsSelect.value, 10);
            
            // Add points to score manager
            if (window.scoreManager) {
                window.scoreManager.totalScore += points;
                window.scoreManager.updateDisplay();
                updateStatus(`Added ${points} points. New total: ${window.scoreManager.totalScore}`);
            }
        });
    }
    
    // Refresh leaderboard button
    const refreshButton = document.getElementById('refresh-leaderboard');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            if (window.leaderboardManager) {
                window.leaderboardManager.refreshLeaderboard();
                updateStatus('Refreshed leaderboard');
            }
        });
    }
    
    // Reset score button
    const resetButton = document.getElementById('reset-score');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (window.scoreManager) {
                window.scoreManager.resetScores();
                updateStatus('Reset score to 0');
            }
        });
    }
    
    function updateStatus(message) {
        const statusElement = document.getElementById('test-status');
        if (statusElement) {
            const timestamp = new Date().toLocaleTimeString();
            statusElement.innerHTML = `${timestamp}: ${message}<br>${statusElement.innerHTML}`;
            
            // Limit status messages
            const lines = statusElement.innerHTML.split('<br>');
            if (lines.length > 5) {
                statusElement.innerHTML = lines.slice(0, 5).join('<br>');
            }
        }
    }
    
    // Log initial state
    updateStatus('Test tools initialized');
}
