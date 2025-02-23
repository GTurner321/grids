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
            const symbolValue = entry.value instanceof Object 
                ? (entry.value.numerator && entry.value.denominator 
                    ? `${entry.value.numerator}/${entry.value.denominator}` 
                    : entry.value.toString())
                : entry.value.toString();
            
            // Try to create symbol first
            const symbolSvg = PuzzleSymbols.createSymbol(entry.value);
            
            if (symbolSvg) {
                // Use SVG symbol for numbers 1-6 and valid fractions
                const symbolContainer = document.createElement('div');
                symbolContainer.classList.add('symbol-container');
                symbolContainer.style.pointerEvents = 'none';
                symbolContainer.appendChild(symbolSvg);
                cell.appendChild(symbolContainer);
            } else {
                // Use MathJax for numbers 7+ and non-symbol fractions
                cell.innerHTML = formatForMathJax(entry.value);
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
    // Clear existing highlights
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('highlight', 'selected');
    });

    // Add new highlights
    path.forEach((index, position) => {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (!cell) return;

        cell.classList.add('selected');
        
        // Special styling for first and last cells
        if (position === 0) {
            cell.classList.add('start-cell-selected');
        } else if (position === path.length - 1) {
            cell.classList.add('end-cell-selected');
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
