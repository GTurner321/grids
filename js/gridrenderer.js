// gridrenderer.js
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

// Modifications for gridrenderer.js to work with unified-grid.css

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
    
    // Calculate cell size based on grid size
    const cellSize = gridSize === 6 ? '67.5px' : '40px';
    
    // Set grid template columns - IMPORTANT for layout
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${options.cellSize || cellSize})`;
    
    // Create and append cells
    gridEntries.forEach((entry, index) => {
        // Skip cells beyond the grid size
        if (index >= gridSize * gridSize) return;
        
        const cell = createCell(entry, index);
        
        // Set cell dimensions explicitly
        cell.style.width = options.cellSize || cellSize;
        cell.style.height = options.cellSize || cellSize;
        
        // Mark start and end cells
        if (startCoord && index === startCoord[1] * gridSize + startCoord[0]) {
            cell.classList.add('start-cell');
        }
        if (endCoord && index === endCoord[1] * gridSize + endCoord[0]) {
            cell.classList.add('end-cell');
        }
        
        gridContainer.appendChild(cell);
    });

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
            cell.style.backgroundColor = '';  // Let CSS handle it
        } else if (cell.classList.contains('end-cell')) {
            cell.style.backgroundColor = '';  // Let CSS handle it
        } else {
            cell.style.backgroundColor = '';  // Clear inline style
        }
    });

    // Add new highlights
    path.forEach((index, position) => {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (!cell) return;

        if (cell.classList.contains('start-cell')) {
            cell.classList.add('start-cell-selected');
        } else if (cell.classList.contains('end-cell')) {
            cell.classList.add('end-cell-selected');
        } else {
            cell.classList.add('selected');
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
