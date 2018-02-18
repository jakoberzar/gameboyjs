import { niceByteHexa } from './helpers';
import { RomInstruction } from './rom';

export interface Instruction {
    op: Opcode;
    byteLength: number;
    cycles: number;
    operands: Operand[];
}

export enum Operand {
    A, B, C, D, E, F, H, L,           // 8-bit registers
    AF, BC, DE, HL,                   // 16-bit registers
    SP, PC,                           // Special registers
    d8, d16, a16, r8,                 // d = data (immediate), a = address, r = signed
    FlagZ, FlagNZ, FlagC, FlagNC,     // For use with jumps
    BCP, DEP, HLP, CP, a16P, a8P,     // Pointer registers and values
    val0 = 100, val1 = 101, val2 = 102, val3 = 103,
    val4 = 104, val5 = 105, val6 = 106, val7 = 107,
    H00 = 200 + 0x00, H10 = 200 + 0x10, H20 = 200 + 0x20, H30 = 200 + 0x30,
    H08 = 200 + 0x08, H18 = 200 + 0x18, H28 = 200 + 0x28, H38 = 200 + 0x38,
}

/** Basic instructions */
export enum Opcode {
    NOP, STOP, HALT, PrefixCB, DI, EI,
    LD, LDH, LDI, LDD, LDHL,
    INC, DEC,
    RLCA, RRCA, RLA, RRA,
    ADD, ADC, SUB, SBC,
    AND, XOR, OR, CP,
    JR, RET, JP, CALL, RST, RETI,
    DAA, CPL, SCF, CCF,
    POP, PUSH,
    EMTY,
    // CB instructions
    RLC, RRC, RL, RR, SLA, SRA, SWAP, SRL,
    BIT, RES, SET,
}

