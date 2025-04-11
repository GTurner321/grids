// sequencegenerator.js - Updated version with improved fraction handling and level adjustments

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
        divisionPreferenceRate: 0.75,
        disallowFractionDivision: true // Added as requested
    },
    6: { 
        maxNum: 30, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10, 
        unitFractionsOnly: true, 
        preferFractionMultiplication: true, 
        disallowFractionDivision: true,
        multiplicationThreshold: 10,
        multiplicationPreferenceRate: 0.5,
        strictIntegerResults: true // Added to ensure integer results
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
        nonUnitFractionRate: 0.75,
        strictIntegerResults: true // Added to ensure integer results
    },
    8: { 
        maxNum: 30, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10,
        preferFractionOperations: true,
        fractionOperationRate: 0.5,
        strictIntegerResults: true // Added to ensure integer results
    },
    9: { 
        maxNum: 99, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10,
        preferFractionOperations: true, // Added as requested
        fractionOperationRate: 0.5, // Same as level 8
        strictIntegerResults: true // Added to ensure integer results
    },
    10: { 
        maxNum: 99, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10, 
        forceFractionOps: true,
        preferFractionOperations: true,
        fractionOperationRate: 0.75, // Increased to 75% as requested
        preferNonUnitFractions: true,
        nonUnitFractionRate: 0.9, // High preference for non-unit fractions
        preferLargeNumbers: true,
        largeNumberThreshold: 30,
        strictIntegerResults: true, // Added to ensure integer results
        maxFractionAttemptsBeforeFallback: 10 // Limit attempts before trying addition/subtraction
    }
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

// Modified fraction generation with safety checks
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
    const useNonUnitFraction = preferNonUnit && Math.random() < (preferNonUnit === true ? 0.75 : preferNonUnit);
    
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

