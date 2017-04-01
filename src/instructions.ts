import { niceByteHexa } from './helpers';

export interface Instruction {
    op: BasicIns;
    byteLength: number;
    operands: Operand[];
}

export enum Operand {
    A, B, C, D, E, F, H, L,
    AF, BC, DE, HL,
    SP, PC,
    d8, d16, a8, a16, r8,
    NZ, HLPlus, Z, NC, HLMinus,
    SPPlusR8,
    val0 = 100, val1 = 101, val2 = 102, val3 = 103,
    val4 = 104, val5 = 105, val6 = 106, val7 = 107,
    H00 = 200, H10 = 210, H20 = 220, H30 = 230,
    H08 = 208, H18 = 218, H28 = 228, H38 = 238,
}

/** Basic instructions */
export enum BasicIns {
    NOP, STOP, HALT, PrefixCB, DI, EI,
    LD, LDH,
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
    { op: BasicIns.NOP,  byteLength: 1, operands: []},
    { op: BasicIns.LD,   byteLength: 3, operands: [Operand.BC, Operand.d16]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.BC, Operand.A]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.BC]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.B]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.B]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.B, Operand.d8]},
    { op: BasicIns.RLCA, byteLength: 1, operands: []},
    // 0x08
    { op: BasicIns.LD,   byteLength: 3, operands: [Operand.a16, Operand.SP]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.HL, Operand.BC]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.BC]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.BC]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.C, Operand.d8]},
    { op: BasicIns.RRCA, byteLength: 1, operands: []},

    // 0x10
    { op: BasicIns.STOP, byteLength: 2, operands: []},
    { op: BasicIns.LD,   byteLength: 3, operands: [Operand.DE, Operand.d16]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.DE, Operand.A]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.DE]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.D]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.D]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.D, Operand.d8]},
    { op: BasicIns.RLA,  byteLength: 1, operands: []},
    // 0x18
    { op: BasicIns.JR,   byteLength: 2, operands: [Operand.r8]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.HL, Operand.DE]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.DE]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.DE]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.E]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.E]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.E, Operand.d8]},
    { op: BasicIns.RRA,  byteLength: 1, operands: []},

    // 0x20
    { op: BasicIns.JR,   byteLength: 2, operands: [Operand.NZ, Operand.r8]},
    { op: BasicIns.LD,   byteLength: 3, operands: [Operand.HL, Operand.d16]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HLPlus, Operand.A]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.H]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.H]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.H, Operand.d8]},
    { op: BasicIns.DAA,  byteLength: 1, operands: []},
    // 0x28
    { op: BasicIns.JR,   byteLength: 2, operands: [Operand.Z, Operand.r8]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.HL, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.HLPlus]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.L]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.L]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.L, Operand.d8]},
    { op: BasicIns.CPL,  byteLength: 1, operands: []},

    // 0x30
    { op: BasicIns.JR,   byteLength: 2, operands: [Operand.NC, Operand.r8]},
    { op: BasicIns.LD,   byteLength: 3, operands: [Operand.SP, Operand.d16]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HLMinus, Operand.A]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.SP]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.HL, Operand.d8]},
    { op: BasicIns.SCF,  byteLength: 1, operands: []},
    // 0x38
    { op: BasicIns.JR,   byteLength: 2, operands: [Operand.C, Operand.r8]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.HL, Operand.SP]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.HLMinus]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.SP]},
    { op: BasicIns.INC,  byteLength: 1, operands: [Operand.A]},
    { op: BasicIns.DEC,  byteLength: 1, operands: [Operand.A]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: BasicIns.CCF,  byteLength: 1, operands: []},

    // 0x40
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.L]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.B, Operand.A]},
    // 0x48
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.L]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.C, Operand.A]},

    // 0x50
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.L]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.D, Operand.A]},
    // 0x58
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.L]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.E, Operand.A]},

    // 0x60
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.L]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.H, Operand.A]},
    // 0x68
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.L]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.L, Operand.A]},

    // 0x70
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HL, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HL, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HL, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HL, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HL, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HL, Operand.L]},
    { op: BasicIns.HALT, byteLength: 1, operands: []},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.HL, Operand.A]},
    // 0x78
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 1, operands: [Operand.A, Operand.A]},

    // 0x80
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: BasicIns.ADD,  byteLength: 1, operands: [Operand.A, Operand.A]},
    // 0x88
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: BasicIns.ADC,  byteLength: 1, operands: [Operand.A, Operand.A]},

    // 0x90
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.B]},
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.D]},
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.E]},
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.H]},
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.L]},
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.SUB,  byteLength: 1, operands: [Operand.A]},
    // 0x98
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: BasicIns.SBC,  byteLength: 1, operands: [Operand.A, Operand.A]},

    // 0xA0
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.B]},
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.D]},
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.E]},
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.H]},
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.L]},
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.AND,  byteLength: 1, operands: [Operand.A]},
    // 0xA8
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.B]},
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.D]},
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.E]},
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.H]},
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.L]},
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.XOR,  byteLength: 1, operands: [Operand.A]},

    // 0xB0
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.B]},
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.D]},
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.E]},
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.H]},
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.L]},
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.OR,   byteLength: 1, operands: [Operand.A]},
    // 0xB8
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.B]},
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.D]},
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.E]},
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.H]},
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.L]},
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.CP,   byteLength: 1, operands: [Operand.A]},

    // 0xC0
    { op: BasicIns.RET,  byteLength: 1, operands: [Operand.NZ]},
    { op: BasicIns.POP,  byteLength: 1, operands: [Operand.BC]},
    { op: BasicIns.JP,   byteLength: 3, operands: [Operand.NZ, Operand.a16]},
    { op: BasicIns.JP,   byteLength: 3, operands: [Operand.a16]},
    { op: BasicIns.CALL, byteLength: 3, operands: [Operand.NZ, Operand.a16]},
    { op: BasicIns.PUSH, byteLength: 1, operands: [Operand.BC]},
    { op: BasicIns.ADD,  byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H00]},
    // 0xC8
    { op: BasicIns.RET,  byteLength: 1, operands: [Operand.Z]},
    { op: BasicIns.RET,  byteLength: 1, operands: []},
    { op: BasicIns.JP,   byteLength: 2, operands: [Operand.Z, Operand.a16]},
    { op: BasicIns.PrefixCB, byteLength: 1, operands: []},
    { op: BasicIns.CALL, byteLength: 3, operands: [Operand.Z, Operand.a16]},
    { op: BasicIns.CALL, byteLength: 3, operands: [Operand.a16]},
    { op: BasicIns.ADC,  byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H08]},

    // 0xD0
    { op: BasicIns.RET,  byteLength: 1, operands: [Operand.NC]},
    { op: BasicIns.POP,  byteLength: 1, operands: [Operand.DE]},
    { op: BasicIns.JP,   byteLength: 3, operands: [Operand.NC, Operand.a16]},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.CALL, byteLength: 3, operands: [Operand.NC, Operand.a16]},
    { op: BasicIns.PUSH, byteLength: 1, operands: [Operand.DE]},
    { op: BasicIns.SUB,  byteLength: 2, operands: [Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H10]},
    // 0xD8
    { op: BasicIns.RET,  byteLength: 1, operands: [Operand.C]},
    { op: BasicIns.RETI, byteLength: 1, operands: []},
    { op: BasicIns.JP,   byteLength: 2, operands: [Operand.C, Operand.a16]},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.CALL, byteLength: 3, operands: [Operand.C, Operand.a16]},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.SBC,  byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H18]},

    // 0xE0
    { op: BasicIns.LDH,  byteLength: 2, operands: [Operand.a8, Operand.A]},
    { op: BasicIns.POP,  byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.C, Operand.A]},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.PUSH, byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.AND,  byteLength: 2, operands: [Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H20]},
    // 0xE8
    { op: BasicIns.ADD,  byteLength: 2, operands: [Operand.SP, Operand.r8]},
    { op: BasicIns.JP,   byteLength: 1, operands: [Operand.HL]},
    { op: BasicIns.LD,   byteLength: 3, operands: [Operand.a16, Operand.A]},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.XOR,  byteLength: 2, operands: [Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H28]},

    // 0xF0
    { op: BasicIns.LDH,  byteLength: 2, operands: [Operand.A, Operand.a8]},
    { op: BasicIns.POP,  byteLength: 1, operands: [Operand.AF]},
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.A, Operand.C]},
    { op: BasicIns.DI,   byteLength: 1, operands: []},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.PUSH, byteLength: 1, operands: [Operand.AF]},
    { op: BasicIns.OR,   byteLength: 2, operands: [Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H30]},
    // 0xF8
    { op: BasicIns.LD,   byteLength: 2, operands: [Operand.HL, Operand.SPPlusR8]},
    { op: BasicIns.JP,   byteLength: 1, operands: [Operand.SP, Operand.HL]},
    { op: BasicIns.LD,   byteLength: 3, operands: [Operand.A, Operand.a16]},
    { op: BasicIns.EI,   byteLength: 1, operands: []},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.EMTY, byteLength: 1, operands: []},
    { op: BasicIns.CP,   byteLength: 2, operands: [Operand.d8]},
    { op: BasicIns.RST,  byteLength: 1, operands: [Operand.H38]},
];

