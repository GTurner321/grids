// Complete fix for gridrenderer.js

import PuzzleSymbols from './puzzlesymbols.js';
import { addPathArrows } from './patharrows.js';

function formatForMathJax(value) {
    if (typeof value === 'string') {
        // Handle all operators with MathJax
        if (value === '+') return '$+$';
        if (value === '-') return '$-$';
        if (value === '/') return '$\\div$';
        if (value === 'x') return '$\\times$';
        
        // Handle raw fractions that didn't get converted to symbols
        if (value.includes('/')) {
            const [num, den] = value.split('/');
            return `$\\frac{${num}}{${den}}$`;
        }
    }
    
    // Handle regular numbers (7-99)
    if (typeof value === 'number' && value > 6) {
        return `$${value}$`;
    }
    
    return value;
}

function createCell(entry, index) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.dataset.index = index;
    
    if (entry) {
        if (entry.type === 'number') {
            const value = entry.value;
            let symbolValue;
            
            // Determine if it's a fraction or number
            if (typeof value === 'object' && value.numerator && value.denominator) {
                symbolValue = `${value.numerator}/${value.denominator}`;
            } else {
                symbolValue = value.toString();
            }
            
            // Try to create symbol
            const symbolSvg = PuzzleSymbols.createSymbol(symbolValue);
            
            if (symbolSvg) {
                // Handle SVG symbol (numbers 1-6 or fractions with denominators 2,3,4,5,6,8)
                const symbolContainer = document.createElement('div');
                symbolContainer.classList.add('symbol-container');
                symbolContainer.style.pointerEvents = 'none';
                symbolContainer.appendChild(symbolSvg);
                cell.appendChild(symbolContainer);
            } else {
                // Use MathJax for other numbers and fractions
                let mathJaxValue;
                if (symbolValue.includes('/')) {
                    const [num, den] = symbolValue.split('/');
                    mathJaxValue = `$\\frac{${num}}{${den}}$`;
                } else {
                    mathJaxValue = `$${symbolValue}$`;
                }
                cell.innerHTML = mathJaxValue;
            }
            
            cell.dataset.value = symbolValue;
            cell.classList.add('number');
        } else if (entry.type === 'operator') {
            cell.innerHTML = formatForMathJax(entry.value);
            cell.classList.add('operator');
        }
    }

    return cell;
}

