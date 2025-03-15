// sequencegenerator.js

const LEVEL_CONFIG = {
    1: { maxNum: 30, allowFractions: false, maxDenominator: 12 },
    2: { maxNum: 99, allowFractions: false, maxDenominator: 12 },
    3: { maxNum: 30, allowFractions: true, maxDenominator: 5 },
    4: { maxNum: 30, allowFractions: true, maxDenominator: 12 },
    5: { maxNum: 99, allowFractions: true, maxDenominator: 12 }
};

class Fraction {
    constructor(numerator, denominator) {
        const gcd = this.calculateGCD(numerator, denominator);
        this.numerator = numerator / gcd;
        this.denominator = denominator / gcd;
    }

    calculateGCD(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    toDecimal() {
        return this.numerator / this.denominator;
    }

    toString() {
        return `${this.numerator}/${this.denominator}`;
    }
}

function generateFraction(maxDenominator = 12) {
    const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
    const numerator = Math.floor(Math.random() * (denominator - 1)) + 1;
    
    // Simplify fraction
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(numerator, denominator);
    
    return {
        numerator: numerator / divisor,
        denominator: denominator / divisor,
        toString() {
            return `${this.numerator}/${this.denominator}`;
        },
        toDecimal() {
            return this.numerator / this.denominator;
        }
    };
}

function isValidNumber(num, config) {
    if (typeof num === 'number') {
        return Number.isInteger(num) && num > 0 && num <= config.maxNum;
    }
    
    if (!config.allowFractions) return false;
    
    return num.numerator <= 11 && 
           num.numerator > 0 && 
           num.denominator >= 2 && 
           num.denominator <= config.maxDenominator;
}

function calculateResult(num1, operator, num2, config) {
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    const n2 = num2 instanceof Object ? num2.toDecimal() : num2;
    
    let result;
    switch (operator) {
        case '+': result = n1 + n2; break;
        case '-': result = n1 - n2; break;
        case 'x': result = n1 * n2; break;
        case '/': 
            if (n2 === 0) return null;
            result = n1 / n2; 
            break;
        default: return null;
    }
    
    if (result <= 0 || result > config.maxNum || isNaN(result)) return null;
    
    if (Number.isInteger(result)) return result;
    if (!config.allowFractions) return null;
    
    for (let denominator = 2; denominator <= config.maxDenominator; denominator++) {
        const numerator = Math.round(result * denominator);
        if (numerator <= 11 && numerator > 0 && 
            numerator < denominator &&
            Math.abs(numerator/denominator - result) < 0.0001) {
            return new Fraction(numerator, denominator);
        }
    }
    
    return null;
}

function selectOperatorAndNum2(num1, config) {
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    
    if (n1 > 16) {
        if (Math.random() < 0.8) {
            if (Math.random() < 0.4) {
                const targetResult = Math.floor(Math.random() * 16) + 1;
                const num2 = Math.floor(n1 - targetResult);
                if (num2 > 1 && num2 <= config.maxNum) {
                    return { operator: '-', num2 };
                }
            } else {
                for (let divisor = 2; divisor <= Math.min(10, config.maxNum); divisor++) {
                    if (n1 / divisor < 17 && n1 % divisor === 0) {
                        return { operator: '/', num2: divisor };
                    }
                }
            }
        }
    }
    
    const operatorBias = Math.random();
    let operator;
    
    // If we're on level 3 (or any level with fractions), avoid division by fractions
    if (config.allowFractions) {
        if (operatorBias < 0.33) operator = 'x';
        else if (operatorBias < 0.66) operator = '+';
        else operator = '-';
    } else {
        if (operatorBias < 0.35) operator = 'x';
        else if (operatorBias < 0.6) operator = '/';
        else if (operatorBias < 0.8) operator = '+';
        else operator = '-';
    }
    
    let num2;
    do {
        if (typeof num1 === 'number') {
            num2 = Math.random() < 0.7 ? 
                Math.floor(Math.random() * (config.maxNum - 1)) + 2 : 
                (config.allowFractions ? generateFraction(config.maxDenominator) : 
                Math.floor(Math.random() * (config.maxNum - 1)) + 2);
        } else {
            num2 = Math.floor(Math.random() * (config.maxNum - 1)) + 2;
        }
    } while (num2 === 1);
    
    // If division and num2 is a fraction, change to multiplication
    if (operator === '/' && num2 instanceof Object) {
        operator = 'x';
    }
    
    return { operator, num2 };
}

function generateNextSum(startNum, level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    let attempts = 0;
    while (attempts < 100) {
        const { operator, num2 } = selectOperatorAndNum2(startNum, config);
        
        if (startNum instanceof Object && num2 instanceof Object) {
            attempts++;
            continue;
        }
        
        const result = calculateResult(startNum, operator, num2, config);
        
        if (result !== null && isValidNumber(result, config)) {
            return {
                num1: startNum,
                operator,
                num2,
                result
            };
        }
        attempts++;
    }
    return null;
}

export function formatNumber(num) {
    if (num instanceof Object) return num.toString();
    return num.toString();
}

export async function generateSequence(level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    let sequence = [];
    let currentNum = Math.floor(Math.random() * 16) + 1;
    
    for (let i = 0; i < 100; i++) {
        const sum = generateNextSum(currentNum, level);
        if (!sum) break;
        
        sequence.push({
            ...sum,
            display: `${formatNumber(sum.num1)} ${sum.operator} ${formatNumber(sum.num2)} = ${formatNumber(sum.result)}`
        });
        
        currentNum = sum.result;
    }
    
    return sequence;
}

export function sequenceToEntries(sequence) {
    const entries = [];
    
    sequence.forEach((sum, index) => {
        if (index === 0) {
            entries.push({ type: 'number', value: sum.num1 });
        }
        entries.push({ type: 'operator', value: sum.operator });
        entries.push({ type: 'number', value: sum.num2 });
        entries.push({ type: 'number', value: sum.result });
    });

    return entries;
}

export function getLevelConfig(level) {
    return LEVEL_CONFIG[level];
}
