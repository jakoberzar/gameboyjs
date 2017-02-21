import { niceHexa } from './helpers';

export interface Instruction {
    op: Ins,
    byteLength: number,
    operands: Operand[],
}

export enum Operand {
    A, B, C, D, E, F, H, L,
    AF, BC, DE, HL,
    SP, PC,
    d8, d16, a8, a16, r8,
    NZ, HLPlus, Z, NC, HLMinus,
    H00, H10, H20, H30, H08, H18, H28, H38,
    SPPlusR8,
    val0 = 100, val1 = 101, val2 = 102, val3 = 103,
    val4 = 104, val5 = 105, val6 = 106, val7 = 107,
}

/** Basic instructions */
export enum Ins {
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
    BIT, RES, SET
}

/** Instruction set, from http://pastraiser.com/cpu/gameboy/gameboy_opcodes.html */
export const basicInstructionSet: Instruction[] = [
    // 0x00
    { op: Ins.NOP,  byteLength: 1, operands: []},
    { op: Ins.LD,   byteLength: 3, operands: [Operand.BC, Operand.d16]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.BC, Operand.A]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.BC]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.B]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.B]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.B, Operand.d8]},
    { op: Ins.RLCA, byteLength: 1, operands: []},
    // 0x08
    { op: Ins.LD,   byteLength: 3, operands: [Operand.a16, Operand.SP]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.HL, Operand.BC]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.BC]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.BC]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.C]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.C]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.C, Operand.d8]},
    { op: Ins.RRCA, byteLength: 1, operands: []},

    // 0x10
    { op: Ins.STOP, byteLength: 2, operands: []},
    { op: Ins.LD,   byteLength: 3, operands: [Operand.DE, Operand.d16]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.DE, Operand.A]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.DE]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.D]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.D]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.D, Operand.d8]},
    { op: Ins.RLA,  byteLength: 1, operands: []},
    // 0x18
    { op: Ins.JR,   byteLength: 2, operands: [Operand.r8]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.HL, Operand.DE]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.DE]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.DE]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.E]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.E]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.E, Operand.d8]},
    { op: Ins.RRA,  byteLength: 1, operands: []},

    // 0x20
    { op: Ins.JR,   byteLength: 2, operands: [Operand.NZ, Operand.r8]},
    { op: Ins.LD,   byteLength: 3, operands: [Operand.HL, Operand.d16]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HLPlus, Operand.A]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.H]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.H]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.H, Operand.d8]},
    { op: Ins.DAA,  byteLength: 1, operands: []},
    // 0x28
    { op: Ins.JR,   byteLength: 2, operands: [Operand.Z, Operand.r8]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.HL, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.HLPlus]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.L]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.L]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.L, Operand.d8]},
    { op: Ins.CPL,  byteLength: 1, operands: []},

    // 0x30
    { op: Ins.JR,   byteLength: 2, operands: [Operand.NC, Operand.r8]},
    { op: Ins.LD,   byteLength: 3, operands: [Operand.SP, Operand.d16]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HLMinus, Operand.A]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.SP]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.HL, Operand.d8]},
    { op: Ins.SCF,  byteLength: 1, operands: []},
    // 0x38
    { op: Ins.JR,   byteLength: 2, operands: [Operand.C, Operand.r8]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.HL, Operand.SP]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.HLMinus]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.SP]},
    { op: Ins.INC,  byteLength: 1, operands: [Operand.A]},
    { op: Ins.DEC,  byteLength: 1, operands: [Operand.A]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: Ins.CCF,  byteLength: 1, operands: []},

    // 0x40
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.L]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.B, Operand.A]},
    // 0x48
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.L]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.C, Operand.A]},

    // 0x50
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.L]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.D, Operand.A]},
    // 0x58
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.L]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.E, Operand.A]},

    // 0x60
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.L]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.H, Operand.A]},
    // 0x68
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.L]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.L, Operand.A]},

    // 0x70
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HL, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HL, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HL, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HL, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HL, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HL, Operand.L]},
    { op: Ins.HALT, byteLength: 1, operands: []},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.HL, Operand.A]},
    // 0x78
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: Ins.LD,   byteLength: 1, operands: [Operand.A, Operand.A]},

    // 0x80
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: Ins.ADD,  byteLength: 1, operands: [Operand.A, Operand.A]},
    // 0x88
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: Ins.ADC,  byteLength: 1, operands: [Operand.A, Operand.A]},

    // 0x90
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.B]},
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.C]},
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.D]},
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.E]},
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.H]},
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.L]},
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.SUB,  byteLength: 1, operands: [Operand.A]},
    // 0x98
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.B]},
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.C]},
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.D]},
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.E]},
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.H]},
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.L]},
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.HL]},
    { op: Ins.SBC,  byteLength: 1, operands: [Operand.A, Operand.A]},

    // 0xA0
    { op: Ins.AND,  byteLength: 1, operands: [Operand.B]},
    { op: Ins.AND,  byteLength: 1, operands: [Operand.C]},
    { op: Ins.AND,  byteLength: 1, operands: [Operand.D]},
    { op: Ins.AND,  byteLength: 1, operands: [Operand.E]},
    { op: Ins.AND,  byteLength: 1, operands: [Operand.H]},
    { op: Ins.AND,  byteLength: 1, operands: [Operand.L]},
    { op: Ins.AND,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.AND,  byteLength: 1, operands: [Operand.A]},
    // 0xA8
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.B]},
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.C]},
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.D]},
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.E]},
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.H]},
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.L]},
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.XOR,  byteLength: 1, operands: [Operand.A]},

    // 0xB0
    { op: Ins.OR,   byteLength: 1, operands: [Operand.B]},
    { op: Ins.OR,   byteLength: 1, operands: [Operand.C]},
    { op: Ins.OR,   byteLength: 1, operands: [Operand.D]},
    { op: Ins.OR,   byteLength: 1, operands: [Operand.E]},
    { op: Ins.OR,   byteLength: 1, operands: [Operand.H]},
    { op: Ins.OR,   byteLength: 1, operands: [Operand.L]},
    { op: Ins.OR,   byteLength: 1, operands: [Operand.HL]},
    { op: Ins.OR,   byteLength: 1, operands: [Operand.A]},
    // 0xB8
    { op: Ins.CP,   byteLength: 1, operands: [Operand.B]},
    { op: Ins.CP,   byteLength: 1, operands: [Operand.C]},
    { op: Ins.CP,   byteLength: 1, operands: [Operand.D]},
    { op: Ins.CP,   byteLength: 1, operands: [Operand.E]},
    { op: Ins.CP,   byteLength: 1, operands: [Operand.H]},
    { op: Ins.CP,   byteLength: 1, operands: [Operand.L]},
    { op: Ins.CP,   byteLength: 1, operands: [Operand.HL]},
    { op: Ins.CP,   byteLength: 1, operands: [Operand.A]},

    // 0xC0
    { op: Ins.RET,  byteLength: 1, operands: [Operand.NZ]},
    { op: Ins.POP,  byteLength: 1, operands: [Operand.BC]},
    { op: Ins.JP,   byteLength: 3, operands: [Operand.NZ, Operand.a16]},
    { op: Ins.JP,   byteLength: 3, operands: [Operand.a16]},
    { op: Ins.CALL, byteLength: 3, operands: [Operand.NZ, Operand.a16]},
    { op: Ins.PUSH, byteLength: 1, operands: [Operand.BC]},
    { op: Ins.ADD,  byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H00]},
    // 0xC8
    { op: Ins.RET,  byteLength: 1, operands: [Operand.Z]},
    { op: Ins.RET,  byteLength: 1, operands: []},
    { op: Ins.JP,   byteLength: 2, operands: [Operand.Z, Operand.a16]},
    { op: Ins.PrefixCB, byteLength: 1, operands: []},
    { op: Ins.CALL, byteLength: 3, operands: [Operand.Z, Operand.a16]},
    { op: Ins.CALL, byteLength: 3, operands: [Operand.a16]},
    { op: Ins.ADC,  byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H08]},

    // 0xD0
    { op: Ins.RET,  byteLength: 1, operands: [Operand.NC]},
    { op: Ins.POP,  byteLength: 1, operands: [Operand.DE]},
    { op: Ins.JP,   byteLength: 3, operands: [Operand.NC, Operand.a16]},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.CALL, byteLength: 3, operands: [Operand.NC, Operand.a16]},
    { op: Ins.PUSH, byteLength: 1, operands: [Operand.DE]},
    { op: Ins.SUB,  byteLength: 2, operands: [Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H10]},
    // 0xD8
    { op: Ins.RET,  byteLength: 1, operands: [Operand.C]},
    { op: Ins.RETI, byteLength: 1, operands: []},
    { op: Ins.JP,   byteLength: 2, operands: [Operand.C, Operand.a16]},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.CALL, byteLength: 3, operands: [Operand.C, Operand.a16]},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.SBC,  byteLength: 2, operands: [Operand.A, Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H18]},

    // 0xE0
    { op: Ins.LDH,  byteLength: 2, operands: [Operand.a8, Operand.A]},
    { op: Ins.POP,  byteLength: 1, operands: [Operand.HL]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.C, Operand.A]},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.PUSH, byteLength: 1, operands: [Operand.HL]},
    { op: Ins.AND,  byteLength: 2, operands: [Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H20]},
    // 0xE8
    { op: Ins.ADD,  byteLength: 2, operands: [Operand.SP, Operand.r8]},
    { op: Ins.JP,   byteLength: 1, operands: [Operand.HL]},
    { op: Ins.LD,   byteLength: 3, operands: [Operand.a16, Operand.A]},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.XOR,  byteLength: 2, operands: [Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H28]},

    // 0xF0
    { op: Ins.LDH,  byteLength: 2, operands: [Operand.A, Operand.a8]},
    { op: Ins.POP,  byteLength: 1, operands: [Operand.AF]},
    { op: Ins.LD,   byteLength: 2, operands: [Operand.A, Operand.C]},
    { op: Ins.DI,   byteLength: 1, operands: []},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.PUSH, byteLength: 1, operands: [Operand.AF]},
    { op: Ins.OR,   byteLength: 2, operands: [Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H30]},
    // 0xF8
    { op: Ins.LD,   byteLength: 2, operands: [Operand.HL, Operand.SPPlusR8]},
    { op: Ins.JP,   byteLength: 1, operands: [Operand.SP, Operand.HL]},
    { op: Ins.LD,   byteLength: 3, operands: [Operand.A, Operand.a16]},
    { op: Ins.EI,   byteLength: 1, operands: []},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.EMTY, byteLength: 1, operands: []},
    { op: Ins.CP,   byteLength: 2, operands: [Operand.d8]},
    { op: Ins.RST,  byteLength: 1, operands: [Operand.H38]},
];

