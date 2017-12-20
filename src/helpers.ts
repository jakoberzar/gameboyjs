/**
 * Returns the number in hexadecimal representation, without 0x
 * @param {number} x The number to display in hex
 * @return {string} number in hex, without 0x
 */
export function niceByteHexa(x: number): string {
    let s = '00' + x.toString(16);
    return s.substr(s.length - 2).toUpperCase();
}

/**
 * Gets the bit in the number at given index
 * @param {number} n The whole number
 * @param {number} index Index of the bit, from right to left. 0 = least significant
 */
export function getBit(n: number, index: number): number {
    const mask: number = 1 << index;
    return (n & mask) >> index;
}

/**
 * Gets the bits in the number at given index
 * @param {number} n The whole number
 * @param {number} index Index of the bit, from right to left. 0 = least significant
 * @param {number} bits Amount of bits to modify
 */
export function getBits(n: number, index: number, bits: number = 1): number {
    const bitMask = Math.pow(2, bits) - 1;
    const mask: number = bitMask << index;
    return (n & mask) >> index;
}

/**
 * Modifies bit at index in number n
 * @param {number} n The whole number
 * @param {number} index Index of the bit, from right to left. 0 = least significant
 * @param {number} value New value of the bit
 */
export function modifyBit(n: number, index: number, value: number): number {
    const mask: number = 1 << index;
    return (n & ~mask) | value << index;
}

/**
 * Modifies bits at index in number n
 * @param {number} n The whole number
 * @param {number} index Index of the rightmost bit, from right to left. 0 = least significant
 * @param {number} value New value of the bits
 * @param {number} bits Amount of bits to modify
 */
export function modifyBits(n: number, index: number, value: number, bits: number = 1) {
    const bitMask = Math.pow(2, bits) - 1;
    const mask: number = bitMask << index;
    return (n & ~mask) | ((value << index) & mask);
}

/**
 * Converts a number to byte array, little endian
 * NOT YET IMPLEMENTED
 * @param {number} n The number to convert
 */
export function valueToByteArray(n: number): number[] {
    console.log('valueToByteArray not yet implemented!');
    return [n];
}