// Modal Visibility Fix
// This script fixes the issue with modals not being visible despite existing in the DOM
// Apply this after your other scripts are loaded

(function() {
    // Wait for DOM to be ready
    function init() {
        console.log('Initializing modal visibility fix...');
        
        // Check if leaderboardManager exists and patch its methods
        if (window.leaderboardManager) {
            patchLeaderboardManager(window.leaderboardManager);
        } else {
            // If not found, wait for it to be created
            const checkInterval = setInterval(() => {
                if (window.leaderboardManager) {
                    clearInterval(checkInterval);
                    patchLeaderboardManager(window.leaderboardManager);
                }
            }, 200);
            
            // Stop checking after 10 seconds to prevent infinite loop
            setTimeout(() => clearInterval(checkInterval), 10000);
        }
        
        // Also ensure modal markup has the correct styling
        ensureModalCssIsApplied();
    }
    
    // Patch the leaderboardManager methods to fix modal visibility
    function patchLeaderboardManager(manager) {
        console.log('Patching leaderboardManager modal methods...');
        
        // Store original methods as references
        const originalShowUsername = manager.showUsernameModal;
        const originalHideUsername = manager.hideUsernameModal;
        const originalShowLeaderboard = manager.showLeaderboardModal;
        const originalHideLeaderboard = manager.hideLeaderboardModal;
        
        // Replace showUsernameModal with fixed version
        manager.showUsernameModal = function() {
            // Call original method if it exists
            if (typeof originalShowUsername === 'function') {
                originalShowUsername.call(manager);
            }
            
            // Apply direct styles to ensure visibility
            const modal = document.getElementById('username-area-container');
            if (!modal) return;
            
            console.log('Applying direct styles to username modal');
            
            // Force the modal to be visible with direct style manipulation
            Object.assign(modal.style, {
                display: 'flex',
                visibility: 'visible',
                opacity: '1',
                zIndex: '10000',
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                boxSizing: 'border-box'
            });
            
            // Add visible class for animation effects
            modal.classList.add('visible');
            
            // Focus the input field
            setTimeout(() => {
                const input = document.getElementById('username-input');
                if (input) input.focus();
            }, 100);
            
            // Make sure the username area itself is visible
            const usernameArea = modal.querySelector('.username-area');
            if (usernameArea) {
                Object.assign(usernameArea.style, {
                    display: 'block',
                    visibility: 'visible',
                    opacity: '1',
                    zIndex: '10001',
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                    maxWidth: '340px',
                    width: '92%',
                    padding: '15px',
                    margin: '0 auto'
                });
            }
        };
        
        // Replace hideUsernameModal with fixed version
        manager.hideUsernameModal = function() {
            // Call original method if it exists
            if (typeof originalHideUsername === 'function') {
                originalHideUsername.call(manager);
            }
            
            const modal = document.getElementById('username-area-container');
            if (!modal) return;
            
            console.log('Hiding username modal with direct styles');
            
            // Remove the visible class
            modal.classList.remove('visible');
            
            // Use setTimeout to ensure animation completes before hiding
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                modal.style.opacity = '0';
            }, 300);
        };
        
        // Replace showLeaderboardModal with fixed version
        manager.showLeaderboardModal = function() {
            // Call original method if it exists
            if (typeof originalShowLeaderboard === 'function') {
                originalShowLeaderboard.call(manager);
            }
            
            // Apply direct styles to ensure visibility
            const modal = document.getElementById('leaderboard-table-container');
            if (!modal) return;
            
            console.log('Applying direct styles to leaderboard modal');
            
            // Force the modal to be visible with direct style manipulation
            Object.assign(modal.style, {
                display: 'flex',
                visibility: 'visible',
                opacity: '1',
                zIndex: '10000',
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                boxSizing: 'border-box'
            });
            
            // Add visible class for animation effects
            modal.classList.add('visible');
            
            // Make sure the leaderboard table itself is visible
            const leaderboardTable = modal.querySelector('.leaderboard-table');
            if (leaderboardTable) {
                Object.assign(leaderboardTable.style, {
                    display: 'block',
                    visibility: 'visible',
                    opacity: '1',
                    zIndex: '10001',
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                    maxWidth: '480px',
                    width: '100%',
                    maxHeight: '400px',
                    overflowY: 'auto'
                });
            }
            
            // Also ensure the title and close button are visible
            const title = modal.querySelector('.leaderboard-title');
            if (title) {
                title.style.color = 'white';
                title.style.marginBottom = '15px';
                title.style.zIndex = '10001';
            }
            
            const closeBtn = modal.querySelector('#close-leaderboard-btn');
            if (closeBtn) {
                closeBtn.style.marginTop = '15px';
                closeBtn.style.zIndex = '10001';
            }
        };
        
        // Replace hideLeaderboardModal with fixed version
        manager.hideLeaderboardModal = function() {
            // Call original method if it exists
            if (typeof originalHideLeaderboard === 'function') {
                originalHideLeaderboard.call(manager);
            }
            
            const modal = document.getElementById('leaderboard-table-container');
            if (!modal) return;
            
            console.log('Hiding leaderboard modal with direct styles');
            
            // Remove the visible class
            modal.classList.remove('visible');
            
            // Use setTimeout to ensure animation completes before hiding
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                modal.style.opacity = '0';
            }, 300);
        };
        
        // Patch isModalOpen to check specifically for visibility
        manager.isModalOpen = function() {
            const usernameModal = document.getElementById('username-area-container');
            const leaderboardModal = document.getElementById('leaderboard-table-container');
            
            const usernameModalVisible = usernameModal && 
                                      window.getComputedStyle(usernameModal).display !== 'none' &&
                                      window.getComputedStyle(usernameModal).visibility !== 'hidden';
            
            const leaderboardModalVisible = leaderboardModal && 
                                        window.getComputedStyle(leaderboardModal).display !== 'none' &&
                                        window.getComputedStyle(leaderboardModal).visibility !== 'hidden';
            
            return usernameModalVisible || leaderboardModalVisible;
        };
        
        // Add a debug method to help troubleshoot modal issues
        manager.checkModalStatus = function() {
            const usernameModal = document.getElementById('username-area-container');
            const leaderboardModal = document.getElementById('leaderboard-table-container');
            
            console.log('=== MODAL STATUS ===');
            
            if (usernameModal) {
                const usernameStyles = window.getComputedStyle(usernameModal);
                console.log('Username Modal:', { 
                    exists: true,
                    display: usernameStyles.display,
                    visibility: usernameStyles.visibility,
                    opacity: usernameStyles.opacity,
                    zIndex: usernameStyles.zIndex,
                    hasVisibleClass: usernameModal.classList.contains('visible')
                });
            } else {
                console.log('Username Modal: Does not exist in DOM');
            }
            
            if (leaderboardModal) {
                const leaderboardStyles = window.getComputedStyle(leaderboardModal);
                console.log('Leaderboard Modal:', { 
                    exists: true,
                    display: leaderboardStyles.display,
                    visibility: leaderboardStyles.visibility,
                    opacity: leaderboardStyles.opacity,
                    zIndex: leaderboardStyles.zIndex,
                    hasVisibleClass: leaderboardModal.classList.contains('visible')
                });
            } else {
                console.log('Leaderboard Modal: Does not exist in DOM');
            }
            
            console.log('===============');
        };
        
        console.log('Modal methods patched successfully');
    }
    
    // Ensure modal CSS is applied correctly
    function ensureModalCssIsApplied() {
        // Add a style element with critical modal CSS
        const style = document.createElement('style');
        style.textContent = `
            /* Critical modal styles with high specificity */
            body > #username-area-container.visible,
            body > #leaderboard-table-container.visible {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 10000 !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: rgba(0, 0, 0, 0.75) !important;
                animation: modalFadeInFixed 0.3s ease-in-out forwards !important;
            }
            
            @keyframes modalFadeInFixed {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* Inner content styles */
            body > #username-area-container .username-area,
            body > #leaderboard-table-container .leaderboard-table {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 10001 !important;
                position: relative !important;
                background-color: white !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
            }
            
            /* Username area specific sizing */
            body > #username-area-container .username-area {
                width: 92% !important;
                max-width: 340px !important;
                padding: 15px !important;
                margin: 0 auto !important;
            }
            
            /* Leaderboard specific sizing */
            body > #leaderboard-table-container .leaderboard-table {
                width: 100% !important;
                max-width: 480px !important;
                max-height: 400px !important;
                overflow-y: auto !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            
            /* Ensure titles and buttons in modals are visible */
            body > #leaderboard-table-container .leaderboard-title {
                color: white !important;
                margin-bottom: 15px !important;
                z-index: 10001 !important;
            }
            
            body > #leaderboard-table-container #close-leaderboard-btn {
                margin-top: 15px !important;
                z-index: 10001 !important;
            }
            
            /* Override styles for close button */
            body #return-to-record-btn {
                position: absolute !important;
                top: 10px !important;
                right: 10px !important;
                z-index: 10001 !important;
            }
            
            @media (max-width: 768px) {
                /* Mobile adjustments */
                body > #username-area-container .username-area {
                    width: 95% !important;
                    padding: 10px !important;
                }
                
                body > #leaderboard-table-container .leaderboard-table {
                    width: 95% !important;
                }
                
                /* Move return button to bottom right on mobile */
                body #return-to-record-btn {
                    top: auto !important;
                    bottom: 10px !important;
                    right: 10px !important;
                }
            }
        `;
        
        document.head.appendChild(style);
        console.log('Critical modal CSS applied');
    }
    
    // Additional function to manually fix and open modals if needed
    window.fixAndOpenUsernameModal = function() {
        const modal = document.getElementById('username-area-container');
        if (!modal) {
            console.error('Username modal not found in DOM');
            return;
        }
        
        Object.assign(modal.style, {
            display: 'flex',
            visibility: 'visible',
            opacity: '1',
            zIndex: '10000',
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        });
        
        modal.classList.add('visible');
        
        const usernameArea = modal.querySelector('.username-area');
        if (usernameArea) {
            Object.assign(usernameArea.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                zIndex: '10001',
                position: 'relative',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                maxWidth: '340px',
                width: '92%',
                padding: '15px',
                margin: '0 auto'
            });
        }
        
        console.log('Manual username modal fix applied');
    };
    
    window.fixAndOpenLeaderboardModal = function() {
        const modal = document.getElementById('leaderboard-table-container');
        if (!modal) {
            console.error('Leaderboard modal not found in DOM');
            return;
        }
        
        Object.assign(modal.style, {
            display: 'flex',
            visibility: 'visible',
            opacity: '1',
            zIndex: '10000',
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        });
        
        modal.classList.add('visible');
        
        const leaderboardTable = modal.querySelector('.leaderboard-table');
        if (leaderboardTable) {
            Object.assign(leaderboardTable.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                zIndex: '10001',
                position: 'relative',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                maxWidth: '480px',
                width: '100%',
                maxHeight: '400px',
                overflowY: 'auto'
            });
        }
        
        // Also ensure the title and close button are visible
        const title = modal.querySelector('.leaderboard-title');
        if (title) {
            title.style.color = 'white';
            title.style.marginBottom = '15px';
            title.style.zIndex = '10001';
        }
        
        const closeBtn = modal.querySelector('#close-leaderboard-btn');
        if (closeBtn) {
            closeBtn.style.marginTop = '15px';
            closeBtn.style.zIndex = '10001';
        }
        
        console.log('Manual leaderboard modal fix applied');
    };
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
