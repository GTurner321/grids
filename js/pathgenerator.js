// pathgenerator.js - Modified to remove end cell corner restriction

// Use variables instead of constants to support different grid sizes
let GRID_SIZE = 10;
let MIN_PATH_LENGTH = 34;
let MAX_PATH_LENGTH = 100;

// Add function to set grid size and adjust parameters
export function setGridSize(size) {
    GRID_SIZE = size;
    
    // Adjust path length requirements based on grid size
    if (size === 6) {
        MIN_PATH_LENGTH = 16; // 5 sums, including start and end cell
        MAX_PATH_LENGTH = 34; // Cap at a reasonable length for smaller grid
    } else {
        MIN_PATH_LENGTH = 34; // Original minimum for 10x10 grid
        MAX_PATH_LENGTH = 100; // Original maximum
    }
}

// Function to check if a cell is valid as end cell
// We're no longer requiring it to be a corner
function isValidEndCell([x, y]) {
    // End cells can now be any cell at the edge of the grid
    // This makes edges and corners valid end points
    return x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1;
}

function getRandomStart() {
    // Start cell should be away from the edges (to avoid very short paths)
    const x = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
    const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
    return [x, y];
}

function isValidLength(length) {
    if (length < MIN_PATH_LENGTH || length > MAX_PATH_LENGTH) return false;
    return (length - 1) % 3 === 0;
}

function getValidMoves(current, visited) {
    const [x, y] = current;
    const possibleMoves = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
    ];
    
    return possibleMoves.filter(([newX, newY]) => {
        // Check if move is within grid
        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return false;
        
        // Check if position has been visited
        return !visited.some(([visitedX, visitedY]) => 
            visitedX === newX && visitedY === newY
        );
    });
}

function findPath(start) {
    const visited = [start];
    
    function dfs(current) {
        // Check if we've reached an edge with valid length
        if (isValidEndCell(current) && isValidLength(visited.length)) {
            return true;
        }
        
        // If we've reached an edge but length is invalid, or exceeded max length, backtrack
        if ((isValidEndCell(current) && !isValidLength(visited.length)) || 
            visited.length >= MAX_PATH_LENGTH) {
            return false;
        }
        
        const validMoves = getValidMoves(current, visited);
        
        // Shuffle valid moves for randomness
        for (let i = validMoves.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validMoves[i], validMoves[j]] = [validMoves[j], validMoves[i]];
        }
        
        for (const move of validMoves) {
            visited.push(move);
            if (dfs(move)) {
                return true;
            }
            visited.pop();
        }
        
        return false;
    }
    
    if (dfs(start)) {
        return visited;
    }
    return null;
}

export async function generatePath(gridSize = 10) {
    // Set grid size before generating path
    setGridSize(gridSize);
    
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 1000;
        
        function attempt() {
            attempts++;
            const start = getRandomStart();
            const path = findPath(start);
            
            if (path) {
                resolve(path);
            } else if (attempts >= maxAttempts) {
                reject(new Error(`Failed to generate valid path for grid size ${gridSize} after maximum attempts`));
            } else {
                // Use setTimeout to prevent call stack overflow and allow UI updates
                setTimeout(attempt, 0);
            }
        }
        
        attempt();
    });
}

export function validatePath(path) {
    if (!Array.isArray(path)) return false;
    if (!isValidLength(path.length)) return false;
    if (!isValidEndCell(path[path.length - 1])) return false;
    
    // Check each step is adjacent
    for (let i = 1; i < path.length; i++) {
        const [prevX, prevY] = path[i - 1];
        const [currX, currY] = path[i];
        const dx = Math.abs(currX - prevX);
        const dy = Math.abs(currY - prevY);
        if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
            return false;
        }
    }
    
    // Check for revisits
    const visited = new Set(path.map(([x, y]) => `${x},${y}`));
    return visited.size === path.length;
}

export function convertCoordsToIndex([x, y]) {
    return y * GRID_SIZE + x;
}

export function convertIndexToCoords(index) {
    return [index % GRID_SIZE, Math.floor(index / GRID_SIZE)];
}

// Getter functions that account for the current grid size
export const getGridSize = () => GRID_SIZE;
export const getMinPathLength = () => MIN_PATH_LENGTH;
export const getMaxPathLength = () => MAX_PATH_LENGTH;
