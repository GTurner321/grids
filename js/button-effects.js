// button-effects.js - Combined version with touch device fixes

// Check if we're on a touch device
function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

function enableButtonFeedback() {
    // Create audio element for tock sound
    const tockSound = new Audio();
    tockSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAYuAAYGBgYJCQkJCQwMDAwMDw8PDw8SUlJSUlVVVVVVWFhYWFhbW1tbW15eXl5eYaGhoaGkpKSkpKenp6enqqqqqqqtra2trbDw8PDw8/Pz8/P29vb29vn5+fn5/Pz8/Pz//////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYAAAAAAAAAGLj3cBLmAAAAAAD/+9DEAAAIpINH9BEAJdRG6X81kAIAIxEhISEhCEAQBAEHygCAIA/B8MHz8+D58Hz/ygEHwfP/lA+D4Pn/8oCDu7AIQBAEAQBA7+CAIAgCAIHfwQBAEAQBA7+CAIAgCAIANbsAXzEsOXsQQ9AOASBI3sKoBl0vJ0yLRVJUlilGmjg7LZryI8QOCiLJL1MsNLlrzyA8XFJijEMTIamRLjoIoRxpfaVWpkvNxslk4l6aX2pJySybSlUa1stbfXnrXZIHHjxRgAADTgGnL3GDl8rYHyPJgvEPyb4kWRUzBFKg1sSY24WUu2TbO6JZlJLmU5ttqKvLm9xzfrSk1JbZP7U4lMthbknJ1t2SZbMtubZcvLOW2yT8su7bf//5J//+5Zf7m3//2///wGBFDTCMFQQeUgQMGYZkAAAwHAWZaVaGqdiaCDQ49BHGMxhocV48VZicGI2j8MO42OIQQFQmb94XMIxoMW0vJj8NdTcwL9AbmzCDQ32wAgZgUQNUZBkwKAFhA5d9ZgQTb//pMrfTHYQGlGTBoAChC73vdcuYFCpkyXDM+kzRcMyRcwcEAGgMAYGC4RgKVgFAJQFDBFEWqPRXzDcQ0gg4OAJM1gDLJDiwQwCQM6DmTBWCiocwNAMFgAYQKFp0T/+9DEFwAL2Q9N7GWtwXaVai2HnbjATA0AjAEAgYAMBhgAACCQATAQAGDC4OOEglcGBsLlM5UlZIy9xfUSt6W7JFhYS3p/6v/+iYlipVov//UqlYqVaL//9VLGoqVYq6v0vZfpftKPSaeSuuGEwsCwILiYCgGSAyYHgRFwsmNoBAwfARmAQAUwZgHmAwAQwGAGGA4A0gJTBgACYEgBjAEACYCgBh8RwRmBoBoYF+JgoAgEC0wBAATAfwVMAoBgwAcAzAWAEMDIEQwIAETAkAJMB0AQwFADTR6FoYCoAJQ6CkMAMAEpCggWlA7HYWmAEAGVDRLy//5xDRt///ufhop3//9z5NJ93//9zptMRIITCyDMwEgDhAbTAXAdDQigwFwAjANAPMAIAgYBwDp8PxlgwBwHDBcBjMAoA4VDkwEQByAMGAcAGKhgYDQA5QMDAKAJMA0AkpAgEBJMAgAswAAAzAKAAMA0AgwCgBgsGEAWL5CmDMgHXJKraqv9HTSR4AAAAAAElFTkSuQmCC'; 
    tockSound.load();
    
    // Add click handler to all metallic buttons
    document.querySelectorAll('.metallic-button').forEach(button => {
        button.addEventListener('click', () => {
            // Play sound effect
            tockSound.currentTime = 0;
            tockSound.play().catch(e => console.log('Audio play failed:', e));
            
            // Add haptic feedback if supported
            if (navigator.vibrate) {
                navigator.vibrate(20); // 20ms vibration
            }
            
            // Add animation class
            button.classList.add('clicked');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                button.classList.remove('clicked');
                
                // Add touch device fixes to prevent hover state from persisting
                if (isTouchDevice()) {
                    // Force DOM reflow to reset CSS states
                    void button.offsetWidth;
                    
                    // Temporarily apply inline styles to reset hover effects
                    button.style.transform = "none";
                    button.style.background = getComputedStyle(document.documentElement)
                        .getPropertyValue('--btn-metal-light');
                    
                    // Remove inline styles after a short delay
                    setTimeout(() => {
                        button.style.transform = "";
                        button.style.background = "";
                    }, 50);
                }
            }, 200);
        });
    });
}

function setupTouchDeviceHandling() {
    // Add touch-device class to body for CSS targeting
    if (isTouchDevice()) {
        document.body.classList.add('touch-device');
        
        // Add additional listener to ensure buttons don't get stuck in hover state
        document.addEventListener('touchend', function() {
            // Short delay to allow normal click handlers to complete
            setTimeout(() => {
                // Find any buttons that might be stuck in hover state
                document.querySelectorAll('.metallic-button').forEach(button => {
                    // Only reset non-clicked buttons (to avoid interfering with click animation)
                    if (!button.classList.contains('clicked')) {
                        // Force a reflow to reset CSS states
                        void button.offsetWidth;
                    }
                });
            }, 300);
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    enableButtonFeedback();
    setupTouchDeviceHandling();
});