// Generate a specific fraction that will give an integer result when operated on num1
function generateFractionWithIntegerResult(num1, operator, maxDenominator, unitFractionOnly, preferNonUnit) {
    // Ensure num1 is a number
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    
    // Case 1: Multiplication - find a fraction that gives an integer when multiplied by n1
    if (operator === 'x') {
        // Approach: Find the factors of n1, then construct fractions that, when multiplied by n1, give integers
        let possibleDenominators = [];
        
        // Add reasonable denominators
        for (let denom = 2; denom <= maxDenominator; denom++) {
            possibleDenominators.push(denom);
        }
        
        // Shuffle to avoid bias
        possibleDenominators = shuffleArray(possibleDenominators);
        
        for (const denominator of possibleDenominators) {
            // For unit fractions, numerator is always 1
            if (unitFractionOnly) {
                // Check if n1 / denominator is an integer
                if (Number.isInteger(n1 / denominator) && n1 / denominator > 0) {
                    return {
                        numerator: 1,
                        denominator: denominator,
                        toString() { return `1/${this.denominator}`; },
                        toDecimal() { return 1 / this.denominator; }
                    };
                }
            } 
            // For non-unit fractions
            else {
                // Consider all possible numerators for this denominator
                let numeratorOptions = [];
                for (let num = 1; num < denominator; num++) {
                    // Check if n1 * (num/denominator) gives an integer result
                    if (Number.isInteger(n1 * num / denominator) && n1 * num / denominator > 0) {
                        numeratorOptions.push(num);
                    }
                }
                
                // Filter for non-unit fractions if preferred
                if (preferNonUnit && numeratorOptions.length > 1) {
                    numeratorOptions = numeratorOptions.filter(num => num > 1);
                }
                
                if (numeratorOptions.length > 0) {
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
            }
        }
    }
    
    // Case 2: Division - find a fraction that gives an integer when num1 is divided by it
    if (operator === '/') {
        // For division to yield an integer: n1 ÷ (num/denom) = integer
        // This means: n1 * denom / num = integer
        
        let possibleDenominators = [];
        for (let denom = 2; denom <= maxDenominator; denom++) {
            possibleDenominators.push(denom);
        }
        
        possibleDenominators = shuffleArray(possibleDenominators);
        
        for (const denominator of possibleDenominators) {
            // For unit fractions, numerator is always 1
            if (unitFractionOnly) {
                // Check if n1 * denominator is an integer
                if (Number.isInteger(n1 * denominator) && n1 * denominator > 0) {
                    return {
                        numerator: 1,
                        denominator: denominator,
                        toString() { return `1/${this.denominator}`; },
                        toDecimal() { return 1 / this.denominator; }
                    };
                }
            }
            // For non-unit fractions
            else {
                let numeratorOptions = [];
                for (let num = 1; num < denominator; num++) {
                    // n1 / (num/denom) = n1 * denom / num
                    // This must be an integer
                    if (Number.isInteger(n1 * denominator / num) && n1 * denominator / num > 0) {
                        numeratorOptions.push(num);
                    }
                }
                
                // Filter for non-unit fractions if preferred
                if (preferNonUnit && numeratorOptions.length > 1) {
                    numeratorOptions = numeratorOptions.filter(num => num > 1);
                }
                
                if (numeratorOptions.length > 0) {
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
            }
        }
    }
    
    // If we couldn't find a suitable fraction, return null
    return null;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

// Improved calculation with strict integer checking
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
    
    // For strict integer results (when working with fractions)
    if (config.strictIntegerResults && !Number.isInteger(result)) {
        return null;
    }
    
    if (Number.isInteger(result)) return result;
    if (!config.allowFractions) return null;
    
    // Return as a fraction if needed
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

// Unified logic for operator and operand selection with improved fraction handling
function selectOperatorAndNum2(num1, level, config, fractionAttempts = 0) {
    // Make sure we have the correct config
    config = LEVEL_CONFIG[level] || config;
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    let operator, num2;
    
    // Check if we need to fall back to addition/subtraction after multiple fraction attempts
    const useFallback = level === 10 && 
        fractionAttempts >= (config.maxFractionAttemptsBeforeFallback || 10);
    
    if (useFallback) {
        // Force addition or subtraction as a fallback
        operator = Math.random() < 0.5 ? '+' : '-';
        
        // For level 10, prefer large numbers for addition/subtraction
        if (config.preferLargeNumbers && config.largeNumberThreshold) {
            // For addition: choose a number that won't exceed maxNum
            if (operator === '+') {
                const upperLimit = Math.min(config.maxNum - n1, config.maxNum);
                const lowerLimit = Math.min(config.largeNumberThreshold, upperLimit);
                
                if (upperLimit > lowerLimit) {
                    // Generate a number between the threshold and upper limit
                    num2 = Math.floor(Math.random() * (upperLimit - lowerLimit)) + lowerLimit;
                    return { operator, num2 };
                }
            }
            // For subtraction: ensure we don't go below 1
            else if (operator === '-') {
                const upperLimit = Math.min(n1 - 1, config.maxNum);
                const lowerLimit = Math.min(config.largeNumberThreshold, upperLimit);
                
                if (upperLimit >= lowerLimit) {
                    // Generate a number between the threshold and upper limit
                    num2 = Math.floor(Math.random() * (upperLimit - lowerLimit + 1)) + lowerLimit;
                    return { operator, num2 };
                }
            }
        }
        
        // If we couldn't use large numbers, just use regular addition/subtraction
        if (operator === '+') {
            const maxAdd = Math.min(config.maxNum - n1, 15);
            num2 = Math.floor(Math.random() * maxAdd) + 1;
        } else {
            const maxSubtract = Math.min(n1 - 1, 15);
            num2 = Math.floor(Math.random() * maxSubtract) + 1;
        }
        
        return { operator, num2 };
    }
    
    // ===== SPECIAL CASE HANDLING FOR SPECIFIC LEVELS =====
    
    // LEVEL 10: Force fraction operations with high preference for non-unit fractions
    if (level === 10 && n1 >= 2 && n1 <= 99 && config.forceFractionOps && Math.random() < 0.8) {
        if (Math.random() < 0.5) {
            // Multiplication by fraction
            const fractionNum2 = generateFractionWithIntegerResult(n1, 'x', config.maxDenominator, false, 0.9);
            if (fractionNum2) {
                return { operator: 'x', num2: fractionNum2 };
            }
        } else {
            // Division by fraction
            const fractionNum2 = generateFractionWithIntegerResult(n1, '/', config.maxDenominator, false, 0.9);
            if (fractionNum2) {
                return { operator: '/', num2: fractionNum2 };
            }
        }
    }
    
    // LEVELS 8 and 9: Prefer fraction operations
    if ((level === 8 || level === 9) && n1 >= 2 && config.preferFractionOperations && 
        Math.random() < config.fractionOperationRate) {
        const useMultiplication = Math.random() < 0.5;
        
        if (useMultiplication) {
            const fractionNum2 = generateFractionWithIntegerResult(
                n1, 'x', config.maxDenominator, false, level === 9 ? 0.6 : false
            );
            if (fractionNum2) {
                return { operator: 'x', num2: fractionNum2 };
            }
        } else {
            // Only use division if not disallowed for this level
            if (!config.disallowFractionDivision) {
                const fractionNum2 = generateFractionWithIntegerResult(
                    n1, '/', config.maxDenominator, false, level === 9 ? 0.6 : false
                );
                if (fractionNum2) {
                    return { operator: '/', num2: fractionNum2 };
                }
            }
        }
    }
    
    // LEVEL 5: Division for large non-prime numbers but never division by fractions
    if (level === 5 && n1 >= config.divisionThreshold && !isPrime(n1) && Math.random() < config.divisionPreferenceRate) {
        const factors = getFactorsOf(n1);
        
        if (factors.length > 0) {
            // Choose a random factor
            const factor = factors[Math.floor(Math.random() * factors.length)];
            
            // Division or multiplication by 1/2
            if (factor === 2 && Math.random() < 0.5 && !config.disallowFractionDivision) {
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
        const fractionNum2 = generateFractionWithIntegerResult(
            n1, 'x', config.maxDenominator, true, false
        );
        if (fractionNum2) {
            return { operator: 'x', num2: fractionNum2 };
        }
    }
    
    // LEVEL 7: Multiply by non-unit fractions (unified path)
    if (level === 7 && n1 >= config.multiplicationThreshold && Math.random() < config.multiplicationPreferenceRate) {
        const fractionNum2 = generateFractionWithIntegerResult(
            n1, 'x', config.maxDenominator, false, config.preferNonUnitFractions ? config.nonUnitFractionRate : false
        );
        if (fractionNum2) {
            return { operator: 'x', num2: fractionNum2 };
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
    
    // Special operator selection for level 5 which now disallows fraction division
    if (level === 5 && config.disallowFractionDivision) {
        if (operatorBias < 0.4) operator = 'x';
        else if (operatorBias < 0.7) operator = '+';
        else operator = '-';
    }
    // Levels 6 and 7 - avoid division by fractions
    else if ((level === 6 || level === 7) && config.disallowFractionDivision) {
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
    
    // For levels with fractions, ensure we generate fractions that yield integer results
    if (config.strictIntegerResults && config.allowFractions && 
       (operator === 'x' || operator === '/')) {
        
        // Level-specific fraction generation with integer result guarantees
        if (level === 6 && config.unitFractionsOnly && operator === 'x' && Math.random() < 0.6) {
            const fractionNum2 = generateFractionWithIntegerResult(n1, operator, config.maxDenominator, true, false);
            if (fractionNum2) {
                return { operator, num2: fractionNum2 };
            }
        }
        else if (level === 7 && operator === 'x' && Math.random() < 0.4) {
            const fractionNum2 = generateFractionWithIntegerResult(
                n1, operator, config.maxDenominator, false, config.preferNonUnitFractions
            );
            if (fractionNum2) {
                return { operator, num2: fractionNum2 };
            }
        }
        else if (level === 8 && (operator === 'x' || (operator === '/' && !config.disallowFractionDivision)) && Math.random() < 0.5) {
            const fractionNum2 = generateFractionWithIntegerResult(n1, operator, config.maxDenominator, false, false);
            if (fractionNum2) {
                return { operator, num2: fractionNum2 };
            }
        }
        else if ((level === 9 || level === 10) && (operator === 'x' || (operator === '/' && !config.disallowFractionDivision)) && Math.random() < 0.4) {
            const fractionNum2 = generateFractionWithIntegerResult(
                n1, operator, config.maxDenominator, false, level === 10 ? 0.9 : 0.5
            );
            if (fractionNum2) {
                return { operator, num2: fractionNum2 };
            }
        }
    }
    
    // Standard num2 generation for other cases
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
    
    // Post-processing: For levels with disallowed fraction division
    if ((level === 5 || level === 6 || level === 7) && operator === '/' && num2 instanceof Object && config.disallowFractionDivision) {
        operator = 'x';
    }
    
    return { operator, num2 };
}

// Modified to include improved fraction handling and fallback mechanism
function generateNextSum(startNum, level, fractionAttempts = 0) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    // Define attempt limits - using higher limits for complex levels
    const maxAttempts = (level >= 7) ? 150 : 100;
    let attempts = 0;
    
    // Main generation loop with improved fraction handling
    while (attempts < maxAttempts) {
        // Pass the level along with the config and fraction attempts counter
        const { operator, num2 } = selectOperatorAndNum2(startNum, level, config, fractionAttempts);
        
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
                result,
                fractionAttempts: 0 // Reset counter on successful operation
            };
        }
        attempts++;
    }
    
    // Fallback to simple operations if we've exceeded attempts
    return generateFallbackOperation(startNum, level, config);
}

// Enhanced fallback function that creates a guaranteed valid operation
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
            result: n + addend,
            fractionAttempts: 0 // Reset counter 
        };
    }
    
    // If number is close to max, subtract
    const subtrahend = Math.min(Math.floor(Math.random() * 5) + 1, n - 1);
    if (subtrahend > 0) {
        return {
            num1: num,
            operator: '-',
            num2: subtrahend,
            result: n - subtrahend,
            fractionAttempts: 0 // Reset counter
        };
    }
    
    // In the unlikely case n is 1, use multiplication
    return {
        num1: num,
        operator: 'x',
        num2: 2,
        result: n * 2,
        fractionAttempts: 0 // Reset counter
    };
}
