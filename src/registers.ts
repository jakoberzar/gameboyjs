import { getBit, modifyBit } from './helpers';
import { Operand } from './instructions';

export enum Flag {
    Z, // Zero
    N, // Subtract
    H, // Half Carry
    C, // Carry
}

export class Registers {
    // Initialize registers with random values for now,
    // so the instructions results are more interesting.
    a: number = 1;
    b: number = 2;
    c: number = 3;
    d: number = 4;
    e: number = 5;
    f: number = 6; // Flags
    h: number = 7;
    l: number = 8;

    sp: number = 0x400;
    pc: number = 0;

    // FLAGS
    get flagZ(): boolean {
        return getBit(this.f, 7) === 1;
    }
    set flagZ(val: boolean) {
        this.f = modifyBit(this.f, 7, val ? 1 : 0);
    }
    get flagN(): boolean {
        return getBit(this.f, 6) === 1;
    }
    set flagN(val: boolean) {
        this.f = modifyBit(this.f, 6, val ? 1 : 0);
    }
    get flagH(): boolean {
        return getBit(this.f, 5) === 1;
    }
    set flagH(val: boolean) {
        this.f = modifyBit(this.f, 5, val ? 1 : 0);
    }
    get flagC(): boolean {
        return getBit(this.f, 4) === 1;
    }
    set flagC(val: boolean) {
        this.f = modifyBit(this.f, 4, val ? 1 : 0);
    }

    /**
     * Gets the value of register for the specified operand
     * @param {Operand} op The register to get
     */
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
                return this.getDoubleRegister(this.a, this.f);
            case Operand.BC:
                return this.getDoubleRegister(this.b, this.c);
            case Operand.DE:
                return this.getDoubleRegister(this.d, this.e);
            case Operand.HL:
                return this.getDoubleRegister(this.h, this.l);
            case Operand.PC:
                return this.pc;
            case Operand.SP:
                return this.sp;

            default:
                return 0;
        }
    }

    /**
     * Sets the value of register of specified operand to specified value
     * @param {Operand} op Operand to get
     * @param {number} value Value to set
     */
    set(op: Operand, value: number) {
       switch (op) {
            case Operand.A:
                this.a = value;
                break;
            case Operand.B:
                this.b = value;
                break;
            case Operand.C:
                this.c = value;
                break;
            case Operand.D:
                this.d = value;
                break;
            case Operand.E:
                this.e = value;
                break;
            case Operand.F:
                this.f = value;
                break;
            case Operand.H:
                this.h = value;
                break;
            case Operand.L:
                this.l = value;
                break;
            case Operand.AF:
                this.setDoubleRegister(Operand.A, Operand.F, value);
                break;
            case Operand.BC:
                this.setDoubleRegister(Operand.B, Operand.C, value);
                break;
            case Operand.DE:
                this.setDoubleRegister(Operand.D, Operand.E, value);
                break;
            case Operand.HL:
                this.setDoubleRegister(Operand.H, Operand.L, value);
                break;
            case Operand.PC:
                this.pc = value;
                break;
            case Operand.SP:
                this.sp = value;
                break;

            default:
                // throw 'Trying to set an unknown operand!';
                // console.log('Trying to set an unknown operand!');
        }
    }

    /**
     * Increases the value of a register
     * @param {Operand} op Operand to modify
     * @param {number} bytes Number to add
     */
    increase(op: Operand, bytes: number = 1) {
        this.set(op, this.get(op) + bytes);
    }

    increasePC(bytes: number) {
        this.pc += bytes;
    }

    /**
     * Gameboy has virtual 16-bit registers, that consist of two 8 bit ones.
     * @param {number} reg1 Value of left register
     * @param {number} reg2 Value of right register
     * @return {number} Combined register value
     */
    private getDoubleRegister(reg1: number, reg2: number): number {
        return (reg1 << 8) + reg2;
    }

    /**
     * Gameboy has virtual 16-bit registers, that consist of two 8 bit ones.
     * @param {Operand} op1 Register of the most significant 8 bits
     * @param {Operand} op2 Register of the least significant 8 bits
     * @param {number} value 16-bit value to be inserted
     */
    private setDoubleRegister(op1: Operand, op2: Operand, value: number) {
        const valReg1 = value & 0b1111111100000000;
        const valReg2 = value & 0b0000000011111111;
        this.set(op1, valReg1 >> 8);
        this.set(op2, valReg2);
    }
}