export const cbInstructionSet: Instruction[] = [
    // 0x00
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.B]},
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.C]},
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.D]},
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.E]},
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.H]},
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.L]},
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.HL]},
    { op: Ins.RLC,  byteLength: 2, operands: [Operand.A]},
    // 0x08
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.B]},
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.C]},
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.D]},
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.E]},
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.H]},
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.L]},
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.HL]},
    { op: Ins.RRC,  byteLength: 2, operands: [Operand.A]},
    // 0x10
    { op: Ins.RL,   byteLength: 2, operands: [Operand.B]},
    { op: Ins.RL,   byteLength: 2, operands: [Operand.C]},
    { op: Ins.RL,   byteLength: 2, operands: [Operand.D]},
    { op: Ins.RL,   byteLength: 2, operands: [Operand.E]},
    { op: Ins.RL,   byteLength: 2, operands: [Operand.H]},
    { op: Ins.RL,   byteLength: 2, operands: [Operand.L]},
    { op: Ins.RL,   byteLength: 2, operands: [Operand.HL]},
    { op: Ins.RL,   byteLength: 2, operands: [Operand.A]},
    // 0x18
    { op: Ins.RR,   byteLength: 2, operands: [Operand.B]},
    { op: Ins.RR,   byteLength: 2, operands: [Operand.C]},
    { op: Ins.RR,   byteLength: 2, operands: [Operand.D]},
    { op: Ins.RR,   byteLength: 2, operands: [Operand.E]},
    { op: Ins.RR,   byteLength: 2, operands: [Operand.H]},
    { op: Ins.RR,   byteLength: 2, operands: [Operand.L]},
    { op: Ins.RR,   byteLength: 2, operands: [Operand.HL]},
    { op: Ins.RR,   byteLength: 2, operands: [Operand.A]},
    // 0x20
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.B]},
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.C]},
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.D]},
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.E]},
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.H]},
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.L]},
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.HL]},
    { op: Ins.SLA,  byteLength: 2, operands: [Operand.A]},
    // 0x28
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.B]},
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.C]},
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.D]},
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.E]},
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.H]},
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.L]},
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.HL]},
    { op: Ins.SRA,  byteLength: 2, operands: [Operand.A]},
    // 0x30
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.B]},
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.C]},
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.D]},
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.E]},
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.H]},
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.L]},
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.HL]},
    { op: Ins.SWAP, byteLength: 2, operands: [Operand.A]},
    // 0x38
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.B]},
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.C]},
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.D]},
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.E]},
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.H]},
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.L]},
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.HL]},
    { op: Ins.SRL,  byteLength: 2, operands: [Operand.A]},

    // 0x40
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val0, Operand.A]},
    // 0x48
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val1, Operand.A]},
    // 0x50
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val2, Operand.A]},
    // 0x58
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val3, Operand.A]},
    // 0x60
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val4, Operand.A]},
    // 0x68
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val5, Operand.A]},
    // 0x70
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val6, Operand.A]},
    // 0x78
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.B]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.C]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.D]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.E]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.H]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.L]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.HL]},
    { op: Ins.BIT,  byteLength: 2, operands: [Operand.val7, Operand.A]},

    // 0x80
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val0, Operand.A]},
    // 0x88
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val1, Operand.A]},
    // 0x90
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val2, Operand.A]},
    // 0x98
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val3, Operand.A]},
    // 0xA0
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val4, Operand.A]},
    // 0xA8
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val5, Operand.A]},
    // 0xB0
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val6, Operand.A]},
    // 0xB8
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.B]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.C]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.D]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.E]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.H]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.L]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.HL]},
    { op: Ins.RES,  byteLength: 2, operands: [Operand.val7, Operand.A]},

    // 0xC0
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val0, Operand.A]},
    // 0xC8
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val1, Operand.A]},
    // 0xD0
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val2, Operand.A]},
    // 0xD8
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val3, Operand.A]},
    // 0xE0
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val4, Operand.A]},
    // 0xE8
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val5, Operand.A]},
    // 0xF0
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val6, Operand.A]},
    // 0xF8
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.B]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.C]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.D]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.E]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.H]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.L]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.HL]},
    { op: Ins.SET,  byteLength: 2, operands: [Operand.val7, Operand.A]},
];

