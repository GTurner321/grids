// global-bridge.js - Add this as a separate file and load it FIRST in your HTML
// This helps ensure communication between modules works reliably

console.log('Global bridge script loading...');

(function() {
    // Setup global level start function that will work even before modules are loaded
    window.startLevel = function(level) {
        console.log(`[Global Bridge] Request to start level ${level}`);
        
        // Try direct controller access
        if (window.gameController && typeof window.gameController.startLevel === 'function') {
            console.log('[Global Bridge] Using gameController.startLevel directly');
            window.gameController.startLevel(level);
            return;
        }
        
        // Dispatch event as fallback
        console.log('[Global Bridge] Dispatching startLevelRequest event');
        document.dispatchEvent(new CustomEvent('startLevelRequest', {
            detail: { level: level },
            bubbles: true
        }));
    };
    
    // Create event listeners for startLevelRequest that persist through the app lifecycle
    document.addEventListener('startLevelRequest', function(event) {
        console.log('[Global Bridge] Received startLevelRequest:', event.detail);
        
        // Wait for gameController to be available
        if (!window.gameController || typeof window.gameController.startLevel !== 'function') {
            console.log('[Global Bridge] gameController not available yet, will retry');
            
            // Set up a retry mechanism
            let attempts = 0;
            const maxAttempts = 20;
            const retry = function() {
                attempts++;
                console.log(`[Global Bridge] Retry attempt ${attempts}`);
                
                if (window.gameController && typeof window.gameController.startLevel === 'function') {
                    console.log(`[Global Bridge] gameController found on attempt ${attempts}, starting level`);
                    window.gameController.startLevel(event.detail.level);
                    return true;
                }
                
                if (attempts >= maxAttempts) {
                    console.error('[Global Bridge] Failed to find gameController after max attempts');
                    return false;
                }
                
                setTimeout(retry, 100);
            };
            
            setTimeout(retry, 100);
        } else {
            // If gameController is already available, use it
            console.log('[Global Bridge] gameController available, starting level');
            window.gameController.startLevel(event.detail.level);
        }
    });
    
    console.log('Global bridge script loaded');
})();
