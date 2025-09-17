/**
 * Type definitions for decimal.js
 */

declare module 'decimal.js' {
  export default class Decimal {
    constructor(value: number | string | Decimal);
    
    // Core functions
    abs(): Decimal;
    add(n: number | string | Decimal): Decimal;
    div(n: number | string | Decimal): Decimal;
    divToInt(n: number | string | Decimal): Decimal;
    floor(): Decimal;
    ceil(): Decimal;
    round(): Decimal;
    mul(n: number | string | Decimal): Decimal;
    neg(): Decimal;
    pow(n: number | string | Decimal): Decimal;
    sqrt(): Decimal;
    sub(n: number | string | Decimal): Decimal;
    
    // Comparison functions
    eq(n: number | string | Decimal): boolean;
    gt(n: number | string | Decimal): boolean;
    gte(n: number | string | Decimal): boolean;
    lt(n: number | string | Decimal): boolean;
    lte(n: number | string | Decimal): boolean;
    
    // Conversion functions
    toDecimalPlaces(dp: number, rm?: number): Decimal;
    toDP(dp: number, rm?: number): Decimal;
    toExponential(dp?: number, rm?: number): string;
    toFixed(dp?: number, rm?: number): string;
    toFraction(max_denominator?: number | Decimal): [Decimal, Decimal];
    toNumber(): number;
    toPrecision(sd?: number, rm?: number): string;
    toString(): string;
    valueOf(): string;
    
    // Static methods and properties
    static abs(n: number | string | Decimal): Decimal;
    static max(...n: Array<number | string | Decimal>): Decimal;
    static min(...n: Array<number | string | Decimal>): Decimal;
    static sum(...n: Array<number | string | Decimal>): Decimal;
    static ROUND_UP: number;
    static ROUND_DOWN: number;
    static ROUND_CEIL: number;
    static ROUND_FLOOR: number;
    static ROUND_HALF_UP: number;
    static ROUND_HALF_DOWN: number;
    static ROUND_HALF_EVEN: number;
    static ROUND_HALF_CEIL: number;
    static ROUND_HALF_FLOOR: number;
  }
}
