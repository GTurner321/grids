// messages.js - Centralized Message Controller
// This file manages all in-game messages and ensures they're displayed appropriately

class MessageController {
    constructor() {
        // Message state tracking
        this.state = {
            hasUsedSparesButton: false,
            spareHintShown: false,
            pathStarted: false,
            roundComplete: false,
            currentLevel: null,
            shownUnlockMessages: {
                midLevels: false,  // For levels 4-6
                highLevels: false, // For levels 7-10
                allLevels: false   // For completing all levels
            },
            messageElement: null,
            messageTimeout: null
        };
        
        // Bind methods to this instance
        this.showMessage = this.showMessage.bind(this);
        this.resetMessageState = this.resetMessageState.bind(this);
        this.showDefaultMessage = this.showDefaultMessage.bind(this);
        
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
        
        // Make this instance globally available
        window.messageController = this;
    }
    
    initialize() {
        // Find the message element
        this.state.messageElement = document.getElementById('game-messages');
        
        // Show initial message
        this.showDefaultMessage();
        
        console.log('Message controller initialized');
    }
    
    /**
     * Shows a message to the user
     * @param {string} text - Message text to display
     * @param {string} type - Message type (info, error, success)
     * @param {number|null} duration - How long to show message before reverting to default (null = permanent)
     */
    showMessage(text, type = 'info', duration = null) {
        const { messageElement } = this.state;
        if (!messageElement) return;
        
        // Clear any existing timeout
        if (this.state.messageTimeout) {
            clearTimeout(this.state.messageTimeout);
            this.state.messageTimeout = null;
        }
        
        // Clear previous content
        messageElement.innerHTML = '';
        
        // Track special messages
        this.trackSpecialMessages(text);
        
        // Format message based on content
        this.formatMessage(text, messageElement);
        
        // Set message styling
        messageElement.className = type ? `styled-box ${type}` : 'styled-box';
        
        // Handle congrats messages follow-up
        if (text.includes("Congratulations!")) {
            this.scheduleFollowUpMessage(10000);
        }
        
        // Handle message timeout and default messages
        if (duration) {
            this.state.messageTimeout = setTimeout(() => {
                this.state.messageTimeout = null;
                this.showDefaultMessage();
            }, duration);
        }
    }
    
    /**
     * Track state based on special messages
     * @param {string} text - Message text
     */
    trackSpecialMessages(text) {
        // Track unlock messages
        if (text.includes("You have unlocked levels 4 to 6")) {
            this.state.shownUnlockMessages.midLevels = true;
        } else if (text.includes("You have unlocked levels 7 to 10")) {
            this.state.shownUnlockMessages.highLevels = true;
        } else if (text.includes("You have completed all levels")) {
            this.state.shownUnlockMessages.allLevels = true;
        }
        
        // Track path started state
        if (text === "Path started! Continue by selecting connected cells.") {
            this.state.pathStarted = true;
        } else if (text === "Path reset. Start again from the green square.") {
            this.state.pathStarted = false;
        }
        
        // Track spare hint
        if (text === "Hint: Consider removing some of the spare cells to make the puzzle easier!") {
            this.state.spareHintShown = true;
        }
    }
    
    /**
     * Format message with special handling for certain messages
     * @param {string} text - Message text
     * @param {HTMLElement} element - Message element
     */
    formatMessage(text, element) {
        // Special case for removed spares
        if (text.includes("Removed")) {
            // Main message
            const mainMessage = document.createElement('div');
            mainMessage.textContent = text;
            element.appendChild(mainMessage);
            
            // Penalty message
            const penaltyMessage = document.createElement('div');
            penaltyMessage.className = 'penalty-message';
            penaltyMessage.textContent = '(-1/3 points)';
            element.appendChild(penaltyMessage);
        } 
        else if (text === 'Path is mathematically correct! Continue to the end square.') {
            // Changed message
            const mainMessage = document.createElement('div');
            mainMessage.textContent = 'Path is mathematically correct!';
            element.appendChild(mainMessage);
            
            // Penalty message
            const penaltyMessage = document.createElement('div');
            penaltyMessage.className = 'penalty-message';
            penaltyMessage.textContent = '(-1/4 points)';
            element.appendChild(penaltyMessage);
        }
        else {
            // Regular message without penalty
            element.textContent = text;
        }
    }
    
    /**
     * Show the appropriate default message based on current state
     */
    showDefaultMessage() {
        if (this.state.roundComplete) {
            this.showCompletionFollowUp();
        } else if (this.state.pathStarted) {
            this.showMessage("Path started! Continue by selecting connected cells.");
        } else {
            this.showMessage("Find the path by following the mathematical sequence.");
        }
    }
    
