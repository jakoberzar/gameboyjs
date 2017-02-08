import { niceHexa } from './helpers';

export interface instruction {
    op: ins,
    byteLength: number,
    operands: operand[],
}

export enum operand {
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
export enum ins {
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
export const basicInstructionSet: instruction[] = [
    // 0x00
    { op: ins.NOP,  byteLength: 1, operands: []},
    { op: ins.LD,   byteLength: 3, operands: [operand.BC, operand.d16]},
    { op: ins.LD,   byteLength: 1, operands: [operand.BC, operand.A]},
    { op: ins.INC,  byteLength: 1, operands: [operand.BC]},
    { op: ins.INC,  byteLength: 1, operands: [operand.B]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.B]},
    { op: ins.LD,   byteLength: 2, operands: [operand.B, operand.d8]},
    { op: ins.RLCA, byteLength: 1, operands: []},
    // 0x08
    { op: ins.LD,   byteLength: 3, operands: [operand.a16, operand.SP]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.HL, operand.BC]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.BC]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.BC]},
    { op: ins.INC,  byteLength: 1, operands: [operand.C]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.C]},
    { op: ins.LD,   byteLength: 2, operands: [operand.C, operand.d8]},
    { op: ins.RRCA, byteLength: 1, operands: []},

    // 0x10
    { op: ins.STOP, byteLength: 2, operands: []},
    { op: ins.LD,   byteLength: 3, operands: [operand.DE, operand.d16]},
    { op: ins.LD,   byteLength: 1, operands: [operand.DE, operand.A]},
    { op: ins.INC,  byteLength: 1, operands: [operand.DE]},
    { op: ins.INC,  byteLength: 1, operands: [operand.D]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.D]},
    { op: ins.LD,   byteLength: 2, operands: [operand.D, operand.d8]},
    { op: ins.RLA,  byteLength: 1, operands: []},
    // 0x18
    { op: ins.JR,   byteLength: 2, operands: [operand.r8]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.HL, operand.DE]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.DE]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.DE]},
    { op: ins.INC,  byteLength: 1, operands: [operand.E]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.E]},
    { op: ins.LD,   byteLength: 2, operands: [operand.E, operand.d8]},
    { op: ins.RRA,  byteLength: 1, operands: []},

    // 0x20
    { op: ins.JR,   byteLength: 2, operands: [operand.NZ, operand.r8]},
    { op: ins.LD,   byteLength: 3, operands: [operand.HL, operand.d16]},
    { op: ins.LD,   byteLength: 1, operands: [operand.HLPlus, operand.A]},
    { op: ins.INC,  byteLength: 1, operands: [operand.HL]},
    { op: ins.INC,  byteLength: 1, operands: [operand.H]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.H]},
    { op: ins.LD,   byteLength: 2, operands: [operand.H, operand.d8]},
    { op: ins.DAA,  byteLength: 1, operands: []},
    // 0x28
    { op: ins.JR,   byteLength: 2, operands: [operand.Z, operand.r8]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.HL, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.HLPlus]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.HL]},
    { op: ins.INC,  byteLength: 1, operands: [operand.L]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.L]},
    { op: ins.LD,   byteLength: 2, operands: [operand.L, operand.d8]},
    { op: ins.CPL,  byteLength: 1, operands: []},

    // 0x30
    { op: ins.JR,   byteLength: 2, operands: [operand.NC, operand.r8]},
    { op: ins.LD,   byteLength: 3, operands: [operand.SP, operand.d16]},
    { op: ins.LD,   byteLength: 1, operands: [operand.HLMinus, operand.A]},
    { op: ins.INC,  byteLength: 1, operands: [operand.SP]},
    { op: ins.INC,  byteLength: 1, operands: [operand.HL]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.HL]},
    { op: ins.LD,   byteLength: 2, operands: [operand.HL, operand.d8]},
    { op: ins.SCF,  byteLength: 1, operands: []},
    // 0x38
    { op: ins.JR,   byteLength: 2, operands: [operand.C, operand.r8]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.HL, operand.SP]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.HLMinus]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.SP]},
    { op: ins.INC,  byteLength: 1, operands: [operand.A]},
    { op: ins.DEC,  byteLength: 1, operands: [operand.A]},
    { op: ins.LD,   byteLength: 2, operands: [operand.A, operand.d8]},
    { op: ins.CCF,  byteLength: 1, operands: []},

    // 0x40
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.L]},
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.B, operand.A]},
    // 0x48
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.L]},
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.C, operand.A]},

    // 0x50
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.L]},
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.D, operand.A]},
    // 0x58
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.L]},
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.E, operand.A]},

    // 0x60
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.L]},
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.H, operand.A]},
    // 0x68
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.L]},
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.L, operand.A]},

    // 0x70
    { op: ins.LD,   byteLength: 1, operands: [operand.HL, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.HL, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.HL, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.HL, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.HL, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.HL, operand.L]},
    { op: ins.HALT, byteLength: 1, operands: []},
    { op: ins.LD,   byteLength: 1, operands: [operand.HL, operand.A]},
    // 0x78
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.B]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.C]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.D]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.E]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.H]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.L]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.HL]},
    { op: ins.LD,   byteLength: 1, operands: [operand.A, operand.A]},

    // 0x80
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.B]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.C]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.D]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.E]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.H]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.L]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.HL]},
    { op: ins.ADD,  byteLength: 1, operands: [operand.A, operand.A]},
    // 0x88
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.B]},
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.C]},
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.D]},
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.E]},
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.H]},
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.L]},
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.HL]},
    { op: ins.ADC,  byteLength: 1, operands: [operand.A, operand.A]},

    // 0x90
    { op: ins.SUB,  byteLength: 1, operands: [operand.B]},
    { op: ins.SUB,  byteLength: 1, operands: [operand.C]},
    { op: ins.SUB,  byteLength: 1, operands: [operand.D]},
    { op: ins.SUB,  byteLength: 1, operands: [operand.E]},
    { op: ins.SUB,  byteLength: 1, operands: [operand.H]},
    { op: ins.SUB,  byteLength: 1, operands: [operand.L]},
    { op: ins.SUB,  byteLength: 1, operands: [operand.HL]},
    { op: ins.SUB,  byteLength: 1, operands: [operand.A]},
    // 0x98
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.B]},
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.C]},
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.D]},
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.E]},
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.H]},
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.L]},
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.HL]},
    { op: ins.SBC,  byteLength: 1, operands: [operand.A, operand.A]},

    // 0xA0
    { op: ins.AND,  byteLength: 1, operands: [operand.B]},
    { op: ins.AND,  byteLength: 1, operands: [operand.C]},
    { op: ins.AND,  byteLength: 1, operands: [operand.D]},
    { op: ins.AND,  byteLength: 1, operands: [operand.E]},
    { op: ins.AND,  byteLength: 1, operands: [operand.H]},
    { op: ins.AND,  byteLength: 1, operands: [operand.L]},
    { op: ins.AND,  byteLength: 1, operands: [operand.HL]},
    { op: ins.AND,  byteLength: 1, operands: [operand.A]},
    // 0xA8
    { op: ins.XOR,  byteLength: 1, operands: [operand.B]},
    { op: ins.XOR,  byteLength: 1, operands: [operand.C]},
    { op: ins.XOR,  byteLength: 1, operands: [operand.D]},
    { op: ins.XOR,  byteLength: 1, operands: [operand.E]},
    { op: ins.XOR,  byteLength: 1, operands: [operand.H]},
    { op: ins.XOR,  byteLength: 1, operands: [operand.L]},
    { op: ins.XOR,  byteLength: 1, operands: [operand.HL]},
    { op: ins.XOR,  byteLength: 1, operands: [operand.A]},

    // 0xB0
    { op: ins.OR,   byteLength: 1, operands: [operand.B]},
    { op: ins.OR,   byteLength: 1, operands: [operand.C]},
    { op: ins.OR,   byteLength: 1, operands: [operand.D]},
    { op: ins.OR,   byteLength: 1, operands: [operand.E]},
    { op: ins.OR,   byteLength: 1, operands: [operand.H]},
    { op: ins.OR,   byteLength: 1, operands: [operand.L]},
    { op: ins.OR,   byteLength: 1, operands: [operand.HL]},
    { op: ins.OR,   byteLength: 1, operands: [operand.A]},
    // 0xB8
    { op: ins.CP,   byteLength: 1, operands: [operand.B]},
    { op: ins.CP,   byteLength: 1, operands: [operand.C]},
    { op: ins.CP,   byteLength: 1, operands: [operand.D]},
    { op: ins.CP,   byteLength: 1, operands: [operand.E]},
    { op: ins.CP,   byteLength: 1, operands: [operand.H]},
    { op: ins.CP,   byteLength: 1, operands: [operand.L]},
    { op: ins.CP,   byteLength: 1, operands: [operand.HL]},
    { op: ins.CP,   byteLength: 1, operands: [operand.A]},

    // 0xC0
    { op: ins.RET,  byteLength: 1, operands: [operand.NZ]},
    { op: ins.POP,  byteLength: 1, operands: [operand.BC]},
    { op: ins.JP,   byteLength: 3, operands: [operand.NZ, operand.a16]},
    { op: ins.JP,   byteLength: 3, operands: [operand.a16]},
    { op: ins.CALL, byteLength: 3, operands: [operand.NZ, operand.a16]},
    { op: ins.PUSH, byteLength: 1, operands: [operand.BC]},
    { op: ins.ADD,  byteLength: 2, operands: [operand.A, operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H00]},
    // 0xC8
    { op: ins.RET,  byteLength: 1, operands: [operand.Z]},
    { op: ins.RET,  byteLength: 1, operands: []},
    { op: ins.JP,   byteLength: 2, operands: [operand.Z, operand.a16]},
    { op: ins.PrefixCB, byteLength: 1, operands: []},
    { op: ins.CALL, byteLength: 3, operands: [operand.Z, operand.a16]},
    { op: ins.CALL, byteLength: 3, operands: [operand.a16]},
    { op: ins.ADC,  byteLength: 2, operands: [operand.A, operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H08]},

    // 0xD0
    { op: ins.RET,  byteLength: 1, operands: [operand.NC]},
    { op: ins.POP,  byteLength: 1, operands: [operand.DE]},
    { op: ins.JP,   byteLength: 3, operands: [operand.NC, operand.a16]},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.CALL, byteLength: 3, operands: [operand.NC, operand.a16]},
    { op: ins.PUSH, byteLength: 1, operands: [operand.DE]},
    { op: ins.SUB,  byteLength: 2, operands: [operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H10]},
    // 0xD8
    { op: ins.RET,  byteLength: 1, operands: [operand.C]},
    { op: ins.RETI, byteLength: 1, operands: []},
    { op: ins.JP,   byteLength: 2, operands: [operand.C, operand.a16]},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.CALL, byteLength: 3, operands: [operand.C, operand.a16]},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.SBC,  byteLength: 2, operands: [operand.A, operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H18]},

    // 0xE0
    { op: ins.LDH,  byteLength: 2, operands: [operand.a8, operand.A]},
    { op: ins.POP,  byteLength: 1, operands: [operand.HL]},
    { op: ins.LD,   byteLength: 2, operands: [operand.C, operand.A]},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.PUSH, byteLength: 1, operands: [operand.HL]},
    { op: ins.AND,  byteLength: 2, operands: [operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H20]},
    // 0xE8
    { op: ins.ADD,  byteLength: 2, operands: [operand.SP, operand.r8]},
    { op: ins.JP,   byteLength: 1, operands: [operand.HL]},
    { op: ins.LD,   byteLength: 3, operands: [operand.a16, operand.A]},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.XOR,  byteLength: 2, operands: [operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H28]},

    // 0xF0
    { op: ins.LDH,  byteLength: 2, operands: [operand.A, operand.a8]},
    { op: ins.POP,  byteLength: 1, operands: [operand.AF]},
    { op: ins.LD,   byteLength: 2, operands: [operand.A, operand.C]},
    { op: ins.DI,   byteLength: 1, operands: []},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.PUSH, byteLength: 1, operands: [operand.AF]},
    { op: ins.OR,   byteLength: 2, operands: [operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H30]},
    // 0xF8
    { op: ins.LD,   byteLength: 2, operands: [operand.HL, operand.SPPlusR8]},
    { op: ins.JP,   byteLength: 1, operands: [operand.SP, operand.HL]},
    { op: ins.LD,   byteLength: 3, operands: [operand.A, operand.a16]},
    { op: ins.EI,   byteLength: 1, operands: []},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.EMTY, byteLength: 1, operands: []},
    { op: ins.CP,   byteLength: 2, operands: [operand.d8]},
    { op: ins.RST,  byteLength: 1, operands: [operand.H38]},
];

