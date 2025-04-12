// sequencegenerator.js - Enhanced version with improved fraction handling and quality checks

const LEVEL_CONFIG = {
    1: { maxNum: 20, allowFractions: false, maxDenominator: 0, gridSize: 6 },
    2: { maxNum: 20, allowFractions: false, maxDenominator: 0, gridSize: 6 },
    3: { maxNum: 50, allowFractions: false, maxDenominator: 0, gridSize: 6, preferDivision: true },
    4: { maxNum: 30, allowFractions: false, maxDenominator: 0, gridSize: 10 },
    5: { 
        maxNum: 99, 
        allowFractions: true, 
        maxDenominator: 2, 
        gridSize: 10, 
        unitFractionsOnly: true, 
        preferDivision: true, 
        divisionThreshold: 20, 
        divisionPreferenceRate: 0.75,
        disallowFractionDivision: true,
        minFractions: 1 // Minimum number of fractions required
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
        strictIntegerResults: true,
        minFractions: 2 // Minimum number of fractions required
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
        strictIntegerResults: true,
        minFractions: 3 // Minimum number of fractions required
    },
    8: { 
        maxNum: 30, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10,
        preferFractionOperations: true,
        fractionOperationRate: 0.5,
        strictIntegerResults: true,
        minFractions: 3 // Minimum number of fractions required
    },
    9: { 
        maxNum: 99, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10,
        preferFractionOperations: true,
        fractionOperationRate: 0.5,
        strictIntegerResults: true,
        minFractions: 4 // Minimum number of fractions required
    },
    10: { 
        maxNum: 99, 
        allowFractions: true, 
        maxDenominator: 12, 
        gridSize: 10, 
        forceFractionOps: true,
        preferFractionOperations: true,
        fractionOperationRate: 0.75,
        preferNonUnitFractions: true,
        nonUnitFractionRate: 0.9,
        preferLargeNumbers: true,
        largeNumberThreshold: 30,
        strictIntegerResults: true,
        maxFractionAttemptsBeforeFallback: 10,
        minFractions: 5 // Minimum number of fractions required
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

function generateFraction(maxDenominator = 12, unitFractionOnly = false, preferNonUnit = false) {
    maxDenominator = Math.max(2, maxDenominator);
    
    // Case 1: Generate unit fraction
    if (unitFractionOnly) {
        const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
        return {
            numerator: 1,
            denominator: denominator,
            toString() { return `1/${this.denominator}`; },
            toDecimal() { return 1 / this.denominator; }
        };
    }
    
    // Case 2: Generate non-unit fraction if preferred
    const useNonUnitFraction = preferNonUnit && Math.random() < (preferNonUnit === true ? 0.75 : preferNonUnit);
    
    if (useNonUnitFraction) {
        const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
        if (denominator < 2) {
            return {
                numerator: 1,
                denominator: 2,
                toString() { return `1/2`; },
                toDecimal() { return 0.5; }
            };
        }
        
        let numeratorOptions = [];
        for (let i = 2; i < denominator; i++) {
            numeratorOptions.push(i);
        }
        
        if (numeratorOptions.length === 0) {
            return {
                numerator: 1,
                denominator: denominator,
                toString() { return `1/${this.denominator}`; },
                toDecimal() { return 1 / this.denominator; }
            };
        }
        
        const numerator = numeratorOptions[Math.floor(Math.random() * numeratorOptions.length)];
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
    
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(numerator, denominator);
    
    return {
        numerator: numerator / divisor,
        denominator: denominator / divisor,
        toString() { return `${this.numerator}/${this.denominator}`; },
        toDecimal() { return this.numerator / this.denominator; }
    };
}

function generateFractionWithIntegerResult(num1, operator, maxDenominator, unitFractionOnly, preferNonUnit) {
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    
    // For multiplication - find fractions that give integer results
    if (operator === 'x') {
        let possibleDenominators = [];
        for (let denom = 2; denom <= maxDenominator; denom++) {
            possibleDenominators.push(denom);
        }
        
        // Shuffle to avoid bias
        possibleDenominators = shuffleArray(possibleDenominators);
        
        for (const denominator of possibleDenominators) {
            // For unit fractions, numerator is always 1
            if (unitFractionOnly) {
                if (Number.isInteger(n1 / denominator) && n1 / denominator > 0) {
                    // Skip if the result would be 1
                    if (n1 / denominator === 1 && Math.random() < 0.8) {
                        continue;
                    }
                    
                    return {
                        numerator: 1,
                        denominator: denominator,
                        toString() { return `1/${this.denominator}`; },
                        toDecimal() { return 1 / this.denominator; }
                    };
                }
            } else {
                // For non-unit fractions
                let numeratorOptions = [];
                for (let num = 1; num < denominator; num++) {
                    if (Number.isInteger(n1 * num / denominator) && n1 * num / denominator > 0) {
                        // Skip if the result would be 1
                        if (n1 * num / denominator === 1 && Math.random() < 0.8) {
                            continue;
                        }
                        
                        numeratorOptions.push(num);
                    }
                }
                
                // Filter for non-unit fractions if preferred
                if (preferNonUnit && numeratorOptions.length > 1) {
                    numeratorOptions = numeratorOptions.filter(num => num > 1);
                }
                
                if (numeratorOptions.length > 0) {
                    const numerator = numeratorOptions[Math.floor(Math.random() * numeratorOptions.length)];
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
    
    // For division
    if (operator === '/') {
        let possibleDenominators = [];
        for (let denom = 2; denom <= maxDenominator; denom++) {
            possibleDenominators.push(denom);
        }
        
        possibleDenominators = shuffleArray(possibleDenominators);
        
        for (const denominator of possibleDenominators) {
            if (unitFractionOnly) {
                if (Number.isInteger(n1 * denominator) && n1 * denominator > 0) {
                    // Skip if the result would be 1
                    if (n1 * denominator === 1 && Math.random() < 0.8) {
                        continue;
                    }
                    
                    return {
                        numerator: 1,
                        denominator: denominator,
                        toString() { return `1/${this.denominator}`; },
                        toDecimal() { return 1 / this.denominator; }
                    };
                }
            } else {
                let numeratorOptions = [];
                for (let num = 1; num < denominator; num++) {
                    if (Number.isInteger(n1 * denominator / num) && n1 * denominator / num > 0) {
                        // Skip if the result would be 1
                        if (n1 * denominator / num === 1 && Math.random() < 0.8) {
                            continue;
                        }
                        
                        numeratorOptions.push(num);
                    }
                }
                
                if (preferNonUnit && numeratorOptions.length > 1) {
                    numeratorOptions = numeratorOptions.filter(num => num > 1);
                }
                
                if (numeratorOptions.length > 0) {
                    const numerator = numeratorOptions[Math.floor(Math.random() * numeratorOptions.length)];
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
    
    // If we couldn't find a suitable fraction
    return null;
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
    
    // For strict integer results when using fractions
    if (config.strictIntegerResults && 
        (num1 instanceof Object || num2 instanceof Object) && 
        !Number.isInteger(result)) {
        return null;
    }
    
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

function selectOperatorAndNum2(num1, level, config, fractionAttempts = 0, countOnes = 0) {
    config = LEVEL_CONFIG[level] || config;
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    let operator, num2;
    
    // Reduce likelihood of division for prime numbers to avoid result = 1
    const isPrimeNumber = isPrime(n1);
    if (isPrimeNumber && countOnes >= 1 && Math.random() < 0.8) {
        // Avoid division for prime numbers if we already have too many ones
        const availableOps = ['+', '-', 'x'];
        operator = availableOps[Math.floor(Math.random() * availableOps.length)];
    }
    
    // Check if we need to fall back
    const useFallback = level === 10 && 
        fractionAttempts >= (config.maxFractionAttemptsBeforeFallback || 10);
    
    if (useFallback) {
        operator = Math.random() < 0.5 ? '+' : '-';
        
        if (config.preferLargeNumbers && config.largeNumberThreshold) {
            if (operator === '+') {
                const upperLimit = Math.min(config.maxNum - n1, config.maxNum);
                const lowerLimit = Math.min(config.largeNumberThreshold, upperLimit);
                
                if (upperLimit > lowerLimit) {
                    num2 = Math.floor(Math.random() * (upperLimit - lowerLimit)) + lowerLimit;
                    return { operator, num2 };
                }
            } else if (operator === '-') {
                const upperLimit = Math.min(n1 - 1, config.maxNum);
                const lowerLimit = Math.min(config.largeNumberThreshold, upperLimit);
                
                if (upperLimit >= lowerLimit) {
                    num2 = Math.floor(Math.random() * (upperLimit - lowerLimit + 1)) + lowerLimit;
                    return { operator, num2 };
                }
            }
        }
        
        if (operator === '+') {
            const maxAdd = Math.min(config.maxNum - n1, 15);
            num2 = Math.floor(Math.random() * maxAdd) + 1;
        } else {
            const maxSubtract = Math.min(n1 - 1, 15);
            num2 = Math.floor(Math.random() * maxSubtract) + 1;
        }
        
        return { operator, num2 };
    }
    
    // LEVEL 10: Force fraction operations 
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
    
    // LEVEL 5: Division for large non-prime numbers
    if (level === 5 && n1 >= config.divisionThreshold && !isPrimeNumber && Math.random() < config.divisionPreferenceRate) {
        const factors = getFactorsOf(n1);
        
        if (factors.length > 0) {
            const factor = factors[Math.floor(Math.random() * factors.length)];
            
            // Skip if the result would be 1 and we already have too many ones
            if (n1 / factor === 1 && countOnes >= 1 && Math.random() < 0.8) {
                // Don't use this division, try something else
            } else {
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
    }
    
    // LEVEL 6: Multiply by unit fractions
    if (level === 6 && n1 >= config.multiplicationThreshold && !isPrimeNumber && Math.random() < config.multiplicationPreferenceRate) {
        const fractionNum2 = generateFractionWithIntegerResult(
            n1, 'x', config.maxDenominator, true, false
        );
        if (fractionNum2) {
            return { operator: 'x', num2: fractionNum2 };
        }
    }
    
    // LEVEL 7: Multiply by non-unit fractions
    if (level === 7 && n1 >= config.multiplicationThreshold && Math.random() < config.multiplicationPreferenceRate) {
        const fractionNum2 = generateFractionWithIntegerResult(
            n1, 'x', config.maxDenominator, false, config.preferNonUnitFractions ? config.nonUnitFractionRate : false
        );
        if (fractionNum2) {
            return { operator: 'x', num2: fractionNum2 };
        }
    }
    
    // For large numbers, try to make them smaller
    if (n1 > 16) {
        if (Math.random() < 0.8) {
            if (Math.random() < 0.4) {
                const targetResult = Math.floor(Math.random() * 16) + 1;
                // Reduce likelihood of generating a result of 1
                if (targetResult === 1 && countOnes >= 1 && Math.random() < 0.8) {
                    const adjustedTarget = Math.floor(Math.random() * 15) + 2;
                    const num2Value = Math.floor(n1 - adjustedTarget);
                    if (num2Value > 1 && num2Value <= config.maxNum) {
                        return { operator: '-', num2: num2Value };
                    }
                } else {
                    const num2Value = Math.floor(n1 - targetResult);
                    if (num2Value > 1 && num2Value <= config.maxNum) {
                        return { operator: '-', num2: num2Value };
                    }
                }
            } else {
                for (let divisor = 2; divisor <= Math.min(10, config.maxNum); divisor++) {
                    // Skip division if the result would be 1 and we already have too many ones
                    if (n1 / divisor === 1 && countOnes >= 1 && Math.random() < 0.8) {
                        continue;
                    }
                    
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
            // Skip division if the result would be 1 and we already have too many ones
            if (n1 / divisor === 1 && countOnes >= 1 && Math.random() < 0.8) {
                continue;
            }
            
            if (n1 % divisor === 0) {
                return { operator: '/', num2: divisor };
            }
        }
    }
    
    // Default operator selection
    const operatorBias = Math.random();
    
    // Special operator selection for level 5
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
    // For other levels, use normal distribution (but reduce division if we have too many ones)
    else {
        if (countOnes >= 1 && isPrimeNumber) {
            // Reduce possibility of divisions for prime numbers to avoid result = 1
            if (operatorBias < 0.35) operator = 'x';
            else if (operatorBias < 0.45) operator = '/'; // Reduced from 0.6 to 0.45
            else if (operatorBias < 0.75) operator = '+';
            else operator = '-';
        } else {
            if (operatorBias < 0.35) operator = 'x';
            else if (operatorBias < 0.6) operator = '/';
            else if (operatorBias < 0.8) operator = '+';
            else operator = '-';
        }
    }
    
    // For level 5 - occasionally allow 1/2
    if (level === 5 && config.allowFractions && operator === 'x' && Math.random() < 0.1) {
        return {
            operator: 'x',
            num2: { numerator: 1, denominator: 2, toString() { return "1/2"; }, toDecimal() { return 0.5; } }
        };
    }
    
    // For levels with fractions, ensure integer results
    if (config.strictIntegerResults && config.allowFractions && 
       (operator === 'x' || operator === '/')) {
        
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
    
    // Standard num2 generation
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
    
    // Post-processing for levels with disallowed fraction division
    if ((level === 5 || level === 6 || level === 7) && operator === '/' && num2 instanceof Object && config.disallowFractionDivision) {
        operator = 'x';
    }
    
    // For division operations, check if the result would be 1 and we already have too many ones
    if (operator === '/' && countOnes >= 1) {
        const expectedResult = n1 / (num2 instanceof Object ? num2.toDecimal() : num2);
        if (Math.abs(expectedResult - 1) < 0.0001 && Math.random() < 0.8) {
            // Change the operator to avoid too many 1s
            const alternateOps = ['+', '-', 'x'];
            operator = alternateOps[Math.floor(Math.random() * alternateOps.length)];
            // Generate a new num2 for the alternate operation
            if (operator === '+') {
                num2 = Math.floor(Math.random() * Math.min(10, config.maxNum - n1)) + 1;
            } else if (operator === '-') {
                num2 = Math.floor(Math.random() * Math.min(10, n1 - 1)) + 1;
            } else { // 'x'
                num2 = Math.floor(Math.random() * 4) + 2; // Small numbers for multiplication
            }
        }
    }
    
    return { operator, num2 };
}

// Modified with improved fallback mechanism
function generateNextSum(startNum, level, fractionAttempts = 0, countOnes = 0) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    // Define attempt limits - using higher limits for complex levels
    const maxAttempts = (level >= 7) ? 150 : 100;
    let attempts = 0;
    
    // Main generation loop with improved fraction handling
    while (attempts < maxAttempts) {
        // Pass the level, config, fraction attempts counter, and ones counter
        const { operator, num2 } = selectOperatorAndNum2(startNum, level, config, fractionAttempts, countOnes);
        
        // Skip if both are fractions - this is often a problem source
        if (startNum instanceof Object && num2 instanceof Object) {
            attempts++;
            // Don't completely skip, but reduce frequency
            if (Math.random() < 0.8) continue;
        }
         
        const result = calculateResult(startNum, operator, num2, config);
        
        if (result !== null && isValidNumber(result, config)) {
            // Check if result is 1 and we already have too many ones
            if (result === 1 && countOnes >= 2 && Math.random() < 0.9) {
                attempts++;
                continue; // Skip this result and try again
            }
            
            // Determine if the count of ones should be increased
            const newCountOnes = result === 1 ? countOnes + 1 : countOnes;
            
            return {
                num1: startNum,
                operator,
                num2,
                result,
                fractionAttempts: 0, // Reset fraction counter on successful operation
                countOnes: newCountOnes // Track the number of ones
            };
        }
        attempts++;
    }
    
    // Fallback to simple operations if we've exceeded attempts
    return generateFallbackOperation(startNum, level, config, countOnes);
}

// Enhanced fallback function that creates a guaranteed valid operation
function generateFallbackOperation(num, level, config, countOnes = 0) {
    const n = num instanceof Object ? num.toDecimal() : num;
    
    // Try addition first if we have room
    if (n < config.maxNum - 2) {
        // Add a small number
        const addend = Math.min(Math.floor(Math.random() * 5) + 1, config.maxNum - n);
        const result = n + addend;
        
        // Avoid result = 1 if we already have too many ones
        if (result === 1 && countOnes >= 2) {
            const adjustedAddend = Math.min(Math.floor(Math.random() * 5) + 2, config.maxNum - n);
            return {
                num1: num,
                operator: '+',
                num2: adjustedAddend,
                result: n + adjustedAddend,
                fractionAttempts: 0,
                countOnes: countOnes // No change in count of ones
            };
        }
        
        return {
            num1: num,
            operator: '+',
            num2: addend,
            result: n + addend,
            fractionAttempts: 0,
            countOnes: result === 1 ? countOnes + 1 : countOnes
        };
    }
    
    // If number is close to max, subtract
    const subtrahend = Math.min(Math.floor(Math.random() * 5) + 1, n - 1);
    if (subtrahend > 0) {
        const result = n - subtrahend;
        
        // Avoid result = 1 if we already have too many ones
        if (result === 1 && countOnes >= 2) {
            const adjustedSubtrahend = Math.min(Math.floor(Math.random() * 5) + 2, n - 2);
            if (adjustedSubtrahend > 0) {
                return {
                    num1: num,
                    operator: '-',
                    num2: adjustedSubtrahend,
                    result: n - adjustedSubtrahend,
                    fractionAttempts: 0,
                    countOnes: countOnes // No change in count of ones
                };
            }
        }
        
        return {
            num1: num,
            operator: '-',
            num2: subtrahend,
            result: result,
            fractionAttempts: 0,
            countOnes: result === 1 ? countOnes + 1 : countOnes
        };
    }
    
    // In the unlikely case n is 1, use multiplication
    // Avoid generating another 1 if we already have too many
    const multiplier = (countOnes >= 2) ? 3 : 2;
    return {
        num1: num,
        operator: 'x',
        num2: multiplier,
        result: n * multiplier,
        fractionAttempts: 0,
        countOnes: countOnes // No change in count of ones for multiplication
    };
}

export function formatNumber(num) {
    if (num instanceof Object) return num.toString();
    return num.toString();
}

// Function to count fractions in a sequence
function countFractionsInSequence(sequence, limit = 12) {
    let fractionCount = 0;
    // Take only the first 'limit' sums
    const limitedSequence = sequence.slice(0, limit);
    
    for (const sum of limitedSequence) {
        // Check if num2 is a fraction
        if (sum.num2 instanceof Object && typeof sum.num2.numerator === 'number') {
            fractionCount++;
        }
    }
    
    return fractionCount;
}

// Function to count '1' values in results
function countOnesInResults(sequence, limit = 12) {
    let onesCount = 0;
    // Take only the first 'limit' sums
    const limitedSequence = sequence.slice(0, limit);
    
    for (const sum of limitedSequence) {
        if (sum.result === 1) {
            onesCount++;
        }
    }
    
    return onesCount;
}

export function generateSequence(level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    // Minimum sequence length needed for the game
    const MIN_SEQUENCE_LENGTH = 12;
    
    // For complex levels (7-10), use multiple attempts if needed
    const maxTotalAttempts = (level >= 7) ? 5 : 3; // Increased attempts to meet fraction requirements
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
        
        // Add tracking for fraction operations to implement fallback
        let consecutiveFractionAttempts = 0;
        // Track the count of results that equal 1
        let countOnes = 0;
        
        // Try to build sequence
        for (let i = 0; i < 100; i++) {
            // Pass the current count of fraction attempts and ones for levels with fractions
            const sum = generateNextSum(currentNum, level, 
                config.allowFractions ? consecutiveFractionAttempts : 0,
                countOnes);
            
            // Update count of ones if necessary
            if (sum.countOnes !== undefined) {
                countOnes = sum.countOnes;
            } else if (sum.result === 1) {
                countOnes++;
            }
            
            // For fraction levels, track consecutive fraction attempts
            if (config.allowFractions) {
                // If the operation has a fraction, increment the counter
                if (sum.num2 instanceof Object || sum.operator === 'x' || sum.operator === '/') {
                    consecutiveFractionAttempts++;
                } else {
                    // Reset counter if we used addition or subtraction
                    consecutiveFractionAttempts = 0;
                }
                
                // Force fallback after too many consecutive fraction attempts
                // Different levels have different thresholds for fallback
                const fallbackThreshold = level === 10 ? 
                    (config.maxFractionAttemptsBeforeFallback || 10) :
                    (level >= 8 ? 8 : 5);
                
                if (consecutiveFractionAttempts > fallbackThreshold) {
                    // Force a fallback to addition or subtraction
                    const fallbackSum = generateFallbackOperation(currentNum, level, config, countOnes);
                    
                    // Update count of ones if necessary
                    if (fallbackSum.countOnes !== undefined) {
                        countOnes = fallbackSum.countOnes;
                    } else if (fallbackSum.result === 1) {
                        countOnes++;
                    }
                    
                    sequence.push({
                        ...fallbackSum,
                        display: `${formatNumber(fallbackSum.num1)} ${fallbackSum.operator} ${formatNumber(fallbackSum.num2)} = ${formatNumber(fallbackSum.result)}`
                    });
                    
                    currentNum = fallbackSum.result;
                    consecutiveFractionAttempts = 0; // Reset counter
                    continue;
                }
            }
            
            sequence.push({
                ...sum,
                display: `${formatNumber(sum.num1)} ${sum.operator} ${formatNumber(sum.num2)} = ${formatNumber(sum.result)}`
            });
            
            currentNum = sum.result;
            
            // If we have enough operations, we're done
            if (sequence.length >= MIN_SEQUENCE_LENGTH) {
                // Check if we have met the minimum fraction requirements
                if (config.allowFractions && config.minFractions) {
                    const fractionCount = countFractionsInSequence(sequence);
                    
                    // If minimum fractions not met, try again with a new sequence
                    if (fractionCount < config.minFractions) {
                        console.log(`Level ${level}: Not enough fractions (${fractionCount}/${config.minFractions}). Trying again...`);
                        break; // Start a new sequence
                    }
                }
                
                // Check if we have too many ones in the results
                const onesCount = countOnesInResults(sequence);
                if (onesCount > 2) {
                    console.log(`Level ${level}: Too many 1's in results (${onesCount}/2). Trying again...`);
                    break; // Start a new sequence
                }
                
                // If we passed both checks, return the sequence
                return sequence;
            }
        }
        
        // If we didn't get enough operations or failed a check, continue to next attempt
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
    
    // For fraction levels, include some fraction operations even in simple sequence
    const includeFractions = config.allowFractions && level >= 5;
    let fractionCount = 0;
    let onesCount = 0;
    
    // Create at least 15 operations to ensure enough for the game
    for (let i = 0; i < 15; i++) {
        // For fraction levels, prioritize fraction operations if we need more for minimum requirement
        if (includeFractions && fractionCount < (config.minFractions || 0) && 
            i > 2 && Math.random() < 0.8) {
            // Try to create a fraction operation that produces an integer
            if (Math.random() < 0.7) {
                // Multiplication by unit fraction that gives integer result
                // Find divisors of currentNum to guarantee integer result
                const factors = getFactorsOf(currentNum);
                if (factors.length > 0) {
                    const factor = factors[Math.floor(Math.random() * factors.length)];
                    const denominator = factor;
                    const numerator = 1; // Unit fraction
                    
                    const fractionNum2 = {
                        numerator, 
                        denominator,
                        toString() { return `${this.numerator}/${this.denominator}`; },
                        toDecimal() { return this.numerator / this.denominator; }
                    };
                    
                    const result = currentNum * (numerator / denominator);
                    
                    // Skip if result is 1 and we already have too many ones
                    if (result === 1 && onesCount >= 2) {
                        continue;
                    }
                    
                    sequence.push({
                        num1: currentNum,
                        operator: 'x',
                        num2: fractionNum2,
                        result: result,
                        display: `${currentNum} × ${fractionNum2.toString()} = ${result}`
                    });
                    
                    currentNum = result;
                    fractionCount++;
                    
                    if (result === 1) {
                        onesCount++;
                    }
                    
                    continue;
                }
            } 
            // If multiplication didn't work, try a different operation
        }
        
        // Standard operations (addition, subtraction, simple multiplication/division)
        if (i % 2 === 0 && currentNum < config.maxNum - 5) {
            // Addition
            const addend = Math.floor(Math.random() * 5) + 1;
            const result = currentNum + addend;
            
            // Skip if result is 1 and we already have too many ones
            if (result === 1 && onesCount >= 2) {
                continue;
            }
            
            sequence.push({
                num1: currentNum,
                operator: '+',
                num2: addend,
                result: result,
                display: `${currentNum} + ${addend} = ${result}`
            });
            
            currentNum = result;
            
            if (result === 1) {
                onesCount++;
            }
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
                    // Avoid division if it would result in 1 and we already have too many ones
                    if (currentNum / 2 === 1 && onesCount >= 2) {
                        // Use multiplication by 3 instead
                        const altResult = currentNum * 3;
                        if (altResult <= config.maxNum) {
                            sequence.push({
                                num1: currentNum,
                                operator: 'x',
                                num2: 3,
                                result: altResult,
                                display: `${currentNum} × 3 = ${altResult}`
                            });
                            currentNum = altResult;
                        } else {
                            // Subtraction as very last resort
                            sequence.push({
                                num1: currentNum,
                                operator: '-',
                                num2: 1,
                                result: currentNum - 1,
                                display: `${currentNum} - 1 = ${currentNum - 1}`
                            });
                            currentNum = currentNum - 1;
                        }
                    } else {
                        const divResult = Math.floor(currentNum / 2); // Ensure integer result
                        sequence.push({
                            num1: currentNum,
                            operator: '/',
                            num2: 2,
                            result: divResult,
                            display: `${currentNum} ÷ 2 = ${divResult}`
                        });
                        currentNum = divResult;
                        
                        if (divResult === 1) {
                            onesCount++;
                        }
                    }
                }
            } else {
                // Normal subtraction case
                const subtrahend = Math.floor(Math.random() * maxSubtract) + 1;
                const result = currentNum - subtrahend;
                
                // Skip if result is 1 and we already have too many ones
                if (result === 1 && onesCount >= 2) {
                    continue;
                }
                
                sequence.push({
                    num1: currentNum,
                    operator: '-',
                    num2: subtrahend,
                    result: result,
                    display: `${currentNum} - ${subtrahend} = ${result}`
                });
                
                currentNum = result;
                
                if (result === 1) {
                    onesCount++;
                }
            }
        }
    }
    
    // After creating the sequence, if we're still short on fractions, try to add some
    if (includeFractions && fractionCount < (config.minFractions || 0)) {
        // Look for operations where we can replace with fractions
        for (let i = 0; i < sequence.length && fractionCount < config.minFractions; i++) {
            const sum = sequence[i];
            
            // Skip if this sum already has a fraction
            if (sum.num2 instanceof Object) continue;
            
            // Skip if sum.num1 is 1 (not many options for fractions)
            if (sum.num1 === 1) continue;
            
            // Try to replace with a fraction operation
            const factors = getFactorsOf(sum.num1);
            if (factors.length > 0) {
                const factor = factors[Math.floor(Math.random() * factors.length)];
                const denominator = factor;
                const numerator = 1; // Unit fraction
                
                const fractionNum2 = {
                    numerator, 
                    denominator,
                    toString() { return `${this.numerator}/${this.denominator}`; },
                    toDecimal() { return this.numerator / this.denominator; }
                };
                
                const result = sum.num1 * (numerator / denominator);
                
                // Only replace if result is not 1 or we don't have too many ones
                if (result !== 1 || onesCount < 2) {
                    sequence[i] = {
                        num1: sum.num1,
                        operator: 'x',
                        num2: fractionNum2,
                        result: result,
                        display: `${sum.num1} × ${fractionNum2.toString()} = ${result}`
                    };
                    
                    fractionCount++;
                    
                    // Update the next operation's num1
                    if (i + 1 < sequence.length) {
                        sequence[i + 1].num1 = result;
                        sequence[i + 1].display = `${formatNumber(result)} ${sequence[i + 1].operator} ${formatNumber(sequence[i + 1].num2)} = ${formatNumber(sequence[i + 1].result)}`;
                    }
                }
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
