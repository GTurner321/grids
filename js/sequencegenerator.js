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

function generateFraction(maxDenominator = 12, unitFractionOnly = false, preferNonUnit = false) {
    // If we prefer non-unit fractions and not forced to use unit fractions
    if (preferNonUnit && !unitFractionOnly && Math.random() < 0.75) {
        const denominator = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
        // Ensure numerator isn't 1 (not a unit fraction)
        let numerator;
        do {
            numerator = Math.floor(Math.random() * (denominator - 1)) + 1;
        } while (numerator === 1);
        
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
   
   // Special handling for level 10 - force multiplication/division with fractions
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
      (operator === 'x') && Math.random() < 0.6) {
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

function generateNextSum(startNum, level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    let attempts = 0;
    while (attempts < 100) {
        // Pass the level along with the config
        const { operator, num2 } = selectOperatorAndNum2(startNum, level, config);
        
        // Skip if both are fractions
        if (startNum instanceof Object && num2 instanceof Object) {
            attempts++;
            continue;
        }
        
        // Skip if division by a fraction is not allowed for this level
        if ((level === 6 || level === 7) && operator === '/' && num2 instanceof Object && config.disallowFractionDivision) {
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

export function generateSequence(level) {
    const config = LEVEL_CONFIG[level];
    if (!config) throw new Error(`Invalid level: ${level}`);

    let sequence = [];
    // Start with a smaller number for easier first calculations
    let currentNum = Math.floor(Math.random() * 16) + 1;
    
    // For level 5-10, occasionally start with a larger number
    if (level >= 5 && Math.random() < 0.3) {
        currentNum = Math.floor(Math.random() * 30) + 10;
    }
    
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