export const cbInstructionSet: instruction[] = [
    // 0x00
    { op: ins.RLC,  byteLength: 2, operands: [operand.B]},
    { op: ins.RLC,  byteLength: 2, operands: [operand.C]},
    { op: ins.RLC,  byteLength: 2, operands: [operand.D]},
    { op: ins.RLC,  byteLength: 2, operands: [operand.E]},
    { op: ins.RLC,  byteLength: 2, operands: [operand.H]},
    { op: ins.RLC,  byteLength: 2, operands: [operand.L]},
    { op: ins.RLC,  byteLength: 2, operands: [operand.HL]},
    { op: ins.RLC,  byteLength: 2, operands: [operand.A]},
    // 0x08
    { op: ins.RRC,  byteLength: 2, operands: [operand.B]},
    { op: ins.RRC,  byteLength: 2, operands: [operand.C]},
    { op: ins.RRC,  byteLength: 2, operands: [operand.D]},
    { op: ins.RRC,  byteLength: 2, operands: [operand.E]},
    { op: ins.RRC,  byteLength: 2, operands: [operand.H]},
    { op: ins.RRC,  byteLength: 2, operands: [operand.L]},
    { op: ins.RRC,  byteLength: 2, operands: [operand.HL]},
    { op: ins.RRC,  byteLength: 2, operands: [operand.A]},
    // 0x10
    { op: ins.RL,   byteLength: 2, operands: [operand.B]},
    { op: ins.RL,   byteLength: 2, operands: [operand.C]},
    { op: ins.RL,   byteLength: 2, operands: [operand.D]},
    { op: ins.RL,   byteLength: 2, operands: [operand.E]},
    { op: ins.RL,   byteLength: 2, operands: [operand.H]},
    { op: ins.RL,   byteLength: 2, operands: [operand.L]},
    { op: ins.RL,   byteLength: 2, operands: [operand.HL]},
    { op: ins.RL,   byteLength: 2, operands: [operand.A]},
    // 0x18
    { op: ins.RR,   byteLength: 2, operands: [operand.B]},
    { op: ins.RR,   byteLength: 2, operands: [operand.C]},
    { op: ins.RR,   byteLength: 2, operands: [operand.D]},
    { op: ins.RR,   byteLength: 2, operands: [operand.E]},
    { op: ins.RR,   byteLength: 2, operands: [operand.H]},
    { op: ins.RR,   byteLength: 2, operands: [operand.L]},
    { op: ins.RR,   byteLength: 2, operands: [operand.HL]},
    { op: ins.RR,   byteLength: 2, operands: [operand.A]},
    // 0x20
    { op: ins.SLA,  byteLength: 2, operands: [operand.B]},
    { op: ins.SLA,  byteLength: 2, operands: [operand.C]},
    { op: ins.SLA,  byteLength: 2, operands: [operand.D]},
    { op: ins.SLA,  byteLength: 2, operands: [operand.E]},
    { op: ins.SLA,  byteLength: 2, operands: [operand.H]},
    { op: ins.SLA,  byteLength: 2, operands: [operand.L]},
    { op: ins.SLA,  byteLength: 2, operands: [operand.HL]},
    { op: ins.SLA,  byteLength: 2, operands: [operand.A]},
    // 0x28
    { op: ins.SRA,  byteLength: 2, operands: [operand.B]},
    { op: ins.SRA,  byteLength: 2, operands: [operand.C]},
    { op: ins.SRA,  byteLength: 2, operands: [operand.D]},
    { op: ins.SRA,  byteLength: 2, operands: [operand.E]},
    { op: ins.SRA,  byteLength: 2, operands: [operand.H]},
    { op: ins.SRA,  byteLength: 2, operands: [operand.L]},
    { op: ins.SRA,  byteLength: 2, operands: [operand.HL]},
    { op: ins.SRA,  byteLength: 2, operands: [operand.A]},
    // 0x30
    { op: ins.SWAP, byteLength: 2, operands: [operand.B]},
    { op: ins.SWAP, byteLength: 2, operands: [operand.C]},
    { op: ins.SWAP, byteLength: 2, operands: [operand.D]},
    { op: ins.SWAP, byteLength: 2, operands: [operand.E]},
    { op: ins.SWAP, byteLength: 2, operands: [operand.H]},
    { op: ins.SWAP, byteLength: 2, operands: [operand.L]},
    { op: ins.SWAP, byteLength: 2, operands: [operand.HL]},
    { op: ins.SWAP, byteLength: 2, operands: [operand.A]},
    // 0x38
    { op: ins.SRL,  byteLength: 2, operands: [operand.B]},
    { op: ins.SRL,  byteLength: 2, operands: [operand.C]},
    { op: ins.SRL,  byteLength: 2, operands: [operand.D]},
    { op: ins.SRL,  byteLength: 2, operands: [operand.E]},
    { op: ins.SRL,  byteLength: 2, operands: [operand.H]},
    { op: ins.SRL,  byteLength: 2, operands: [operand.L]},
    { op: ins.SRL,  byteLength: 2, operands: [operand.HL]},
    { op: ins.SRL,  byteLength: 2, operands: [operand.A]},

    // 0x40
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val0, operand.A]},
    // 0x48
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val1, operand.A]},
    // 0x50
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val2, operand.A]},
    // 0x58
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val3, operand.A]},
    // 0x60
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val4, operand.A]},
    // 0x68
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val5, operand.A]},
    // 0x70
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val6, operand.A]},
    // 0x78
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.B]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.C]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.D]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.E]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.H]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.L]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.HL]},
    { op: ins.BIT,  byteLength: 2, operands: [operand.val7, operand.A]},

    // 0x80
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val0, operand.A]},
    // 0x88
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val1, operand.A]},
    // 0x90
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val2, operand.A]},
    // 0x98
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val3, operand.A]},
    // 0xA0
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val4, operand.A]},
    // 0xA8
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val5, operand.A]},
    // 0xB0
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val6, operand.A]},
    // 0xB8
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.B]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.C]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.D]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.E]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.H]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.L]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.HL]},
    { op: ins.RES,  byteLength: 2, operands: [operand.val7, operand.A]},

    // 0xC0
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val0, operand.A]},
    // 0xC8
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val1, operand.A]},
    // 0xD0
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val2, operand.A]},
    // 0xD8
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val3, operand.A]},
    // 0xE0
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val4, operand.A]},
    // 0xE8
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val5, operand.A]},
    // 0xF0
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val6, operand.A]},
    // 0xF8
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.B]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.C]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.D]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.E]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.H]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.L]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.HL]},
    { op: ins.SET,  byteLength: 2, operands: [operand.val7, operand.A]},
];