/** Instruction set, from http://pastraiser.com/cpu/gameboy/gameboy_opcodes.html */
export const basicInstructionSet: Instruction[] = [
    // 0x00
    { op: Opcode.NOP,  byteLength: 1, cycles: 4,  operands: []},
    { op: Opcode.LD,   byteLength: 3, cycles: 12, operands: [Operand.BC, Operand.d16]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8,  operands: [Operand.BCP, Operand.A]},
    { op: Opcode.INC,  byteLength: 1, cycles: 8,  operands: [Operand.BC]},
    { op: Opcode.INC,  byteLength: 1, cycles: 4,  operands: [Operand.B]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 4,  operands: [Operand.B]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.B, Operand.d8]},
    { op: Opcode.RLCA, byteLength: 1, cycles: 4,  operands: []},
    // 0x08
    { op: Opcode.LD,   byteLength: 3, cycles: 20,  operands: [Operand.a16P, Operand.SP]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 8,  operands: [Operand.HL, Operand.BC]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8,  operands: [Operand.A, Operand.BCP]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 8,  operands: [Operand.BC]},
    { op: Opcode.INC,  byteLength: 1, cycles: 4,  operands: [Operand.C]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 4,  operands: [Operand.C]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.C, Operand.d8]},
    { op: Opcode.RRCA, byteLength: 1, cycles: 4,  operands: []},

    // 0x10
    { op: Opcode.STOP, byteLength: 1, cycles: 4,  operands: []}, // Manuals say it's 2 bytes, but actually usually 1.
    { op: Opcode.LD,   byteLength: 3, cycles: 12, operands: [Operand.DE, Operand.d16]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8,  operands: [Operand.DEP, Operand.A]},
    { op: Opcode.INC,  byteLength: 1, cycles: 8,  operands: [Operand.DE]},
    { op: Opcode.INC,  byteLength: 1, cycles: 4,  operands: [Operand.D]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 4,  operands: [Operand.D]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.D, Operand.d8]},
    { op: Opcode.RLA,  byteLength: 1, cycles: 4,  operands: []},
    // 0x18
    { op: Opcode.JR,   byteLength: 2, cycles: 12, operands: [Operand.r8]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 8,  operands: [Operand.HL, Operand.DE]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8,  operands: [Operand.A, Operand.DEP]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 8,  operands: [Operand.DE]},
    { op: Opcode.INC,  byteLength: 1, cycles: 4,  operands: [Operand.E]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 4,  operands: [Operand.E]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.E, Operand.d8]},
    { op: Opcode.RRA,  byteLength: 1, cycles: 4,  operands: []},

    // 0x20
    { op: Opcode.JR,   byteLength: 2, cycles: 8,  operands: [Operand.FlagNZ, Operand.r8]},
    { op: Opcode.LD,   byteLength: 3, cycles: 12, operands: [Operand.HL, Operand.d16]},
    { op: Opcode.LDI,  byteLength: 1, cycles: 8,  operands: [Operand.HLP, Operand.A]},
    { op: Opcode.INC,  byteLength: 1, cycles: 8,  operands: [Operand.HL]},
    { op: Opcode.INC,  byteLength: 1, cycles: 4,  operands: [Operand.H]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 4,  operands: [Operand.H]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.H, Operand.d8]},
    { op: Opcode.DAA,  byteLength: 1, cycles: 4,  operands: []},
    // 0x28
    { op: Opcode.JR,   byteLength: 2, cycles: 12, operands: [Operand.FlagZ, Operand.r8]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 8,  operands: [Operand.HL, Operand.HL]},
    { op: Opcode.LDI,  byteLength: 1, cycles: 8,  operands: [Operand.A, Operand.HLP]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 8,  operands: [Operand.HL]},
    { op: Opcode.INC,  byteLength: 1, cycles: 4,  operands: [Operand.L]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 4,  operands: [Operand.L]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.L, Operand.d8]},
    { op: Opcode.CPL,  byteLength: 1, cycles: 4,  operands: []},

    // 0x30
    { op: Opcode.JR,   byteLength: 2, cycles: 8,  operands: [Operand.FlagNC, Operand.r8]},
    { op: Opcode.LD,   byteLength: 3, cycles: 12, operands: [Operand.SP, Operand.d16]},
    { op: Opcode.LDD,  byteLength: 1, cycles: 8,  operands: [Operand.HLP, Operand.A]},
    { op: Opcode.INC,  byteLength: 1, cycles: 8,  operands: [Operand.SP]},
    { op: Opcode.INC,  byteLength: 1, cycles: 12, operands: [Operand.HLP]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 12, operands: [Operand.HLP]},
    { op: Opcode.LD,   byteLength: 2, cycles: 12, operands: [Operand.HLP, Operand.d8]},
    { op: Opcode.SCF,  byteLength: 1, cycles: 4,  operands: []},
    // 0x38
    { op: Opcode.JR,   byteLength: 2, cycles: 12, operands: [Operand.FlagC, Operand.r8]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 8,  operands: [Operand.HL, Operand.SP]},
    { op: Opcode.LDD,  byteLength: 1, cycles: 8,  operands: [Operand.A, Operand.HLP]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 8,  operands: [Operand.SP]},
    { op: Opcode.INC,  byteLength: 1, cycles: 4,  operands: [Operand.A]},
    { op: Opcode.DEC,  byteLength: 1, cycles: 4,  operands: [Operand.A]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.A, Operand.d8]},
    { op: Opcode.CCF,  byteLength: 1, cycles: 4,  operands: []},

    // 0x40
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.B, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.B, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.B, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.B, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.B, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.B, Operand.L]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.B, Operand.HLP]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.B, Operand.A]},
    // 0x48
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.C, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.C, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.C, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.C, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.C, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.C, Operand.L]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.C, Operand.HLP]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.C, Operand.A]},

    // 0x50
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.D, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.D, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.D, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.D, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.D, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.D, Operand.L]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.D, Operand.HLP]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.D, Operand.A]},
    // 0x58
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.E, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.E, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.E, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.E, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.E, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.E, Operand.L]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.E, Operand.HLP]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.E, Operand.A]},

    // 0x60
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.H, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.H, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.H, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.H, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.H, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.H, Operand.L]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.H, Operand.HLP]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.H, Operand.A]},
    // 0x68
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.L, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.L, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.L, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.L, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.L, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.L, Operand.L]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.L, Operand.HLP]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.L, Operand.A]},

    // 0x70
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.HLP, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.HLP, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.HLP, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.HLP, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.HLP, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.HLP, Operand.L]},
    { op: Opcode.HALT, byteLength: 1, cycles: 4, operands: []},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.HLP, Operand.A]},
    // 0x78
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.A, Operand.B]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.A, Operand.C]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.A, Operand.D]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.A, Operand.E]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.A, Operand.H]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.A, Operand.L]},
    { op: Opcode.LD,   byteLength: 1, cycles: 8, operands: [Operand.A, Operand.HLP]},
    { op: Opcode.LD,   byteLength: 1, cycles: 4, operands: [Operand.A, Operand.A]},

    // 0x80
    { op: Opcode.ADD,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.B]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.C]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.D]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.E]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.H]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.L]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 8, operands: [Operand.A, Operand.HLP]},
    { op: Opcode.ADD,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.A]},
    // 0x88
    { op: Opcode.ADC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.B]},
    { op: Opcode.ADC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.C]},
    { op: Opcode.ADC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.D]},
    { op: Opcode.ADC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.E]},
    { op: Opcode.ADC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.H]},
    { op: Opcode.ADC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.L]},
    { op: Opcode.ADC,  byteLength: 1, cycles: 8, operands: [Operand.A, Operand.HLP]},
    { op: Opcode.ADC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.A]},

    // 0x90
    { op: Opcode.SUB,  byteLength: 1, cycles: 4, operands: [Operand.B]},
    { op: Opcode.SUB,  byteLength: 1, cycles: 4, operands: [Operand.C]},
    { op: Opcode.SUB,  byteLength: 1, cycles: 4, operands: [Operand.D]},
    { op: Opcode.SUB,  byteLength: 1, cycles: 4, operands: [Operand.E]},
    { op: Opcode.SUB,  byteLength: 1, cycles: 4, operands: [Operand.H]},
    { op: Opcode.SUB,  byteLength: 1, cycles: 4, operands: [Operand.L]},
    { op: Opcode.SUB,  byteLength: 1, cycles: 8, operands: [Operand.HLP]},
    { op: Opcode.SUB,  byteLength: 1, cycles: 4, operands: [Operand.A]},
    // 0x98
    { op: Opcode.SBC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.B]},
    { op: Opcode.SBC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.C]},
    { op: Opcode.SBC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.D]},
    { op: Opcode.SBC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.E]},
    { op: Opcode.SBC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.H]},
    { op: Opcode.SBC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.L]},
    { op: Opcode.SBC,  byteLength: 1, cycles: 8, operands: [Operand.A, Operand.HLP]},
    { op: Opcode.SBC,  byteLength: 1, cycles: 4, operands: [Operand.A, Operand.A]},

    // 0xA0
    { op: Opcode.AND,  byteLength: 1, cycles: 4, operands: [Operand.B]},
    { op: Opcode.AND,  byteLength: 1, cycles: 4, operands: [Operand.C]},
    { op: Opcode.AND,  byteLength: 1, cycles: 4, operands: [Operand.D]},
    { op: Opcode.AND,  byteLength: 1, cycles: 4, operands: [Operand.E]},
    { op: Opcode.AND,  byteLength: 1, cycles: 4, operands: [Operand.H]},
    { op: Opcode.AND,  byteLength: 1, cycles: 4, operands: [Operand.L]},
    { op: Opcode.AND,  byteLength: 1, cycles: 8, operands: [Operand.HLP]},
    { op: Opcode.AND,  byteLength: 1, cycles: 4, operands: [Operand.A]},
    // 0xA8
    { op: Opcode.XOR,  byteLength: 1, cycles: 4, operands: [Operand.B]},
    { op: Opcode.XOR,  byteLength: 1, cycles: 4, operands: [Operand.C]},
    { op: Opcode.XOR,  byteLength: 1, cycles: 4, operands: [Operand.D]},
    { op: Opcode.XOR,  byteLength: 1, cycles: 4, operands: [Operand.E]},
    { op: Opcode.XOR,  byteLength: 1, cycles: 4, operands: [Operand.H]},
    { op: Opcode.XOR,  byteLength: 1, cycles: 4, operands: [Operand.L]},
    { op: Opcode.XOR,  byteLength: 1, cycles: 8, operands: [Operand.HLP]},
    { op: Opcode.XOR,  byteLength: 1, cycles: 4, operands: [Operand.A]},

    // 0xB0
    { op: Opcode.OR,   byteLength: 1, cycles: 4, operands: [Operand.B]},
    { op: Opcode.OR,   byteLength: 1, cycles: 4, operands: [Operand.C]},
    { op: Opcode.OR,   byteLength: 1, cycles: 4, operands: [Operand.D]},
    { op: Opcode.OR,   byteLength: 1, cycles: 4, operands: [Operand.E]},
    { op: Opcode.OR,   byteLength: 1, cycles: 4, operands: [Operand.H]},
    { op: Opcode.OR,   byteLength: 1, cycles: 4, operands: [Operand.L]},
    { op: Opcode.OR,   byteLength: 1, cycles: 8, operands: [Operand.HLP]},
    { op: Opcode.OR,   byteLength: 1, cycles: 4, operands: [Operand.A]},
    // 0xB8
    { op: Opcode.CP,   byteLength: 1, cycles: 4, operands: [Operand.B]},
    { op: Opcode.CP,   byteLength: 1, cycles: 4, operands: [Operand.C]},
    { op: Opcode.CP,   byteLength: 1, cycles: 4, operands: [Operand.D]},
    { op: Opcode.CP,   byteLength: 1, cycles: 4, operands: [Operand.E]},
    { op: Opcode.CP,   byteLength: 1, cycles: 4, operands: [Operand.H]},
    { op: Opcode.CP,   byteLength: 1, cycles: 4, operands: [Operand.L]},
    { op: Opcode.CP,   byteLength: 1, cycles: 8, operands: [Operand.HLP]},
    { op: Opcode.CP,   byteLength: 1, cycles: 4, operands: [Operand.A]},

    // 0xC0
    { op: Opcode.RET,  byteLength: 1, cycles: 20, operands: [Operand.FlagNZ]},
    { op: Opcode.POP,  byteLength: 1, cycles: 12, operands: [Operand.BC]},
    { op: Opcode.JP,   byteLength: 3, cycles: 16, operands: [Operand.FlagNZ, Operand.a16]},
    { op: Opcode.JP,   byteLength: 3, cycles: 16, operands: [Operand.a16]},
    { op: Opcode.CALL, byteLength: 3, cycles: 24, operands: [Operand.FlagNZ, Operand.a16]},
    { op: Opcode.PUSH, byteLength: 1, cycles: 16, operands: [Operand.BC]},
    { op: Opcode.ADD,  byteLength: 2, cycles: 8,  operands: [Operand.A, Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H00]},
    // 0xC8
    { op: Opcode.RET,  byteLength: 1, cycles: 20, operands: [Operand.FlagZ]},
    { op: Opcode.RET,  byteLength: 1, cycles: 16, operands: []},
    { op: Opcode.JP,   byteLength: 3, cycles: 16, operands: [Operand.FlagZ, Operand.a16]},
    { op: Opcode.PrefixCB, byteLength: 1, cycles: 0, operands: []},
    { op: Opcode.CALL, byteLength: 3, cycles: 24, operands: [Operand.FlagZ, Operand.a16]},
    { op: Opcode.CALL, byteLength: 3, cycles: 24, operands: [Operand.a16]},
    { op: Opcode.ADC,  byteLength: 2, cycles: 8,  operands: [Operand.A, Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H08]},

    // 0xD0
    { op: Opcode.RET,  byteLength: 1, cycles: 20, operands: [Operand.FlagNC]},
    { op: Opcode.POP,  byteLength: 1, cycles: 12, operands: [Operand.DE]},
    { op: Opcode.JP,   byteLength: 3, cycles: 16, operands: [Operand.FlagNC, Operand.a16]},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.CALL, byteLength: 3, cycles: 24, operands: [Operand.FlagNC, Operand.a16]},
    { op: Opcode.PUSH, byteLength: 1, cycles: 16, operands: [Operand.DE]},
    { op: Opcode.SUB,  byteLength: 2, cycles: 8,  operands: [Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H10]},
    // 0xD8
    { op: Opcode.RET,  byteLength: 1, cycles: 20, operands: [Operand.FlagC]},
    { op: Opcode.RETI, byteLength: 1, cycles: 16, operands: []},
    { op: Opcode.JP,   byteLength: 2, cycles: 16, operands: [Operand.FlagC, Operand.a16]},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.CALL, byteLength: 3, cycles: 24, operands: [Operand.FlagC, Operand.a16]},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.SBC,  byteLength: 2, cycles: 8,  operands: [Operand.A, Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H18]},

    // 0xE0
    { op: Opcode.LDH,  byteLength: 2, cycles: 12, operands: [Operand.a8P, Operand.A]},
    { op: Opcode.POP,  byteLength: 1, cycles: 12, operands: [Operand.HL]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.CP, Operand.A]},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.PUSH, byteLength: 1, cycles: 16, operands: [Operand.HL]},
    { op: Opcode.AND,  byteLength: 2, cycles: 8,  operands: [Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H20]},
    // 0xE8
    { op: Opcode.ADD,  byteLength: 2, cycles: 16, operands: [Operand.SP, Operand.r8]},
    { op: Opcode.JP,   byteLength: 1, cycles: 4,  operands: [Operand.HLP]},
    { op: Opcode.LD,   byteLength: 3, cycles: 16, operands: [Operand.a16P, Operand.A]},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.XOR,  byteLength: 2, cycles: 8,  operands: [Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H28]},

    // 0xF0
    { op: Opcode.LDH,  byteLength: 2, cycles: 12, operands: [Operand.A, Operand.a8P]},
    { op: Opcode.POP,  byteLength: 1, cycles: 12, operands: [Operand.AF]},
    { op: Opcode.LD,   byteLength: 2, cycles: 8,  operands: [Operand.A, Operand.CP]},
    { op: Opcode.DI,   byteLength: 1, cycles: 4,  operands: []},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.PUSH, byteLength: 1, cycles: 16, operands: [Operand.AF]},
    { op: Opcode.OR,   byteLength: 2, cycles: 8,  operands: [Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H30]},
    // 0xF8
    { op: Opcode.LDHL,   byteLength: 2, cycles: 12, operands: [Operand.SP, Operand.r8]},
    { op: Opcode.JP,   byteLength: 1, cycles: 8,  operands: [Operand.SP, Operand.HL]},
    { op: Opcode.LD,   byteLength: 3, cycles: 16, operands: [Operand.A, Operand.a16P]},
    { op: Opcode.EI,   byteLength: 1, cycles: 4,  operands: []},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.EMTY, byteLength: 1, cycles: 0,  operands: []},
    { op: Opcode.CP,   byteLength: 2, cycles: 8,  operands: [Operand.d8]},
    { op: Opcode.RST,  byteLength: 1, cycles: 16, operands: [Operand.H38]},
];

