// game-image-handler.js
// Script to add an example image under the title that disappears when game starts

document.addEventListener('DOMContentLoaded', function() {
    // Create the image container with similar styling to rules-box
    const imageContainer = document.createElement('div');
    imageContainer.id = 'game-example-container';
    imageContainer.className = 'game-example-container';
    
    // Create the image element
    const exampleImage = document.createElement('img');
    exampleImage.src = 'images/gridgameexample1.png';
    exampleImage.alt = 'Grid Game Example';
    exampleImage.id = 'game-example-image';
    exampleImage.className = 'game-example-image';
    
    // Add the image to the container
    imageContainer.appendChild(exampleImage);
    
    // Find the right place to insert it - between header and level selector
    const gameHeader = document.querySelector('.game-header');
    const levelSelector = document.querySelector('.level-selector-container');
    
    if (gameHeader && levelSelector) {
        gameHeader.parentNode.insertBefore(imageContainer, levelSelector);
    }
    
    // Set up event handlers to hide image when a level is selected
    // Same approach as in rules.js
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', hideExampleImage);
    });
    
    // Add CSS styles dynamically
    addExampleImageStyles();
});

// Function to hide the example image when a level is selected
function hideExampleImage() {
    const imageContainer = document.getElementById('game-example-container');
    if (imageContainer) {
        imageContainer.style.opacity = '0';
        imageContainer.style.visibility = 'hidden';
        
        // After transition, remove from DOM
        setTimeout(() => {
            if (imageContainer && imageContainer.parentNode) {
                imageContainer.parentNode.removeChild(imageContainer);
            }
        }, 500);
    }
}

// Function to add the required styles
function addExampleImageStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Example Image Container Styles */
        .game-example-container {
            width: 50%; /* 50% width on large screens */
            max-width: 640px;
            margin: 10px auto 15px;
            text-align: center;
            transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
            box-sizing: border-box;
            z-index: 50;
            position: relative;
        }
        
        .game-example-image {
            max-width: 100%;
            height: auto;
            border: 2px solid #60a5fa; /* Blue border like the level buttons */
            border-radius: 6px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        /* Game active state handling for example image */
        .game-container.game-active .game-example-container {
            display: none;
            opacity: 0;
            visibility: hidden;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
            .game-example-container {
                width: 95%; /* 95% width on small screens */
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Export an empty default for module systems
export default {};
