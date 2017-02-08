export function niceHexa(x: number): string {
    var s = "00" + x.toString(16);
    return s.substr(s.length - 2).toUpperCase();
}