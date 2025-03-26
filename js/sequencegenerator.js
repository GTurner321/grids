// sequencegenerator.js - Fixed version with unified logic and fallback mechanisms

const LEVEL_CONFIG = {
    1: { maxNum: 20, allowFractions: false, maxDenominator: 0, gridSize: 6 },
    2: { maxNum: 20, allowFractions: false, maxDenominator: 0, gridSize: 6 },
    3: { maxNum: 50, allowFractions: false, maxDenominator: 0, gridSize: 6, preferDivision: true },
    4: { maxNum: 30, allowFractions: false, maxDenominator: 0, gridSize: 10 },  // Original level 1
    5: { 
        maxNum: 99, 
        allowFractions: true, 
        maxDenominator: 2, 
        gridSize: 10, 
        unitFractionsOnly: true, 
        preferDivision: true, 
        divisionThreshold: 20, 
        divisionPreferenceRate: 0.75 
    },  // Modified level 2
    6: { 
        maxNum: 30, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10, 
        unitFractionsOnly: true, 
        preferFractionMultiplication: true, 
        disallowFractionDivision: true,
        multiplicationThreshold: 10,
        multiplicationPreferenceRate: 0.5 
    },
    7: { 
        maxNum: 30, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10,
        preferFractionMultiplication: true, 
        disallowFractionDivision: true,
        multiplicationThreshold: 10,
        multiplicationPreferenceRate: 0.5,
        preferNonUnitFractions: true,
        nonUnitFractionRate: 0.75
    },
    8: { 
        maxNum: 30, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10,
        preferFractionOperations: true,
        fractionOperationRate: 0.5
    },
    9: { maxNum: 99, allowFractions: true, maxDenominator: 12, gridSize: 10 },  // Original level 5
    10: { maxNum: 99, allowFractions: true, maxDenominator: 12, gridSize: 10, forceFractionOps: true }
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

// Simplified fraction generation with safety checks
function generateFraction(maxDenominator = 12, unitFractionOnly = false, preferNonUnit = false) {
    // Make sure denominator is at least 2
    maxDenominator = Math.max(2, maxDenominator);
    
    // Case 1: Generate unit fraction (simplest case)
    if (unitFractionOnly) {
        const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
        return {
            numerator: 1,
            denominator: denominator,
            toString() { return `1/${this.denominator}`; },
            toDecimal() { return 1 / this.denominator; }
        };
    }
    
    // Case 2: Generate non-unit fraction if preferred and probability check passes
    const useNonUnitFraction = preferNonUnit && Math.random() < (LEVEL_CONFIG[7].nonUnitFractionRate || 0.75);
    
    if (useNonUnitFraction) {
        // Choose denominator first
        const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
        
        // Safety check - ensure denominator is valid
        if (denominator < 2) {
            // Fallback to unit fraction if invalid
            return {
                numerator: 1,
                denominator: 2,
                toString() { return `1/2`; },
                toDecimal() { return 0.5; }
            };
        }
        
        // Choose a numerator that is not 1 (to make it non-unit), but less than denominator
        let numeratorOptions = [];
        for (let i = 2; i < denominator; i++) {
            numeratorOptions.push(i);
        }
        
        // If no valid options, fall back to unit fraction
        if (numeratorOptions.length === 0) {
            return {
                numerator: 1,
                denominator: denominator,
                toString() { return `1/${this.denominator}`; },
                toDecimal() { return 1 / this.denominator; }
            };
        }
        
        // Pick a random numerator
        const numerator = numeratorOptions[Math.floor(Math.random() * numeratorOptions.length)];
        
        // Simplify the fraction
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(numerator, denominator);
        
        return {
            numerator: numerator / divisor,
            denominator: denominator / divisor,
            toString() { return `${this.numerator}/${this.denominator}`; },
            toDecimal() { return this.numerator / this.denominator; }
        };
    }
    
    // Case 3: Regular fraction (could be unit or non-unit)
    const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
    const numerator = Math.floor(Math.random() * (denominator - 1)) + 1;
    
    // Simplify the fraction
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(numerator, denominator);
    
    return {
        numerator: numerator / divisor,
        denominator: denominator / divisor,
        toString() { return `${this.numerator}/${this.denominator}`; },
        toDecimal() { return this.numerator / this.denominator; }
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

function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    let i = 5;
    while (i * i <= num) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
        i += 6;
    }
    return true;
}

function getFactorsOf(number) {
    const factors = [];
    for (let i = 2; i <= Math.sqrt(number); i++) {
        if (number % i === 0) {
            factors.push(i);
            if (i !== number / i) {
                factors.push(number / i);
            }
        }
    }
    return factors.sort((a, b) => a - b);
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

// Unified logic for operator and operand selection
function selectOperatorAndNum2(num1, level, config) {
    // Make sure we have the correct config
    config = LEVEL_CONFIG[level] || config;
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    let operator, num2;
    
    // ===== SPECIAL CASE HANDLING FOR SPECIFIC LEVELS =====
    
    // LEVEL 10: Force fraction operations
    if (level === 10 && n1 >= 2 && n1 <= 12 && config.forceFractionOps) {
        if (Math.random() < 0.5) {
            // Multiplication by fraction
            return { 
                operator: 'x', 
                num2: generateFraction(config.maxDenominator) 
            };
        } else {
            // Division by fraction
            return { 
                operator: '/', 
                num2: generateFraction(config.maxDenominator) 
            };
        }
    }
    
    // LEVEL 5: Division for large non-prime numbers
    if (level === 5 && n1 >= config.divisionThreshold && !isPrime(n1) && Math.random() < config.divisionPreferenceRate) {
        const factors = getFactorsOf(n1);
        
        if (factors.length > 0) {
            // Choose a random factor
            const factor = factors[Math.floor(Math.random() * factors.length)];
            
            // Division or multiplication by 1/2
            if (factor === 2 && Math.random() < 0.5) {
                return {
                    operator: 'x',
                    num2: { numerator: 1, denominator: 2, toString() { return "1/2"; }, toDecimal() { return 0.5; } }
                };
            } else {
                return { operator: '/', num2: factor };
            }
        }
    }
    
    // LEVEL 6: Multiply by unit fractions
    if (level === 6 && n1 >= config.multiplicationThreshold && !isPrime(n1) && Math.random() < config.multiplicationPreferenceRate) {
        return { 
            operator: 'x', 
            num2: generateFraction(config.maxDenominator, true) // Force unit fractions
        };
    }
    
    // LEVEL 7: Multiply by non-unit fractions (ONE UNIFIED PATH - not multiple)
    if (level === 7 && n1 >= config.multiplicationThreshold && Math.random() < config.multiplicationPreferenceRate) {
        return { 
            operator: 'x', 
            num2: generateFraction(config.maxDenominator, false, config.preferNonUnitFractions)
        };
    }
    
    // LEVEL 8: Fraction operations (both * and /)
    if (level === 8 && !isPrime(n1) && Math.random() < config.fractionOperationRate) {
        const useDivision = Math.random() < 0.5;
        
        if (useDivision) {
            return { 
                operator: '/', 
                num2: generateFraction(config.maxDenominator) 
            };
        } else {
            return { 
                operator: 'x', 
                num2: generateFraction(config.maxDenominator) 
            };
        }
    }
    
    // ===== GENERAL CASE HANDLING FOR ALL LEVELS =====
    
    // For large numbers, try to make them smaller with subtraction or division
    if (n1 > 16) {
        if (Math.random() < 0.8) {
            if (Math.random() < 0.4) {
                const targetResult = Math.floor(Math.random() * 16) + 1;
                const num2Value = Math.floor(n1 - targetResult);
                if (num2Value > 1 && num2Value <= config.maxNum) {
                    return { operator: '-', num2: num2Value };
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
    
    // For level 3, prefer division for large numbers
    if (level === 3 && n1 > 30 && Math.random() < 0.6) {
        for (let divisor = 2; divisor <= Math.min(10, config.maxNum); divisor++) {
            if (n1 % divisor === 0) {
                return { operator: '/', num2: divisor };
            }
        }
    }
    
    // ===== DEFAULT OPERATOR SELECTION =====
    
    const operatorBias = Math.random();
    
    // Level 6 and 7 - avoid division by fractions
    if ((level === 6 || level === 7) && config.disallowFractionDivision) {
        if (operatorBias < 0.33) operator = 'x';
        else if (operatorBias < 0.66) operator = '+';
        else operator = '-';
    }
    // For other levels, use normal distribution of operators
    else {
        if (operatorBias < 0.35) operator = 'x';
        else if (operatorBias < 0.6) operator = '/';
        else if (operatorBias < 0.8) operator = '+';
        else operator = '-';
    }
    
    // ===== DEFAULT NUM2 GENERATION =====
    
    // For level 5 - occasionally allow 1/2 as a fraction
    if (level === 5 && config.allowFractions && operator === 'x' && Math.random() < 0.1) {
        return {
            operator: 'x',
            num2: { numerator: 1, denominator: 2, toString() { return "1/2"; }, toDecimal() { return 0.5; } }
        };
    }
    
    // For level 6, ensure fractions are unit fractions (if not already handled by special case)
    if (level === 6 && config.allowFractions && config.unitFractionsOnly && 
       (operator === 'x') && Math.random() < 0.6) {
        num2 = generateFraction(config.maxDenominator, true); // Always unit fractions
    }
    // For level 7, use non-unit fractions for multiply (if not already handled by special case)
    else if (level === 7 && config.allowFractions && 
       (operator === 'x') && Math.random() < 0.4) { // Reduced from 0.6 to avoid double-dipping
        // Prefer non-unit fractions, but will fall back to unit if needed
        num2 = generateFraction(config.maxDenominator, false, config.preferNonUnitFractions);
    }
    // For level 8, allow all types of fractions
    else if (level === 8 && config.allowFractions && 
       (operator === 'x' || operator === '/') && Math.random() < 0.5) {
        num2 = generateFraction(config.maxDenominator);
    }
    // For levels 9 and 10, allow fractions as well
    else if ((level === 9 || level === 10) && config.allowFractions && 
       (operator === 'x' || operator === '/') && Math.random() < 0.4) {
        num2 = generateFraction(config.maxDenominator);
    }
    // Standard num2 generation for other cases
    else {
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
    }
    
    // Post-processing: If level 6 or 7 and division with a fraction, change to multiplication
    if ((level === 6 || level === 7) && operator === '/' && num2 instanceof Object && config.disallowFractionDivision) {
        operator = 'x';
    }
    
    return { operator, num2 };
}

// Modified to include fallback after specified number of attempts
function generateNextSum(startNum, level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    // Define attempt limits - using higher limits for complex levels
    const maxAttempts = (level >= 7) ? 150 : 100;
    let attempts = 0;
    
    // Main generation loop with original complexity
    while (attempts < maxAttempts) {
        // Pass the level along with the config
        const { operator, num2 } = selectOperatorAndNum2(startNum, level, config);
        
        // Skip if both are fractions - this is often a problem source
        if (startNum instanceof Object && num2 instanceof Object) {
            attempts++;
            // Don't completely skip, but reduce frequency
            if (Math.random() < 0.8) continue;
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
    
    // Fallback to simple operations if we've exceeded attempts
    return generateFallbackOperation(startNum, level, config);
}

// Simple fallback function that creates a guaranteed valid operation
function generateFallbackOperation(num, level, config) {
    const n = num instanceof Object ? num.toDecimal() : num;
    
    // Try addition first if we have room
    if (n < config.maxNum - 2) {
        // Add a small number
        const addend = Math.min(Math.floor(Math.random() * 5) + 1, config.maxNum - n);
        return {
            num1: num,
            operator: '+',
            num2: addend,
            result: n + addend
        };
    }
    
    // If number is close to max, subtract
    const subtrahend = Math.min(Math.floor(Math.random() * 5) + 1, n - 1);
    if (subtrahend > 0) {
        return {
            num1: num,
            operator: '-',
            num2: subtrahend,
            result: n - subtrahend
        };
    }
    
    // In the unlikely case n is 1, use multiplication
    return {
        num1: num,
        operator: 'x',
        num2: 2,
        result: n * 2
    };
}

export function formatNumber(num) {
    if (num instanceof Object) return num.toString();
    return num.toString();
}

export function generateSequence(level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    // Minimum sequence length needed for the game
    const MIN_SEQUENCE_LENGTH = 12;
    
    // For complex levels (7-10), use multiple attempts if needed
    const maxTotalAttempts = (level >= 7) ? 3 : 1;
    let totalAttempts = 0;
    
    while (totalAttempts < maxTotalAttempts) {
        let sequence = [];
        totalAttempts++;
        
        // Start with a smaller number for easier first calculations
        let currentNum = Math.floor(Math.random() * 16) + 1;
        
        // For level 5-10, occasionally start with a larger number
        if (level >= 5 && Math.random() < 0.3) {
            currentNum = Math.floor(Math.random() * 30) + 10;
        }
        
        // Try to build sequence
        for (let i = 0; i < 100; i++) {
            const sum = generateNextSum(currentNum, level);
            // All sums should succeed now due to fallback mechanism
            
            sequence.push({
                ...sum,
                display: `${formatNumber(sum.num1)} ${sum.operator} ${formatNumber(sum.num2)} = ${formatNumber(sum.result)}`
            });
            
            currentNum = sum.result;
            
            // If we have enough operations, we're done
            if (sequence.length >= MIN_SEQUENCE_LENGTH) {
                return sequence;
            }
        }
        
        // If we didn't get enough operations, try again
    }
    
    // If we still failed after multiple attempts, create a simple sequence
    console.warn(`Failed to generate sufficient sequence for level ${level} after ${maxTotalAttempts} attempts. Creating simple sequence.`);
    
    return createSimpleSequence(level);
}

// Last-resort function to create a simple sequence
function createSimpleSequence(level) {
    const config = LEVEL_CONFIG[level];
    let sequence = [];
    
    // Start with small number
    let currentNum = Math.floor(Math.random() * 10) + 1;
    
    // Create at least 15 operations to ensure enough for the game
    for (let i = 0; i < 15; i++) {
        // Alternate between addition and subtraction
        if (i % 2 === 0 && currentNum < config.maxNum - 5) {
            // Addition
            const addend = Math.floor(Math.random() * 5) + 1;
            const result = currentNum + addend;
            
            sequence.push({
                num1: currentNum,
                operator: '+',
                num2: addend,
                result: result,
                display: `${currentNum} + ${addend} = ${result}`
            });
            
            currentNum = result;
        } else {
            // Subtraction (ensure we don't go below 1)
            const maxSubtract = Math.min(currentNum - 1, 5);
            if (maxSubtract < 1) {
                // If we can't subtract, multiply instead
                const multResult = currentNum * 2;
                if (multResult <= config.maxNum) {
                    sequence.push({
                        num1: currentNum,
                        operator: 'x',
                        num2: 2,
                        result: multResult,
                        display: `${currentNum} × 2 = ${multResult}`
                    });
                    currentNum = multResult;
                } else {
                    // Division as last resort if multiplication would exceed max
                    const divResult = Math.floor(currentNum / 2); // Ensure integer result
                    sequence.push({
                        num1: currentNum,
                        operator: '/',
                        num2: 2,
                        result: divResult,
                        display: `${currentNum} ÷ 2 = ${divResult}`
                    });
                    currentNum = divResult;
                }
            } else {
                // Normal subtraction case
                const subtrahend = Math.floor(Math.random() * maxSubtract) + 1;
                const result = currentNum - subtrahend;
                
                sequence.push({
                    num1: currentNum,
                    operator: '-',
                    num2: subtrahend,
                    result: result,
                    display: `${currentNum} - ${subtrahend} = ${result}`
                });
                
                currentNum = result;
            }
        }
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
