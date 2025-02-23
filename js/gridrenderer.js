// gridrenderer.js
import PuzzleSymbols from './puzzlesymbols.js';

function renderSymbol(value) {
    // Convert number to LaTeX string
    if (typeof value === 'number') {
        if (value >= 1 && value <= 6) {
            // For numbers 1-6, use dots
            return createDotSymbol(value);
        }
        return `$${value}$`;
    }
    
    // Handle operators
    if (value === '/') {
        return '$\\div$';
    }
    if (value === 'x') {
        return '$\\times$';
    }
    
    // Handle fractions
    if (typeof value === 'string' && value.includes('/')) {
        const [num, den] = value.split('/');
        return `$\\frac{${num}}{${den}}$`;
    }
    
    return value;
}

function createDotSymbol(number) {
    const dotSize = '0.2em';
    const dots = [];
    
    // Dot patterns for numbers 1-6
    const patterns = {
        1: [[1, 1]],
        2: [[0, 0], [2, 2]],
        3: [[0, 0], [1, 1], [2, 2]],
        4: [[0, 0], [0, 2], [2, 0], [2, 2]],
        5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
        6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
    };
    
    patterns[number].forEach(([x, y]) => {
        dots.push(`\\bullet`);
    });
    
    return `$\\begin{matrix}${dots.join(' & ')}\\end{matrix}$`;
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
            
            cell.innerHTML = renderSymbol(entry.value);
            cell.dataset.value = symbolValue;
            cell.classList.add('number');
            
            // Trigger MathJax to process the new content
            if (window.MathJax) {
                window.MathJax.typesetPromise([cell]);
            }
        } else if (entry.type === 'operator') {
            cell.innerHTML = renderSymbol(entry.value);
            cell.classList.add('operator');
            
            // Trigger MathJax to process the new content
            if (window.MathJax) {
                window.MathJax.typesetPromise([cell]);
            }
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
        cell.innerHTML = renderSymbol(value.value);
        cell.dataset.value = value.value.toString();
        cell.classList.add('number');
    } else if (typeof value === 'object' && value.type === 'operator') {
        cell.innerHTML = renderSymbol(value.value);
        cell.classList.add('operator');
    } else {
        cell.innerHTML = renderSymbol(value);
    }

    // Trigger MathJax to process the updated content
    if (window.MathJax) {
        window.MathJax.typesetPromise([cell]);
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
