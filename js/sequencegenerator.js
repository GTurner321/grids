// sequencegenerator.js

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
        maxDenominator: 8,  // Reduced from 12 to 8 for simpler fractions
        gridSize: 10,
        preferFractionMultiplication: true, 
        disallowFractionDivision: true,
        multiplicationThreshold: 10,
        multiplicationPreferenceRate: 0.3,  // Reduced from 0.5 to 0.3
        preferNonUnitFractions: true,
        nonUnitFractionRate: 0.4  // Reduced from 0.75 to 0.4
    },
    8: { 
        maxNum: 30, 
        allowFractions: true, 
        maxDenominator: 8, 
        gridSize: 10,
        preferFractionOperations: true,
        fractionOperationRate: 0.4
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

function generateFraction(maxDenominator = 12, unitFractionOnly = false, preferNonUnit = false) {
    // Reduce the preference rate for non-unit fractions to avoid infinite loops
    const nonUnitRate = preferNonUnit ? 0.5 : 0.25; // Reduced from 0.75 to 0.5
    
    // If we prefer non-unit fractions and not forced to use unit fractions
    if (preferNonUnit && !unitFractionOnly && Math.random() < nonUnitRate) {
        const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
        // Ensure numerator isn't 1 (not a unit fraction) and is less than denominator
        let numerator;
        let attempts = 0;
        do {
            numerator = Math.floor(Math.random() * (denominator - 1)) + 2;
            attempts++;
            // Break after a few attempts to avoid infinite loops
            if (attempts > 10) {
                numerator = 2; // Default to a simpler fraction
                break;
            }
        } while (numerator === 1 || numerator >= denominator);
        
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
    
    // Rest of the function remains the same...
    const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
    const numerator = unitFractionOnly ? 1 : Math.floor(Math.random() * (denominator - 1)) + 1;
    
    // If unit fraction, no need to simplify
    if (unitFractionOnly || numerator === 1) {
        return {
            numerator: 1,
            denominator: denominator,
            toString() {
                return `1/${this.denominator}`;
            },
            toDecimal() {
                return 1 / this.denominator;
            }
        };
    }
    
    // Simplify regular fraction
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
    try {
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

function selectOperatorAndNum2(num1, level, config) {
   // Make sure we have the correct config
   config = LEVEL_CONFIG[level] || config;
   const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
   let operator, num2;
   
   // Special handling for level 10
   if (level === 10) {
       return selectOperatorAndNum2ForLevel10(num1, config);
   }
   
   // Level 5: Preference for division when numbers are large and not prime
   if (level === 5 && n1 >= config.divisionThreshold && !isPrime(n1) && Math.random() < config.divisionPreferenceRate) {
       const factors = getFactorsOf(n1);
       
       if (factors.length > 0) {
           // Choose a random factor (not 1 or itself)
           const factor = factors[Math.floor(Math.random() * factors.length)];
           
           // When dividing by 2, occasionally use multiplication by 1/2 instead (50% chance)
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
   
   // Level 6: Preference for multiplying by fractions for non-prime numbers
   if (level === 6 && n1 >= config.multiplicationThreshold && !isPrime(n1) && Math.random() < config.multiplicationPreferenceRate) {
       return { 
           operator: 'x', 
           num2: generateFraction(config.maxDenominator, true) 
       };
   }
   
   // Level 7: Same as level 6 but with preference for non-unit fractions
   if (level === 7 && n1 >= config.multiplicationThreshold && !isPrime(n1) && Math.random() < config.multiplicationPreferenceRate) {
       return { 
           operator: 'x', 
           num2: generateFraction(config.maxDenominator, false, config.preferNonUnitFractions) 
       };
   }
   
   // Level 8: Preference for fraction operations (both * and /) for non-prime numbers
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
   
   // For large numbers, try to make them smaller with subtraction or division
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
   
   // For level 3, prefer division for large numbers (additional preference)
   if (level === 3 && n1 > 30 && Math.random() < 0.6) {
       for (let divisor = 2; divisor <= Math.min(10, config.maxNum); divisor++) {
           if (n1 % divisor === 0) {
               return { operator: '/', num2: divisor };
           }
       }
   }
   
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
   
   // Generate num2 based on level configuration
   
   // For level 5 - occasionally allow 1/2 as a fraction, but at a much lower rate
   if (level === 5 && config.allowFractions && operator === 'x' && Math.random() < 0.1) {
       return {
           operator: 'x',
           num2: { numerator: 1, denominator: 2, toString() { return "1/2"; }, toDecimal() { return 0.5; } }
       };
   }
   
   // For level 6, ensure fractions are unit fractions
   if (level === 6 && config.allowFractions && config.unitFractionsOnly && 
      (operator === 'x') && Math.random() < 0.6) {
       num2 = generateFraction(config.maxDenominator, true);
   }
   // For level 7, prefer non-unit fractions when multiplying
   else if (level === 7 && config.allowFractions && 
      (operator === 'x') && Math.random() < 0.4) { // Reduced from 0.6 to 0.4
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
   
   // If level 6 or 7 and division and num2 is a fraction, change to multiplication (fraction division not allowed)
   if ((level === 6 || level === 7) && operator === '/' && num2 instanceof Object && config.disallowFractionDivision) {
       operator = 'x';
   }
   
   return { operator, num2 };
}

// Specialized function for level 10
function selectOperatorAndNum2ForLevel10(num1, config) {
    const n1 = num1 instanceof Object ? num1.toDecimal() : num1;
    
    // Only force fraction operations if the number is in a good range
    // and not too many attempts have been made
    if (n1 >= 2 && n1 <= 12 && config.forceFractionOps && Math.random() < 0.7) {
        if (Math.random() < 0.5) {
            // Multiplication by a simple fraction (1/2, 1/3, 1/4)
            const simpleDenominators = [2, 3, 4];
            const denominator = simpleDenominators[Math.floor(Math.random() * simpleDenominators.length)];
            return { 
                operator: 'x', 
                num2: { 
                    numerator: 1, 
                    denominator, 
                    toString() { return `1/${denominator}`; }, 
                    toDecimal() { return 1/denominator; } 
                } 
            };
        } else {
            // Division by a simple whole number
            const divisor = Math.min(3, Math.floor(n1 / 2));
            if (divisor > 0) {
                return { operator: '/', num2: divisor };
            }
        }
    }
    
    // Fall back to standard operator selection
    const operatorBias = Math.random();
    let operator;
    
    if (operatorBias < 0.4) operator = '+';
    else if (operatorBias < 0.7) operator = '-';
    else if (operatorBias < 0.85) operator = 'x';
    else operator = '/';
    
    // Generate a safer num2
    let num2;
    if (operator === '+' || operator === '-') {
        num2 = Math.floor(Math.random() * 5) + 1; // Small numbers for addition/subtraction
    } else if (operator === 'x') {
        num2 = Math.floor(Math.random() * 3) + 2; // 2-4 for multiplication
    } else { // division
        // Find a divisor that works
        const possibleDivisors = [2, 3, 4, 5];
        for (const d of possibleDivisors) {
            if (n1 % d === 0) {
                num2 = d;
                break;
            }
        }
        if (!num2) num2 = 2; // Default
    }
    
    return { operator, num2 };
}

function generateNextSum(startNum, level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    let attempts = 0;
    const maxAttempts = 150; // Increased from 100 to 150
    
    while (attempts < maxAttempts) {
        try {
            // Pass the level along with the config
            const { operator, num2 } = selectOperatorAndNum2(startNum, level, config);
            
            // Skip if both are fractions (unless it's level 10 which might need this)
            if (level !== 10 && startNum instanceof Object && num2 instanceof Object) {
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
        } catch (error) {
            console.error(`Error in generateNextSum for level ${level}:`, error);
        }
        attempts++;
    }
    
    console.warn(`Failed to generate valid sum after ${maxAttempts} attempts for level ${level}`);
    
    // Fallback solutions for different levels
    if (typeof startNum === 'number') {
        // For fraction-heavy levels (7-10), provide fallbacks
        if (level >= 7 && level <= 10) {
            // First try a simple multiplication if number is small
            if (startNum <= 10) {
                const num2 = 2;
                const result = startNum * num2;
                
                if (result <= config.maxNum) {
                    return {
                        num1: startNum,
                        operator: 'x',
                        num2,
                        result
                    };
                }
            }
            
            // Then try simple addition as a last resort
            const num2 = Math.min(3, config.maxNum);
            const result = startNum + num2;
            
            if (result <= config.maxNum) {
                return {
                    num1: startNum,
                    operator: '+',
                    num2,
                    result
                };
            }
            
            // If the number is large, try subtraction
            if (startNum > 10) {
                const num2 = 2;
                const result = startNum - num2;
                
                if (result > 0) {
                    return {
                        num1: startNum,
                        operator: '-',
                        num2,
                        result
                    };
                }
            }
            
            // For very large numbers, division is the best fallback
            if (startNum > 20 && startNum % 2 === 0) {
                return {
                    num1: startNum,
                    operator: '/',
                    num2: 2,
                    result: startNum / 2
                };
            }
        }
    } else if (startNum instanceof Object) {
        // Handle fraction startNum fallbacks
        // Convert fraction to decimal for calculation
        const startDecimal = startNum.toDecimal();
        
        // Try multiplication by 2 (simple operation that often works with fractions)
        const result = startDecimal * 2;
        if (result <= config.maxNum && result > 0) {
            return {
                num1: startNum,
                operator: 'x',
                num2: 2,
                result: Math.floor(result) // Convert to whole number for simplicity
            };
        }
    }
    
    // Last resort - return a predefined sum that's guaranteed to work
    // This ensures the game doesn't crash even if all else fails
    return {
        num1: 5,
        operator: '+',
        num2: 1,
        result: 6
    };
}

export function formatNumber(num) {
    if (num instanceof Object) return num.toString();
    return num.toString();
}

export function generateSequence(level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    return new Promise((resolve, reject) => {
        try {
            let sequence = [];
            // Start with a smaller number for easier first calculations
            let currentNum = Math.floor(Math.random() * 16) + 1;
            
            // For level 5-10, occasionally start with a larger number
            if (level >= 5 && Math.random() < 0.3) {
                currentNum = Math.floor(Math.random() * 30) + 10;
            }
            
            // Set timeout for sequence generation to prevent browser hanging
            const timeoutId = setTimeout(() => {
                console.warn(`Sequence generation for level ${level} timed out, using fallback sequence`);
                resolve(generateFallbackSequence(level));
            }, 5000); // 5 second timeout
            
            // Maximum operations to try generating
            const maxOperations = 50;
            
            // Target sequence length (operations)
            const targetLength = level <= 6 ? 10 : 15;
            
            for (let i = 0; i < maxOperations; i++) {
                const sum = generateNextSum(currentNum, level);
                if (!sum) {
                    console.warn(`Failed to generate next sum at position ${i} for level ${level}`);
                    
                    // If we have a minimally viable sequence, use it
                    if (sequence.length >= Math.min(5, targetLength)) {
                        clearTimeout(timeoutId);
                        resolve(sequence);
                        return;
                    }
                    
                    // Otherwise use fallback
                    clearTimeout(timeoutId);
                    resolve(generateFallbackSequence(level));
                    return;
                }
                
                sequence.push({
                    ...sum,
                    display: `${formatNumber(sum.num1)} ${sum.operator} ${formatNumber(sum.num2)} = ${formatNumber(sum.result)}`
                });
                
                currentNum = sum.result;
                
                // If we've reached our target length, we're done
                if (sequence.length >= targetLength) {
                    clearTimeout(timeoutId);
                    resolve(sequence);
                    return;
                }
            }
            
            // If we got here, we have a sequence but it may not be the target length
            clearTimeout(timeoutId);
            resolve(sequence);
            
        } catch (error) {
            console.error(`Error generating sequence for level ${level}:`, error);
            resolve(generateFallbackSequence(level));
        }
    });
}

// Fallback sequence generator for when the normal generation fails
function generateFallbackSequence(level) {
    console.log(`Using fallback sequence for level ${level}`);
    
    // Start with a small, easy number
    let start = 3;
    
    // Create basic operations based on level
    const sequence = [];
    
    if (level <= 3) {
        // Simple addition/subtraction sequence for levels 1-3
        sequence.push(createOperation(start, '+', 2, 5));
        sequence.push(createOperation(5, '+', 3, 8));
        sequence.push(createOperation(8, '-', 2, 6));
        sequence.push(createOperation(6, 'x', 2, 12));
        sequence.push(createOperation(12, '/', 3, 4));
        sequence.push(createOperation(4, '+', 5, 9));
        sequence.push(createOperation(9, '+', 3, 12));
    } else if (level <= 6) {
        // More complex operations for levels 4-6
        sequence.push(createOperation(start, 'x', 2, 6));
        sequence.push(createOperation(6, '+', 6, 12));
        sequence.push(createOperation(12, '/', 4, 3));
        sequence.push(createOperation(3, 'x', 5, 15));
        sequence.push(createOperation(15, '-', 5, 10));
        sequence.push(createOperation(10, '/', 2, 5));
        sequence.push(createOperation(5, 'x', 3, 15));
        sequence.push(createOperation(15, '+', 4, 19));
    } else {
        // For levels 7-10, include some fraction operations if appropriate
        sequence.push(createOperation(start, 'x', 3, 9));
        sequence.push(createOperation(9, '+', 5, 14));
        sequence.push(createOperation(14, '-', 4, 10));
        
        if (level >= 8) {
            // Add fraction for higher levels
            sequence.push(createOperation(10, 'x', {numerator: 1, denominator: 2, toDecimal: () => 0.5, toString: () => "1/2"}, 5));
            sequence.push(createOperation(5, 'x', 4, 20));
            sequence.push(createOperation(20, '/', 5, 4));
        } else {
            // Simpler operations for level 7
            sequence.push(createOperation(10, '/', 2, 5));
            sequence.push(createOperation(5, 'x', 4, 20));
            sequence.push(createOperation(20, '-', 5, 15));
        }
        
        sequence.push(createOperation(level >= 8 ? 4 : 15, '+', 7, level >= 8 ? 11 : 22));
        sequence.push(createOperation(level >= 8 ? 11 : 22, '-', 3, level >= 8 ? 8 : 19));
    }
    
    return sequence;
}

// Helper to create operation objects for the fallback sequence
function createOperation(num1, operator, num2, result) {
    return {
        num1,
        operator,
        num2,
        result,
        display: `${formatNumber(num1)} ${operator} ${formatNumber(num2)} = ${formatNumber(result)}`
    };
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