export const cbInstructionSet: Instruction[] = [
    // 0x00
    { op: Opcode.RLC,  byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.RLC,  byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.RLC,  byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.RLC,  byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.RLC,  byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.RLC,  byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.RLC,  byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.RLC,  byteLength: 2, cycles: 8, operands: [Operand.A]},
    // 0x08
    { op: Opcode.RRC,  byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.RRC,  byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.RRC,  byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.RRC,  byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.RRC,  byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.RRC,  byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.RRC,  byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.RRC,  byteLength: 2, cycles: 8, operands: [Operand.A]},
    // 0x10
    { op: Opcode.RL,   byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.RL,   byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.RL,   byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.RL,   byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.RL,   byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.RL,   byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.RL,   byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.RL,   byteLength: 2, cycles: 8, operands: [Operand.A]},
    // 0x18
    { op: Opcode.RR,   byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.RR,   byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.RR,   byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.RR,   byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.RR,   byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.RR,   byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.RR,   byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.RR,   byteLength: 2, cycles: 8, operands: [Operand.A]},
    // 0x20
    { op: Opcode.SLA,  byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.SLA,  byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.SLA,  byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.SLA,  byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.SLA,  byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.SLA,  byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.SLA,  byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.SLA,  byteLength: 2, cycles: 8, operands: [Operand.A]},
    // 0x28
    { op: Opcode.SRA,  byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.SRA,  byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.SRA,  byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.SRA,  byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.SRA,  byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.SRA,  byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.SRA,  byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.SRA,  byteLength: 2, cycles: 8, operands: [Operand.A]},
    // 0x30
    { op: Opcode.SWAP, byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.SWAP, byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.SWAP, byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.SWAP, byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.SWAP, byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.SWAP, byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.SWAP, byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.SWAP, byteLength: 2, cycles: 8, operands: [Operand.A]},
    // 0x38
    { op: Opcode.SRL,  byteLength: 2, cycles: 8, operands: [Operand.B]},
    { op: Opcode.SRL,  byteLength: 2, cycles: 8, operands: [Operand.C]},
    { op: Opcode.SRL,  byteLength: 2, cycles: 8, operands: [Operand.D]},
    { op: Opcode.SRL,  byteLength: 2, cycles: 8, operands: [Operand.E]},
    { op: Opcode.SRL,  byteLength: 2, cycles: 8, operands: [Operand.H]},
    { op: Opcode.SRL,  byteLength: 2, cycles: 8, operands: [Operand.L]},
    { op: Opcode.SRL,  byteLength: 2, cycles: 16, operands: [Operand.HLP]},
    { op: Opcode.SRL,  byteLength: 2, cycles: 8, operands: [Operand.A]},

    // 0x40
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val0, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.A]},
    // 0x48
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val1, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.A]},
    // 0x50
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val2, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.A]},
    // 0x58
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val3, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.A]},
    // 0x60
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val4, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.A]},
    // 0x68
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val5, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.A]},
    // 0x70
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val6, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.A]},
    // 0x78
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.B]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.C]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.D]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.E]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.H]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.L]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 16, operands: [Operand.val7, Operand.HLP]},
    { op: Opcode.BIT,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.A]},

    // 0x80
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val0, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.A]},
    // 0x88
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val1, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.A]},
    // 0x90
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val2, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.A]},
    // 0x98
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val3, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.A]},
    // 0xA0
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val4, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.A]},
    // 0xA8
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val5, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.A]},
    // 0xB0
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val6, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.A]},
    // 0xB8
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.B]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.C]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.D]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.E]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.H]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.L]},
    { op: Opcode.RES,  byteLength: 2, cycles: 16, operands: [Operand.val7, Operand.HLP]},
    { op: Opcode.RES,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.A]},

    // 0xC0
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val0, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val0, Operand.A]},
    // 0xC8
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val1, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val1, Operand.A]},
    // 0xD0
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val2, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val2, Operand.A]},
    // 0xD8
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val3, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val3, Operand.A]},
    // 0xE0
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val4, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val4, Operand.A]},
    // 0xE8
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val5, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val5, Operand.A]},
    // 0xF0
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val6, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val6, Operand.A]},
    // 0xF8
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.B]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.C]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.D]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.E]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.H]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.L]},
    { op: Opcode.SET,  byteLength: 2, cycles: 16, operands: [Operand.val7, Operand.HLP]},
    { op: Opcode.SET,  byteLength: 2, cycles: 8, operands: [Operand.val7, Operand.A]},
];