export function renderGrid(gridEntries, options = {}) {
    const { startCoord, endCoord, gridSize = 10 } = options;
    const gridContainer = document.getElementById('grid-container');
    if (!gridContainer) return;

    // Clear existing grid
    gridContainer.innerHTML = '';
    
    // Remove any existing grid size classes
    gridContainer.classList.remove('grid-size-6', 'grid-size-10');
    
    // Add the appropriate grid size class
    gridContainer.classList.add(`grid-size-${gridSize}`);
    
    // Determine appropriate cell size
    let cellSize;
    if (gridSize === 6) {
        // For 6x6 grid, use larger cells
        cellSize = window.innerWidth <= 768 ? 'calc((100vw - 20px) / 6 - 1px)' : '67.5px';
    } else {
        // For 10x10 grid, use standard cells
        cellSize = window.innerWidth <= 768 ? 'calc((100vw - 20px) / 10 - 1px)' : '40px';
    }
    
    // Set grid template columns
    gridContainer.style.display = 'grid';
    gridContainer.style.gap = '1px';
    gridContainer.style.backgroundColor = '#94a3b8';
    gridContainer.style.padding = '1px';
    gridContainer.style.margin = '0 auto';
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${options.cellSize || cellSize})`;
    
    if (window.innerWidth > 768) {
        gridContainer.style.width = gridSize === 6 ? 'calc(6 * 67.5px + 7px)' : 'calc(10 * 40px + 11px)';
    } else {
        gridContainer.style.width = 'calc(100vw - 20px)';
    }
    
    // Create and append cells
    gridEntries.forEach((entry, index) => {
        // Skip cells beyond the grid size
        if (index >= gridSize * gridSize) return;
        
        const cell = createCell(entry, index);
        
        // Set explicit cell dimensions
        cell.style.width = options.cellSize || cellSize;
        cell.style.height = options.cellSize || cellSize;
        cell.style.backgroundColor = 'white';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.cursor = 'pointer';
        cell.style.border = '1px solid #e5e7eb';
        cell.style.position = 'relative';
        cell.style.overflow = 'hidden';
        cell.style.boxSizing = 'border-box';
        
        // Mark start and end cells
        if (startCoord && index === startCoord[1] * gridSize + startCoord[0]) {
            cell.classList.add('start-cell');
        }
        if (endCoord && index === endCoord[1] * gridSize + endCoord[0]) {
            cell.classList.add('end-cell');
        }
        
        gridContainer.appendChild(cell);
    });

    // Set score row width to match grid width
    const scoreRow = document.querySelector('.score-row');
    if (scoreRow) {
        scoreRow.style.width = gridContainer.style.width;
    }

    // Trigger MathJax to process any new content
    if (window.MathJax) {
        window.MathJax.typesetPromise([gridContainer]).catch((err) => {
            console.error('MathJax typesetting failed:', err);
        });
    }
}

export function updateCell(index, value) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    if (!cell) return;

    // Clear existing content
    cell.innerHTML = '';
    cell.className = 'grid-cell';
    
    if (value === null) {
        cell.classList.add('removed');
        return;
    }

    if (typeof value === 'object' && value.type === 'number') {
        const symbolSvg = PuzzleSymbols.createSymbol(value.value);
        
        if (symbolSvg) {
            const symbolContainer = document.createElement('div');
            symbolContainer.classList.add('symbol-container');
            symbolContainer.style.pointerEvents = 'none';
            symbolContainer.appendChild(symbolSvg);
            cell.appendChild(symbolContainer);
        } else {
            cell.innerHTML = formatForMathJax(value.value);
        }
        
        cell.dataset.value = value.value.toString();
        cell.classList.add('number');
    } else if (typeof value === 'object' && value.type === 'operator') {
        cell.innerHTML = formatForMathJax(value.value);
        cell.classList.add('operator');
    }

    // Trigger MathJax for the updated cell
    if (window.MathJax && cell.innerHTML.includes('$')) {
        window.MathJax.typesetPromise([cell]).catch((err) => {
            console.error('MathJax typesetting failed:', err);
        });
    }
}

export function highlightPath(path) {
    // Clear existing highlights
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('highlight', 'selected', 'start-cell-selected', 'end-cell-selected');
        
        // Restore original colors
        if (cell.classList.contains('start-cell')) {
            cell.style.backgroundColor = '#22c55e';  // Green for start cell
            cell.style.color = 'white';
        } else if (cell.classList.contains('end-cell')) {
            cell.style.backgroundColor = '#ef4444';  // Red for end cell
            cell.style.color = 'white';
        } else {
            cell.style.backgroundColor = 'white';  // Standard cell color
        }
    });

    // Add new highlights
    path.forEach((index, position) => {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (!cell) return;

        if (cell.classList.contains('start-cell')) {
            cell.classList.add('start-cell-selected');
            cell.style.backgroundColor = '#15803d'; // Dark green for selected start cell
        } else if (cell.classList.contains('end-cell')) {
            cell.classList.add('end-cell-selected');
            cell.style.backgroundColor = '#b91c1c'; // Dark red for selected end cell
        } else {
            cell.classList.add('selected');
            cell.style.backgroundColor = '#bfdbfe'; // Light blue for selected cells
        }
    });
    
    // Add path direction arrows using the separate module
    addPathArrows(path, (index) => document.querySelector(`[data-index="${index}"]`));
}

export function getGridCell(index) {
    return document.querySelector(`[data-index="${index}"]`);
}

export function getCellValue(index) {
    const cell = getGridCell(index);
    if (!cell) return null;
    
    return cell.dataset.value || cell.textContent;
}

export function isStartCell(cell) {
    return cell.classList.contains('start-cell');
}

export function isEndCell(cell) {
    return cell.classList.contains('end-cell');
}
