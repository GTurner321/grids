// pathvalidator.js

/**
 * Extracts the numerical value from a cell, handling both direct numbers and symbols
 * @param {Object} cell - The cell object containing value information
 * @returns {number|null} The extracted numerical value
 */
import { getLevelConfig } from './sequencegenerator.js';

function extractValue(cell) {
    if (!cell) return null;

    // If cell has a type (from gridEntries)
    if (cell.type === 'number') {
        if (typeof cell.value === 'number') return cell.value;
        if (typeof cell.value === 'string' && cell.value.includes('/')) {
            const [num, den] = cell.value.split('/').map(Number);
            return num / den;
        }
        if (typeof cell.value === 'object' && cell.value.numerator && cell.value.denominator) {
            return cell.value.numerator / cell.value.denominator;
        }
    }
    
    // If cell has an operator value
    if (cell.type === 'operator') {
        return cell.value;
    }

    return null;
}

/**
 * Formats a value for display in error messages
 * @param {number|string} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
    if (typeof value === 'number') {
        return value % 1 === 0 ? value.toString() : value.toFixed(2);
    }
    return value.toString();
}

/**
 * Performs a mathematical calculation
 * @param {number} num1 - First number
 * @param {string} operator - Mathematical operator
 * @param {number} num2 - Second number
 * @returns {number|null} Result of calculation or null if invalid
 */
function calculate(num1, operator, num2) {
    try {
        switch(operator) {
            case '+': return num1 + num2;
            case '-': return num1 - num2;
            case 'x': return num1 * num2;
            case '/': 
                if (num2 === 0) return null;
                return num1 / num2;
            default: 
                console.warn('Invalid operator:', operator);
                return null;
        }
    } catch (error) {
        console.error('Calculation error:', error);
        return null;
    }
}

/**
 * Validates a sequence of four cells (number → operator → number = result)
 * @param {Array} sequence - Array of four consecutive cells
 * @param {number} expectedResult - Expected result of the calculation
 * @returns {Object} Validation result and error message if any
 */
function validateSequence(sequence) {
    if (sequence.length !== 4) {
        return { 
            isValid: false, 
            error: 'Invalid sequence length' 
        };
    }

    const [num1Cell, opCell, num2Cell, resultCell] = sequence;
    
    const num1 = extractValue(num1Cell);
    const operator = opCell.value;
    const num2 = extractValue(num2Cell);
    const expectedResult = extractValue(resultCell);

    if (num1 === null || num2 === null || expectedResult === null) {
        return { 
            isValid: false, 
            error: 'Invalid cell values' 
        };
    }

    const calculatedResult = calculate(num1, operator, num2);
    if (calculatedResult === null) {
        return { 
            isValid: false, 
            error: `Invalid calculation: ${formatValue(num1)} ${operator} ${formatValue(num2)}` 
        };
    }

    // Allow for small floating point differences
    const isCorrect = Math.abs(calculatedResult - expectedResult) < 0.0001;
    
    const steps = [];
    for (let i = 0; i < sequence.length - 1; i++) {
        steps.push(formatValue(extractValue(sequence[i])));
    }
    
    return {
        isValid: isCorrect,
        error: isCorrect ? null : `Not valid: ${formatValue(num1)} ${operator} ${formatValue(num2)} = ${formatValue(expectedResult)} is incorrect`,
        calculation: `${steps.join(' ')} = ${formatValue(expectedResult)}`,
        calculatedResult: calculatedResult
    };
}

/**
 * Validates the entire path
 * @param {Array} path - Array of cell indices
 * @param {Array} gridEntries - Array of all grid cell entries
 * @returns {Object} Validation result with details
 */
export function validatePath(path, gridEntries) {
    // Get the current level from game controller
    let currentLevel = null;
    if (window.gameController && window.gameController.state) {
        currentLevel = window.gameController.state.currentLevel;
    }
    
    // Get the grid size for the current level
    let gridSize = 10; // Default
    if (currentLevel) {
        const config = getLevelConfig(currentLevel);
        if (config && config.gridSize) {
            gridSize = config.gridSize;
        }
    }
    
    // First check if the path is continuous using the correct grid size
    if (!isPathContinuous(path, gridSize)) {
        return {
            isValid: false,
            error: 'Path must be continuous - cells must be adjacent!'
        };
    }

    // Path length minus 1 must be divisible by 3
    if ((path.length - 1) % 3 !== 0) {
        return {
            isValid: false,
            error: 'Invalid path length - each calculation requires 4 cells (number, operator, number, result)'
        };
    }

    // Get cells from grid entries
    const pathCells = path.map(index => gridEntries[index]);

    // Validate each sequence of 4 cells
    for (let i = 0; i < path.length - 3; i += 3) {
        const sequence = pathCells.slice(i, i + 4);
        const validation = validateSequence(sequence);
        
        if (!validation.isValid) {
            // Build a more descriptive error message
            const cellIndices = path.slice(i, i + 4);
            let errorMsg = validation.error;
            
            if (validation.calculation) {
                errorMsg = `Error at step ${Math.floor(i/3) + 1}: ${validation.calculation}`;
                if (validation.calculatedResult !== undefined) {
                    const expected = extractValue(sequence[3]);
                    errorMsg += ` (calculated ${formatValue(validation.calculatedResult)}, expected ${formatValue(expected)})`;
                }
            }
            
            return {
                isValid: false,
                error: errorMsg,
                failedAt: i + 1,
                cellIndices: cellIndices
            };
        }
    }

    return {
        isValid: true,
        error: null
    };
}

/**
 * Checks if cells are adjacent on the grid
 * @param {number} index1 - First cell index
 * @param {number} index2 - Second cell index
 * @param {number} gridSize - Size of the grid (width/height)
 * @returns {boolean} Whether cells are adjacent
 */
export function areAdjacent(index1, index2, gridSize = 10) {
    const x1 = index1 % gridSize;
    const y1 = Math.floor(index1 / gridSize);
    const x2 = index2 % gridSize;
    const y2 = Math.floor(index2 / gridSize);

    return (Math.abs(x1 - x2) === 1 && y1 === y2) || 
           (Math.abs(y1 - y2) === 1 && x1 === x2);
}

/**
 * Checks if all cells in path are adjacent
 * @param {Array} path - Array of cell indices
 * @param {number|null} currentLevel - Current game level (used to get grid size)
 * @returns {boolean} Whether path is continuous
 */
export function isPathContinuous(path, gridSize = 10) {
    // Empty or single-cell paths are considered continuous
    if (path.length <= 1) return true;
    
    // Check if each consecutive pair of cells is adjacent
    for (let i = 1; i < path.length; i++) {
        if (!areAdjacent(path[i-1], path[i], gridSize)) {
            return false;
        }
    }
    return true;
}
