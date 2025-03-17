// game-initializer.js - updated to include rules module

import GameController from './gamecontroller.js';
import './rules.js'; // Import rules to ensure it loads properly

function initializeGame() {
    console.log('Initializing game...');
    
    // Detect device capabilities first
    detectDeviceCapabilities();
    
    // Fix viewport height issues on mobile devices
    fixViewportHeight();
    
    // Initialize the game controller
    window.gameController = new GameController();
    
    console.log('Game initialized successfully');
}

function detectDeviceCapabilities() {
    // Detect touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
        console.log('Touch device detected');
        
        // Detect iOS specifically
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            document.body.classList.add('ios-device');
            console.log('iOS device detected');
        }
        
        // Add more detailed touch handling
        document.addEventListener('touchstart', preventZoomOnDoubleTap, { passive: false });
    }
}

function fixViewportHeight() {
    // Fix the iOS viewport height issue
    const setVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    
    // Set the initial value
    setVh();
    
    // Update on resize and orientation change
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
}

function preventZoomOnDoubleTap(e) {
    // Prevent zoom on double tap for touch devices
    if (e.touches.length > 1) {
        // More than one finger - allow pinch gestures
        return;
    }
    
    const target = e.target;
    
    // Don't prevent default for form elements
    const isFormElement = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.tagName === 'SELECT' || 
                         target.tagName === 'BUTTON';
    
    if (!isFormElement) {
        // For grid cells and other game elements, prevent zoom
        const isGameElement = target.closest('.grid-cell') || 
                             target.closest('.game-controls') ||
                             target.closest('.level-btn');
        
        if (isGameElement) {
            e.preventDefault();
        }
    }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeGame);

// Add event listener for device orientation changes
window.addEventListener('orientationchange', () => {
    console.log('Orientation changed, updating layout...');
    setTimeout(fixViewportHeight, 200);
});

// Add a global error handler to help debug mobile issues
window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.message, 'at', e.filename, ':', e.lineno);
});
