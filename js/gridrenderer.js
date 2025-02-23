// gridrenderer.js
import PuzzleSymbols from './puzzlesymbols.js';

function formatForMathJax(value) {
    if (typeof value === 'string') {
        // Handle operators
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
            // Convert value to proper format for symbol creation
            const value = entry.value;
            const symbolValue = value.numerator && value.denominator 
                ? `${value.numerator}/${value.denominator}`
                : value.toString();

            // Try to create symbol first
            const symbolSvg = PuzzleSymbols.createSymbol(symbolValue);
            
            if (symbolSvg) {
                // Use SVG symbol for numbers 1-6 and valid fractions
                const symbolContainer = document.createElement('div');
                symbolContainer.classList.add('symbol-container');
                symbolContainer.style.pointerEvents = 'none';
                symbolContainer.appendChild(symbolSvg);
                cell.appendChild(symbolContainer);
            } else {
                // Use MathJax for other numbers and fractions
                if (symbolValue.includes('/')) {
                    const [num, den] = symbolValue.split('/');
                    cell.innerHTML = `$\\frac{${num}}{${den}}$`;
                } else {
                    cell.innerHTML = `$${symbolValue}$`;
                }
            }
            
            cell.dataset.value = symbolValue;
            cell.classList.add('number');

        } else if (entry.type === 'operator') {
            // Use MathJax for operators
            cell.innerHTML = formatForMathJax(entry.value);
            cell.classList.add('operator');
        }
    }

    return cell;
}

export function renderGrid(gridEntries, options = {}) {
    const { startCoord, endCoord } = options;
    const gridContainer = document.getElementById('grid-container');
    if (!gridContainer) return;

    // Clear existing grid
    gridContainer.innerHTML = '';
    
    // Create and append cells
    gridEntries.forEach((entry, index) => {
        const cell = createCell(entry, index);
        
        // Mark start and end cells
        if (startCoord && index === startCoord[1] * 10 + startCoord[0]) {
            cell.classList.add('start-cell');
        }
        if (endCoord && index === endCoord[1] * 10 + endCoord[0]) {
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
    // Clear all highlights and restore original states
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('highlight', 'selected', 'start-cell-selected', 'end-cell-selected');
        
        // Restore original states
        if (cell.classList.contains('start-cell')) {
            cell.style.backgroundColor = '#22c55e';  // Original green
        } else {
            cell.style.backgroundColor = 'white';
        }
    });

    // Add new highlights
    path.forEach((index, position) => {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (!cell) return;

        cell.classList.add('selected');
        cell.style.backgroundColor = '#e5e7eb';  // Grey selection color
        
        if (position === 0 && cell.classList.contains('start-cell')) {
            cell.style.backgroundColor = '#15803d';  // Darker green when selected
        }
    });
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
