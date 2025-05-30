// puzzlesymbols.js

// Color mapping for denominators
const denominatorColors = {
    2: '#FFB3B3', // light red
    3: '#BDFCC9', // light green
    4: '#B3E0FF', // light blue
    5: '#FFE6B3', // light orange
    6: '#E6B3FF', // light purple
    8: '#B3FFB3', // mint
};

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function isSimplifiedFraction(n, d) {
    return gcd(n, d) === 1;
}

function generateSectorPath(radius, startAngle, endAngle) {
    const start = {
        x: radius + radius * Math.cos(startAngle),
        y: radius + radius * Math.sin(startAngle)
    };
    const end = {
        x: radius + radius * Math.cos(endAngle),
        y: radius + radius * Math.sin(endAngle)
    };
    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
    return `M ${radius} ${radius} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function createDotNumberSVG(number, size = 24) {
    if (number > 6) return null;

    const dotSize = size / 6;
    const spacing = size / 4;
    
    // Center the dots pattern by calculating offsets
    // This ensures the dots are centered in the SVG viewport
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Calculate offsets based on the dot pattern
    let offsetX = 0;
    let offsetY = 0;
    
    // For patterns that need centering
    if (number === 1) {
        offsetX = centerX - spacing;
        offsetY = centerY - spacing;
    } else if (number === 2 || number === 3) {
        offsetX = centerX - spacing;
        offsetY = centerY - spacing;
    } else if (number === 4 || number === 5 || number === 6) {
        offsetX = centerX - spacing;
        offsetY = centerY - spacing;
    }

    const dotPositions = {
        1: [[1, 1]],
        2: [[0, 0], [2, 2]],
        3: [[0, 0], [1, 1], [2, 2]],
        4: [[0, 0], [0, 2], [2, 0], [2, 2]],
        5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
        6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
    };

    const dots = dotPositions[number] || [];

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    dots.forEach(([x, y]) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', offsetX + x * spacing);
        circle.setAttribute('cy', offsetY + y * spacing);
        circle.setAttribute('r', dotSize / 2);
        circle.setAttribute('fill', 'currentColor');
        svg.appendChild(circle);
    });

    return svg;
}

function createFractionSymbolSVG(numerator, denominator, size = 24) {
    const radius = size / 2;
    const sectorAngle = (2 * Math.PI) / denominator;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    // White background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    background.setAttribute('cx', radius);
    background.setAttribute('cy', radius);
    background.setAttribute('r', radius - 0.5);
    background.setAttribute('fill', 'white');
    svg.appendChild(background);

    // Filled sectors
    for (let index = 0; index < numerator; index++) {
        const startAngle = -Math.PI/2 + (index * sectorAngle);
        const endAngle = startAngle + sectorAngle;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', generateSectorPath(radius - 0.5, startAngle, endAngle));
        path.setAttribute('fill', denominatorColors[denominator]);
        path.setAttribute('stroke', 'none');
        svg.appendChild(path);
    }

    // Division lines
    for (let index = 0; index < denominator; index++) {
        const angle = -Math.PI/2 + (index * sectorAngle);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', radius);
        line.setAttribute('y1', radius);
        line.setAttribute('x2', radius + (radius - 0.5) * Math.cos(angle));
        line.setAttribute('y2', radius + (radius - 0.5) * Math.sin(angle));
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }

    // Outer circle
    const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerCircle.setAttribute('cx', radius);
    outerCircle.setAttribute('cy', radius);
    outerCircle.setAttribute('r', radius - 0.5);
    outerCircle.setAttribute('fill', 'none');
    outerCircle.setAttribute('stroke', 'black');
    outerCircle.setAttribute('stroke-width', '1');
    svg.appendChild(outerCircle);

    return svg;
}

function isFraction(symbol) {
    return typeof symbol === 'string' && symbol.includes('/');
}

function createSymbol(symbol, size = 24) {
    // Handle fractions first, BEFORE trying to parse as integer
    if (isFraction(symbol)) {
        const [num, den] = symbol.split('/').map(Number);
        if ([2, 3, 4, 5, 6, 8].includes(den) && isSimplifiedFraction(num, den)) {
            return createFractionSymbolSVG(num, den, size);
        }
        return null; // Let MathJax handle other fractions
    }
    
    // Then handle integer values 1-6
    const num = parseInt(symbol);
    if (!isNaN(num) && num >= 1 && num <= 6) {
        return createDotNumberSVG(num, size);
    }
    
    return null;  // Let MathJax handle other cases
}

export default {
    createSymbol
};