    /**
     * Schedule a follow-up message after completion
     * @param {number} delay - Delay in milliseconds
     */
    scheduleFollowUpMessage(delay) {
        setTimeout(() => {
            this.showCompletionFollowUp();
        }, delay);
    }
    
    /**
     * Show the appropriate follow-up message after level completion
     */
    showCompletionFollowUp() {
        // Determine which levels are unlocked by checking levelTracker
        const allLevelsUnlocked = window.levelTracker && 
            [4, 5, 6].some(lvl => window.levelTracker.completedLevels.has(lvl));
        
        const isLevel10Completed = window.levelTracker && 
            window.levelTracker.completedLevels.has(10);
        
        if (isLevel10Completed) {
            this.showMessage("You completed the highest level! Select a level of your choice for a better score.", 'info');
        } else if (allLevelsUnlocked) {
            this.showMessage("Scroll through and select a new level from 1 to 10 to continue.", 'info');
        } else {
            this.showMessage("Scroll through and select a new level from 1 to 6 to continue.", 'info');
        }
    }
    
    /**
     * Handle when a new level is started
     * @param {number} level - Level number
     */
    onLevelStart(level) {
        this.state.currentLevel = level;
        this.state.pathStarted = false;
        this.state.roundComplete = false;
        
        // Show the default starting message
        this.showMessage("Find the path by following the mathematical sequence.");
        
        // Schedule the spares hint if needed
        this.scheduleSparesHint();
    }
    
    /**
     * Schedule the spares hint message
     */
    scheduleSparesHint() {
        if (this.state.currentLevel > 1 && 
            !this.state.hasUsedSparesButton && 
            !this.state.spareHintShown) {
            setTimeout(() => {
                this.showMessage("Hint: Consider removing some of the spare cells to make the puzzle easier!", 'info', 10000);
            }, 10000);
        }
    }
    
    /**
     * Handle when path is started
     */
    onPathStarted() {
        this.state.pathStarted = true;
        this.showMessage("Path started! Continue by selecting connected cells.");
    }
    
    /**
     * Handle when path is reset
     */
    onPathReset() {
        this.state.pathStarted = false;
        this.showMessage("Path reset. Start again from the green square.");
    }
    
    /**
     * Handle when spares button is used
     * @param {number} count - Number of cells removed
     */
    onSparesRemoved(count) {
        this.state.hasUsedSparesButton = true;
        this.showMessage(`Removed ${count} spare cells.`);
    }
    
    /**
     * Handle when a level is completed
     * @param {number} level - Completed level number
     */
    onLevelCompleted(level) {
        this.state.roundComplete = true;
        
        // Determine which congratulation message to show
        let message = 'Congratulations! Puzzle solved!';
        
        // If this is the first time unlocking levels 4-6
        const unlockedMidLevels = level <= 3 && !this.state.shownUnlockMessages.midLevels &&
            window.levelTracker && [1, 2, 3].some(lvl => window.levelTracker.completedLevels.has(lvl));
            
        // If this is the first time unlocking levels 7-10
        const unlockedHighLevels = level >= 4 && level <= 6 && 
            !this.state.shownUnlockMessages.highLevels &&
            window.levelTracker && [4, 5, 6].some(lvl => window.levelTracker.completedLevels.has(lvl));
        
        // If all levels are completed for the first time
        const completedAllLevels = window.levelTracker && window.levelTracker.completedLevels.size === 10 &&
            !this.state.shownUnlockMessages.allLevels;
        
        if (unlockedMidLevels) {
            message = 'Congratulations! Puzzle solved! You have unlocked levels 4 to 6. Complete all levels to turn the score bar green.';
            this.state.shownUnlockMessages.midLevels = true;
        } else if (unlockedHighLevels) {
            message = 'Congratulations! Puzzle solved! You have unlocked levels 7 to 10.';
            this.state.shownUnlockMessages.highLevels = true;
        } else if (completedAllLevels) {
            message = 'Congratulations! You have completed all levels!';
            this.state.shownUnlockMessages.allLevels = true;
        }
        
        this.showMessage(message, 'success');
    }
    
    /**
     * Reset the message controller state
     */
    resetMessageState() {
        this.state = {
            ...this.state,
            hasUsedSparesButton: false,
            spareHintShown: false,
            pathStarted: false,
            roundComplete: false,
            shownUnlockMessages: {
                midLevels: false,
                highLevels: false,
                allLevels: false
            }
        };
    }
}

// Initialize the message controller
const messageController = new MessageController();

// Export for module usage
export default messageController;
