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
export function getBit(n: number, index: number): boolean {
    const mask: number = 1 << index;
    return (n & mask) > 0;
}

/**
 * Modifies bit at index in number n
 * @param {number} n The whole number
 * @param {number} index Index of the bit, from right to left. 0 = least significant
 * @param {boolean} value New value of the bit
 */
export function modifyBit(n: number, index: number, value: boolean): number {
    const mask: number = 1 << index;
    const newBitValue = value ? mask : 0;
    return (n & ~mask) | newBitValue;
}