export const cbInstructionSet: Instruction[] = [
    // 0x00
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.RLC,  byteLength: 2, operands: [Operand.A]},
    // 0x08
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.RRC,  byteLength: 2, operands: [Operand.A]},
    // 0x10
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.RL,   byteLength: 2, operands: [Operand.A]},
    // 0x18
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.RR,   byteLength: 2, operands: [Operand.A]},
    // 0x20
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.SLA,  byteLength: 2, operands: [Operand.A]},
    // 0x28
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.SRA,  byteLength: 2, operands: [Operand.A]},
    // 0x30
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.SWAP, byteLength: 2, operands: [Operand.A]},
    // 0x38
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.B]},
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.C]},
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.D]},
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.E]},
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.H]},
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.L]},
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.HL]},
    { op: BasicIns.SRL,  byteLength: 2, operands: [Operand.A]},

    // 0x40
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val0, Operand.A]},
    // 0x48
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val1, Operand.A]},
    // 0x50
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val2, Operand.A]},
    // 0x58
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val3, Operand.A]},
    // 0x60
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val4, Operand.A]},
    // 0x68
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val5, Operand.A]},
    // 0x70
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val6, Operand.A]},
    // 0x78
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.B]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.C]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.D]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.E]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.H]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.L]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.HL]},
    { op: BasicIns.BIT,  byteLength: 2, operands: [Operand.val7, Operand.A]},

    // 0x80
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val0, Operand.A]},
    // 0x88
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val1, Operand.A]},
    // 0x90
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val2, Operand.A]},
    // 0x98
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val3, Operand.A]},
    // 0xA0
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val4, Operand.A]},
    // 0xA8
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val5, Operand.A]},
    // 0xB0
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val6, Operand.A]},
    // 0xB8
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.B]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.C]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.D]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.E]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.H]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.L]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.HL]},
    { op: BasicIns.RES,  byteLength: 2, operands: [Operand.val7, Operand.A]},

    // 0xC0
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val0, Operand.A]},
    // 0xC8
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val1, Operand.A]},
    // 0xD0
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val2, Operand.A]},
    // 0xD8
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val3, Operand.A]},
    // 0xE0
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val4, Operand.A]},
    // 0xE8
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val5, Operand.A]},
    // 0xF0
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val6, Operand.A]},
    // 0xF8
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.B]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.C]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.D]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.E]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.H]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.L]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.HL]},
    { op: BasicIns.SET,  byteLength: 2, operands: [Operand.val7, Operand.A]},
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
    const isCB: boolean = i.op > BasicIns.RLC;
    const searchArr = !isCB ? basicInstructionSet : cbInstructionSet;
    const ind = searchArr.indexOf(i);
    if (ind === -1) throw 'Instruction not found. Maybe it wasn\'t instantiated from bytesToInstruction?';
    return !isCB ? [ind] : [0xCB, ind];
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
        return BasicIns[this.i.op];
    }
    /** Returns a nice string representation of the instruction */
    toString(): string {
        const b: number[] = this.bytesSet ? this.bytes : instructionToBytes(this.i);
        const bStr: string = b.map((x) => niceByteHexa(x)).join(' ');
        return `${this.toStringOP()} - ${bStr}`;
    }
}