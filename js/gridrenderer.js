// gridrenderer.js
import PuzzleSymbols from './puzzlesymbols.js';

function createCell(entry, index) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.dataset.index = index;
    
    if (entry) {
        if (entry.type === 'number') {
            const symbolContainer = document.createElement('div');
            symbolContainer.classList.add('symbol-container');
            symbolContainer.style.pointerEvents = 'none';
            
            const symbolValue = entry.value instanceof Object 
                ? (entry.value.numerator && entry.value.denominator 
                    ? `${entry.value.numerator}/${entry.value.denominator}` 
                    : entry.value.toString())
                : entry.value.toString();
            
            const symbolSvg = PuzzleSymbols.createSymbol(symbolValue);
            
            if (symbolSvg) {
                symbolContainer.appendChild(symbolSvg);
                cell.appendChild(symbolContainer);
                cell.dataset.value = symbolValue;
            } else {
                cell.textContent = symbolValue;
            }
            
            cell.classList.add('number');
        } else if (entry.type === 'operator') {
            cell.textContent = entry.value;
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
        const symbolContainer = document.createElement('div');
        symbolContainer.classList.add('symbol-container');
        symbolContainer.style.pointerEvents = 'none';
        
        const symbolValue = value.value.toString();
        const symbolSvg = PuzzleSymbols.createSymbol(symbolValue);
        
        if (symbolSvg) {
            symbolContainer.appendChild(symbolSvg);
            cell.appendChild(symbolContainer);
            cell.dataset.value = symbolValue;
        } else {
            cell.textContent = symbolValue;
        }
        
        cell.classList.add('number');
    } else if (typeof value === 'object' && value.type === 'operator') {
        cell.textContent = value.value;
        cell.classList.add('operator');
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