/**
 * Decodes the bytes and returns the appropriate instruction
 * @param {number[]} bytes Bytes from the rom instructions
 * @return {instruction} Decoded instruction
 */
export function bytesToInstruction(bytes: number[]): Instruction {
    if (bytes.length < 2) throw "Not enough bytes given, always give at least 2!";
    // Return CB instruction if first byte is CB, else basic one.
    return bytes[0] != 0xCB ? basicInstructionSet[bytes[0]] : cbInstructionSet[bytes[1]];
}

/**
 * Returns the bytes that this instruction encodes to. Isn't especially fast probably.
 * @param {instruction} i The instruction to encode
 * @return {number[]} Bytes that this instruction represents
 */
export function instructionToBytes(i: Instruction): number[] {
    let searchArr = (i.op != Ins.PrefixCB) ? basicInstructionSet : cbInstructionSet;
    let ind = searchArr.indexOf(i);
    return (i.op != Ins.PrefixCB) ? [ind] : [0xCB, ind];
}

export class ReadableInstruction {
    bytes: number[];
    bytesSet = false;
    constructor(private i: Instruction, bytes?: number[]) {
        if (bytes != undefined) {
            // Slice the array if too many bytes are given.
            this.bytes = bytes.slice(0, i.byteLength);
            this.bytesSet = true;
        }
    }
    /** Returns the string form of the operation */
    toStringOP(): string {
        return Ins[this.i.op];
    }
    /** Returns a nice string representation of the instruction */
    toString(): string {
        let b: number[] = this.bytesSet ? this.bytes : instructionToBytes(this.i);
        let bStr: string = b.map(x => niceHexa(x)).join(" ");
        return `${this.toStringOP()} - ${bStr}`;
    }
}