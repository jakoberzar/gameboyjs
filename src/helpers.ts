/**
 * Returns the number in hexadecimal representation, without 0x
 * @param {number} x The number to display in hex
 * @return {string} number in hex, without 0x
 */
export function niceByteHexa(x: number): string {
    let s = '00' + x.toString(16);
    return s.substr(s.length - 2).toUpperCase();
}