/**
 * Decodes the bytes and returns the appropriate instruction
 * @param {number[]} bytes Bytes from the rom instructions
 * @return {instruction} Decoded instruction
 */
export function bytesToInstruction(bytes: number[]): instruction {
    if (bytes.length < 2) throw "Not enough bytes given, always give at least 2!";
    // Return CB instruction if first byte is CB, else basic one.
    return bytes[0] != 0xCB ? basicInstructionSet[bytes[0]] : cbInstructionSet[bytes[1]];
}

export function instructionToBytes(i: instruction): number[] {
    let searchArr = (i.op != ins.PrefixCB) ? basicInstructionSet : cbInstructionSet;
    let ind;
    for (ind = 0; ind < searchArr.length; ind++) {
        let j = searchArr[ind];
        if (j.op == i.op && j.byteLength == i.byteLength && j.operands == i.operands) {
            break;
        }
    }
    return (i.op != ins.PrefixCB) ? [ind] : [0xCB, ind];
}

export class readableInstruction {
    bytes: number[];
    bytesSet = false;
    constructor(private i: instruction, bytes?: number[]) {
        if (bytes != undefined) {
            this.bytes = bytes.slice(0, i.byteLength);
            this.bytesSet = true;
        }
    }
    toStringOP(): string {
        return ins[this.i.op];
    }
    toString(): string {
        let b: number[] = this.bytesSet ?
            this.bytes :
            instructionToBytes(this.i);
        let bStr: string = b.map(x => niceHexa(x)).join(" ");
        return this.toStringOP() + ` - ${bStr}`;
    }
}