/**
 * Decodes the bytes and returns the appropriate instruction
 * @param {number[]} bytes Bytes from the rom instructions
 * @return {instruction} Decoded instruction
 */
export function bytesToInstruction(bytes: number[]): Instruction {
    if (bytes.length < 2) throw 'Not enough bytes given, always give at least 2!';
    // Return CB instruction if first byte is CB, else basic one.
    return bytes[0] !== 0xCB ? basicInstructionSet[bytes[0]] : cbInstructionSet[bytes[1]];
}

/**
 * Returns the bytes that this instruction encodes to. Isn't especially fast probably.
 * @param {instruction} i The instruction to encode
 * @return {number[]} Bytes that this instruction represents
 */
export function instructionToBytes(i: Instruction): number[] {
    const isCB: boolean = i.op > Opcode.RLC;
    const searchArr = !isCB ? basicInstructionSet : cbInstructionSet;
    const ind = searchArr.indexOf(i);
    if (ind === -1) throw 'Instruction not found. Maybe it wasn\'t instantiated from bytesToInstruction?';
    return !isCB ? [ind] : [0xCB, ind];
}

/**
 * Returns the string form of the operation
 * @param instruction
 */
export function instructionToString(instruction: Instruction): string {
    return Opcode[instruction.op];
}

/** Returns a nice string representation of the instruction */
export function romInstructionToString(romInstruction: RomInstruction): string {
    // return '';
    const opcode = instructionToString(romInstruction.instruction);

    const opcodeByteString: string = instructionToBytes(romInstruction.instruction)
        .map((x) => niceByteHexa(x))
        .join(' ');

    const operandByteString: string = romInstruction.operandBytes
        .map((x) => niceByteHexa(x))
        .join(' ');
    const operandBytesPadded = operandByteString + '         '.substring(0, 9 - operandByteString.length);

    const operandString: string = romInstruction.instruction.operands
        .map((x) => Operand[x])
        .join(', ');

    return opcodeByteString + ' ' + operandBytesPadded + ' -> ' + opcode + ' ' + operandString;
}

export class ReadableInstruction {
    bytes: number[];
    bytesSet = false;
    constructor(private i: Instruction, bytes?: number[]) {
        if (bytes !== undefined) {
            // Slice the array if too many bytes are given.
            this.bytes = bytes.slice(0, i.byteLength);
            this.bytesSet = true;
        }
    }

    /** Returns the string form of the operation */
    toStringOP(): string {
        return Opcode[this.i.op];
    }
    /** Returns a nice string representation of the instruction */
    toString(): string {
        const b: number[] = this.bytesSet ? this.bytes : instructionToBytes(this.i);
        const bStr: string = b.map((x) => niceByteHexa(x)).join(' ');
        return `${this.toStringOP()} - ${bStr}`;
    }
}