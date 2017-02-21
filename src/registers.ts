import { Operand } from './instructions';

export enum Flag {
    Z, // Zero
    N, // Subtract
    H, // Half Carry
    C  // Carry
}

export class Registers {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number; // Flags
    h: number;
    l: number;

    sp: number;
    pc: number;


    get(op: Operand): number {
        switch (op) {
            case Operand.A:
                return this.a;
            case Operand.B:
                return this.b;
            case Operand.C:
                return this.c;
            case Operand.D:
                return this.d;
            case Operand.E:
                return this.e;
            case Operand.F:
                return this.f;
            case Operand.H:
                return this.h;
            case Operand.L:
                return this.l;
            case Operand.AF:
                return this.doubleRegisterValue(this.a, this.f);
            case Operand.BC:
                return this.doubleRegisterValue(this.b, this.c);
            case Operand.DE:
                return this.doubleRegisterValue(this.d, this.e);
            case Operand.HL:
                return this.doubleRegisterValue(this.h, this.l);
            case Operand.PC:
                return this.pc;
            case Operand.SP:
                return this.sp;

            default:
                return 0;
        }
    }

    /**
     * Gameboy has virtual 16-bit registers, that consist of two 8 bit ones.
     * @param {number} reg1 Value of left register
     * @param {number} reg2 Value of right register
     * @return {number} Combined register value
     */
    private doubleRegisterValue(reg1: number, reg2: number): number {
        return reg1 * 256 + reg2;
    }

    get flagZ(): boolean {
        return (this.f & 0x80) > 0;
    }
    get flagN(): boolean {
        return (this.f & 0x40) > 0;
    }
    get flagH(): boolean {
        return (this.f & 0x20) > 0;
    }
    get flagC(): boolean {
        return (this.f & 0x10) > 0;
    }
    set flagZ(val: boolean) {
        this.f = (this.f & 0x7F) | (val ? 0x80 : 0x00);
    }
    set flagN(val: boolean) {
        this.f = (this.f & 0xBF) | (val ? 0x40 : 0x00);
    }
    set flagH(val: boolean) {
        this.f = (this.f & 0xDF) | (val ? 0x20 : 0x00);
    }
    set flagC(val: boolean) {
        this.f = (this.f & 0xEF) | (val ? 0x10 : 0x00);
    }



}