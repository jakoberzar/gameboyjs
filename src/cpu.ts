import * as CONSTANTS from './constants';
import { getBit, getBits, modifyBit } from './helpers';
import { Instruction, instructionToString, Opcode, Operand } from './instructions';
import { Memory } from './memory';
import { Registers } from './registers';
import { Rom, RomInstruction } from './rom';

interface Log {
    pc: number;
    inst: RomInstruction;
}

interface MachineState {
    running: boolean;
    lastExecuted: RomInstruction;
}
export interface Range {
    start: number;
    end: number;
    amount: number;
}

export class CPU {
    registers: Registers;
    memory: Memory;
    rom: Rom;

    state: MachineState;
    currentInstructions: RomInstruction[];
    currentInstructionRange: Range;

    frequency = 4194304; // Original is 4.194304 MHz, but often divided by four with instruction cycles.

    displayFps = 59.727; // V-Blank frequency
    availableTimeFrame = 16 * 16; // 16.74 ms; Roughly 1000 / 59.73
    // cyclesPerFrame = 70225; // How many cpu cycles need to be executed every frame.
    cyclesPerFrame = 100; // 100 is enough for debugging...

    queuedExecutes = 0;

    enableInterruptsNext = false;

    debugging: boolean = false;
    executedLog: Log[] = [];

    constructor(registers = new Registers(), memory = new Memory()) {
        this.registers = registers;
        this.memory = memory;

        // GB sets the PC to 0x151 at start up
        // this.registers.set(Operand.PC, 0x00);
        this.registers.set(Operand.PC, CONSTANTS.bootPCValue);
        this.registers.set(Operand.PC, 0x100);
        this.state = {
            running: false,
            lastExecuted: null,
        };

        console.log('The CPU has been initialized!');
    }

    setRom(rom: Rom) {
        this.rom = rom;
        this.memory.setRom(rom);

        this.currentInstructionRange = { start: 0, end: 0, amount: 15 };
        this.currentInstructions = new Array(this.currentInstructionRange.amount);
        this.updateCurrentInstructions();
    }

    start() {
        this.state.running = true;
        this.execute();
    }

    stop() {
        this.state.running = false;
    }

    step() {
        this.readNext();
        this.maybeUpdateCurrentInstructions();
    }

    frameStep() { // In use?
        this.execute(false);
    }

    execute(loop = true) {
        if (loop) {
            this.queuedExecutes--;
            if (!this.state.running) {
                return;
            }

            const timeoutTime = this.queuedExecutes > 1 ?
                this.availableTimeFrame * (this.queuedExecutes - 1) :
                this.availableTimeFrame;

            setTimeout(() => {
                this.execute();
            }, timeoutTime);
            this.queuedExecutes++;
        }

        let currentCyclesFrame = 0;
        while (currentCyclesFrame < this.cyclesPerFrame) {
            const executed = this.readNext();
            currentCyclesFrame += 2; // TODO - READ FROM executed!
        }
        this.maybeUpdateCurrentInstructions();
    }

    readNext() {
        const currentInst: RomInstruction = this.memory.getInstructionAt(this.registers.pc);
        const len = currentInst.instruction.byteLength;

        if (this.debugging) {
            this.printCurrentInstruction(currentInst);
            this.dumpOperandsAndRegisters(currentInst, 'Before');
        }

        this.executedLog.push({pc: this.registers.pc, inst: currentInst});
        this.registers.increasePC(currentInst.instruction.byteLength);

        this.processInstruction(currentInst);

        if (this.debugging) {
            this.dumpOperandsAndRegisters(currentInst, 'After');
        }

        this.state.lastExecuted = currentInst;

        return currentInst;
    }

    maybeUpdateCurrentInstructions() {
        const pc = this.registers.pc;
        if (this.currentInstructionRange.end < pc || this.currentInstructionRange.start > pc) {
            this.currentInstructionRange.start = this.registers.pc;
            this.updateCurrentInstructions();
        }
    }

    updateCurrentInstructions() {
        const diff = this.currentInstructions.length - this.currentInstructionRange.amount;
        this.currentInstructions.splice(this.currentInstructions.length - diff, diff);
        let myPC = this.currentInstructionRange.start;
        for (let stored = 0; stored < this.currentInstructionRange.amount; stored++) {
            const readInstr = this.memory.getInstructionAt(myPC);
            if (readInstr == null) {
                stored--;
                myPC += 1;
                continue;
            } else {
                myPC += readInstr.instruction.byteLength;
                this.currentInstructions.splice(stored, 1, readInstr);
            }
        }
        this.currentInstructionRange.end = myPC - 1;
    }

    processInstruction(romInst: RomInstruction) {
        const inst = romInst.instruction;
        const opcode = inst.op;
        switch (opcode) {
            // Misc, control instructions
            case Opcode.NOP:
                break;
            case Opcode.EI: {
                this.enableInterruptsNext = true;
                break;
            }
            case Opcode.DI: {
                this.memory.ir = 0x0;
                break;
            }
            case Opcode.HALT: {
                console.log('halt...');
                break;
            }
            case Opcode.STOP: {
                console.log('stop...');
                break;
            }

            // Load, store, move instructions
            case Opcode.LD:
            case Opcode.LDH: {
                const value = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.setOperand(inst.operands[0], romInst.operandBytes, value);
                break;
            }
            case Opcode.LDI: {
                const value = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.setOperand(inst.operands[0], romInst.operandBytes, value);
                this.registers.hl++;
                break;
            }
            case Opcode.LDD: {
                const value = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.setOperand(inst.operands[0], romInst.operandBytes, value);
                this.registers.hl--;
                break;
            }
            case Opcode.LDHL: {
                const r8 = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.registers.hl = this.registers.sp + r8;
                this.registers.flagZ = false;
                this.registers.flagN = false;
                this.registers.setHalfCarryAddition(this.registers.sp, r8, 16);
                this.registers.setCarryAddition(this.registers.sp, r8, 16);
                break;
            }
            case Opcode.POP: {
                const values = this.memory.readMultiple(this.registers.sp);
                this.registers.set(inst.operands[0], (values[0] << 8) + values[1]);
                this.registers.sp += 2;
                break;
            }
            case Opcode.PUSH: {
                this.memory.writeTwoBytes(this.registers.sp - 2, this.registers.get(inst.operands[0]));
                this.registers.sp -= 2;
                break;
            }

            // Arithmetic and logical instructions
            case Opcode.INC: {
                const op = inst.operands[0];
                const value = this.getOperandValue(op, romInst.operandBytes);
                let result = value + 1;
                if (this.isOperand8bit(op)) {
                    result = result & 0xFF;
                    this.registers.setZeroFlag(result);
                    this.registers.flagN = false;
                    this.registers.setHalfCarryAddition(value, 1, 8);
                }
                this.setOperand(op, romInst.operandBytes, result);
                break;
            }
            case Opcode.DEC: {
                const op = inst.operands[0];
                const value = this.getOperandValue(op, romInst.operandBytes);
                let result = value - 1;
                if (this.isOperand8bit(op)) {
                    result = result & 0xFF;
                    this.registers.setZeroFlag(result);
                    this.registers.flagN = true;
                    this.registers.setHalfCarrySubtraction(value, 1, 8);
                }
                this.setOperand(op, romInst.operandBytes, result);
                break;
            }
            case Opcode.ADD: {
                const op1Val: number = this.registers.get(inst.operands[0]);
                const op2Val: number = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                let result = op1Val + op2Val;
                if (this.isOperand8bit(inst.operands[0])) {
                    result = result & 0xFF;
                    this.registers.setZeroFlag(result);
                    this.registers.flagN = false;
                    this.registers.setHalfCarryAddition(op1Val, op2Val, 8);
                    this.registers.setCarryAddition(op1Val, op2Val, 8);
                } else {
                    this.registers.flagN = false;
                    this.registers.setHalfCarryAddition(op1Val, op2Val, 16);
                    this.registers.setCarryAddition(op1Val, op2Val, 16);
                    if (inst.operands[0] === Operand.SP) {
                        this.registers.flagZ = false;
                    }
                }
                this.registers.set(inst.operands[0], result);
                break;
            }
            case Opcode.ADC: {
                const flagVal = this.registers.flagC ? 1 : 0;
                const op1Val: number = this.registers.get(inst.operands[0]);
                const op2Val: number = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                let result = op1Val + op2Val + flagVal;
                result = result & 0xFF;

                this.registers.setZeroFlag(result);
                this.registers.flagN = false;
                this.registers.setHalfCarryAddition(op1Val, op2Val + flagVal, 8);
                this.registers.setCarryAddition(op1Val, op2Val + flagVal, 8);

                this.registers.set(inst.operands[0], result);
                break;
            }
            case Opcode.SUB: {
                const op1Val: number = this.registers.a;
                const op2Val: number = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                let result = op1Val - op2Val;
                result = result & 0xFF;

                this.registers.setZeroFlag(result);
                this.registers.flagN = true;
                this.registers.setHalfCarrySubtraction(op1Val, op2Val, 8);
                this.registers.setCarrySubtraction(op1Val, op2Val, 8);

                this.registers.a = result;
                break;
            }
            case Opcode.SBC: {
                const flagVal = this.registers.flagC ? 1 : 0;
                const op1Val: number = this.registers.a;
                const op2Val: number = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                let result = op1Val - op2Val - flagVal;
                result = result & 0xFF;

                this.registers.setZeroFlag(result);
                this.registers.flagN = true;
                this.registers.setHalfCarrySubtraction(op1Val, op2Val + flagVal, 8);
                this.registers.setCarrySubtraction(op1Val, op2Val + flagVal, 8);

                this.registers.a = result;
                break;
            }
            case Opcode.AND: {
                this.registers.a = this.registers.a & this.getOperandValue(inst.operands[0], romInst.operandBytes);

                this.registers.setZeroFlag();
                this.registers.flagN = false;
                this.registers.flagH = true;
                this.registers.flagC = false;
                break;
            }
            case Opcode.XOR: {
                this.registers.a = this.registers.a ^ this.getOperandValue(inst.operands[0], romInst.operandBytes);

                this.registers.setZeroFlag();
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = false;
                break;
            }
            case Opcode.OR: {
                this.registers.a = this.registers.a | this.getOperandValue(inst.operands[0], romInst.operandBytes);

                this.registers.setZeroFlag();
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = false;
                break;
            }
            case Opcode.CP: {
                const op1Val: number = this.registers.a;
                const op2Val: number = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                let result = op1Val - op2Val;
                result = result & 0xFF;

                this.registers.setZeroFlag(result);
                this.registers.flagN = true;
                this.registers.setHalfCarrySubtraction(op1Val, op2Val, 8);
                this.registers.setCarrySubtraction(op1Val, op2Val, 8);
                break;
            }

            // Rotations, shifts (more below at CB)
            case Opcode.RLCA: {
                const oldABit7: number = getBit(this.registers.a, 7);
                this.registers.a = (this.registers.a << 1) | oldABit7;
                this.registers.a = this.registers.a & 0xFF;
                this.registers.flagZ = false;
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit7 > 0;
                break;
            }
            case Opcode.RLA: {
                const oldABit7: number = getBit(this.registers.a, 7);
                const newBit0 = this.registers.flagC ? 1 : 0;
                this.registers.a = (this.registers.a << 1) | newBit0;
                this.registers.a = this.registers.a & 0xFF;
                this.registers.flagZ = false;
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit7 > 0;
                break;
            }
            case Opcode.RRCA: {
                const oldABit0: number = getBit(this.registers.a, 0);
                this.registers.a = (this.registers.a >> 1) | (oldABit0 << 7);
                this.registers.flagZ = false;
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit0 > 0;
                break;
            }
            case Opcode.RRA: {
                const oldABit0: number = getBit(this.registers.a, 0);
                const newBit7 = this.registers.flagC ? 1 : 0;
                this.registers.a = (this.registers.a >> 1) | (newBit7 << 7);
                this.registers.flagZ = false;
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit0 > 0;
                break;
            }

            // Special arithmetic instructions
            case Opcode.DAA: { // TODO: Test this instruction, not exactly following the table...
                let n1 = getBits(this.registers.a, 4, 4);
                let n2 = getBits(this.registers.a, 0, 4);
                if (!this.registers.flagN) {
                    if (n2 > 0x9 || this.registers.flagH) {
                        this.registers.a = (this.registers.a + 0x06) & 0xFF;
                    }
                    if (n1 > 0x9 || (n1 > 0x9 && n2 === 0x8) || this.registers.flagC) {
                        this.registers.a = (this.registers.a + 0x60) & 0xFF;
                        this.registers.flagC = true;
                    }
                } else {
                    if (!this.registers.flagC && n2 > 0x5 && this.registers.flagH) {
                        this.registers.a = (this.registers.a + 0xFA) & 0xFF;
                    } else if (this.registers.flagC && n1 > 0x6 && !this.registers.flagH && n2 < 0xA) {
                        this.registers.a = (this.registers.a + 0xA0) & 0xFF;
                    } else if (this.registers.flagC && n1 > 0x5 && this.registers.flagH && n2 > 0x5) {
                        this.registers.a = (this.registers.a + 0x9A) & 0xFF;
                    }
                }

                this.registers.flagH = false;
                this.registers.setZeroFlag();
                break;
            }
            case Opcode.SCF: { // Set carry flag
                this.registers.flagH = false;
                this.registers.flagN = false;
                this.registers.flagC = true;
                break;
            }
            case Opcode.CPL: { // Complement register a
                this.registers.a = this.registers.a ^ 0xFF;
                this.registers.flagN = true;
                this.registers.flagH = true;
                break;
            }
            case Opcode.CCF: { // Complement c flag
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = !this.registers.flagC;
                break;
            }

            // Jumps, calls
            case Opcode.JR: {
                const noConditions = inst.operands.length === 1;
                if (noConditions || this.getFlagCondition(inst.operands[0])) {
                    const r8 = this.getOperandValue(Operand.r8, romInst.operandBytes);
                    this.registers.increasePC(r8);
                    inst.cycles = 12;
                } else {
                    inst.cycles = 8;
                }
                break;
            }
            case Opcode.JP: {
                const noConditions = inst.operands.length === 1;
                if (noConditions || this.getFlagCondition(inst.operands[0])) {
                    const adrOperand: Operand = inst.operands[inst.operands.length - 1]; // Last one
                    const adr = this.getOperandValue(adrOperand, romInst.operandBytes);
                    this.registers.pc = adr;
                    inst.cycles = adrOperand === Operand.HLP ? 4 : 16;
                } else {
                    inst.cycles = 12;
                }
                break;
            }
            case Opcode.RET: {
                const noConditions = inst.operands.length === 0;
                if (noConditions || this.getFlagCondition(inst.operands[0])) {
                    const values = this.memory.readMultiple(this.registers.sp);
                    this.registers.pc = (values[0] << 8) + values[1];
                    this.registers.sp += 2;
                    inst.cycles = noConditions ? 16 : 20;
                } else {
                    inst.cycles = 8;
                }
                break;
            }
            case Opcode.RETI: {
                const values = this.memory.readMultiple(this.registers.sp);
                this.registers.pc = (values[0] << 8) + values[1];
                this.registers.sp += 2;
                this.memory.ir = 0x1;
                break;
            }
            case Opcode.CALL: {
                const noConditions = inst.operands.length === 1;
                if (noConditions || this.getFlagCondition(inst.operands[0])) {
                    const a16 = this.getOperandValue(Operand.a16, romInst.operandBytes);
                    this.memory.writeTwoBytes(this.registers.sp - 2, this.registers.pc);
                    this.registers.sp -= 2;
                    this.registers.pc = a16;
                    inst.cycles = 24;
                } else {
                    inst.cycles = 12;
                }
                break;
            }
            case Opcode.RST: {
                this.memory.writeTwoBytes(this.registers.sp - 2, this.registers.pc);
                this.registers.sp -= 2;
                const hValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                this.registers.pc = 0x0000 + hValue;
                break;
            }

            // CB instructions
            case Opcode.RLC: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const oldABit7: number = getBit(oldValue, 7);
                let newValue = (oldValue << 1) | oldABit7;
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue & 0xFF);
                this.registers.setZeroFlag(newValue & 0xFF);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit7 > 0;
                break;
            }
            case Opcode.RL: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const oldABit7: number = getBit(oldValue, 7);
                const newBit0 = this.registers.flagC ? 1 : 0;
                let newValue = (oldValue << 1) | newBit0;
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue & 0xFF);
                this.registers.setZeroFlag(newValue & 0xFF);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit7 > 0;
                break;
            }
            case Opcode.RRC: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const oldABit0: number = getBit(oldValue, 0);
                let newValue = (oldValue >> 1) | (oldABit0 << 7);
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue);
                this.registers.setZeroFlag(newValue);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit0 > 0;
                break;
            }
            case Opcode.RR: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const oldABit0: number = getBit(oldValue, 0);
                const newBit7 = this.registers.flagC ? 1 : 0;
                let newValue = (oldValue >> 1) | (newBit7 << 7);
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue);
                this.registers.setZeroFlag(newValue);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit0 > 0;
                break;
            }
            case Opcode.SLA: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const oldABit7: number = getBit(oldValue, 7);
                let newValue = (oldValue << 1);
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue & 0xFF);
                this.registers.setZeroFlag(newValue & 0xFF);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit7 > 0;
                break;
            }
            case Opcode.SRA: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const oldABit0: number = getBit(oldValue, 0);
                const oldABit7: number = getBit(oldValue, 7);
                let newValue = (oldValue >> 1) | (oldABit7 << 7);
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue);
                this.registers.setZeroFlag(newValue);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit0 > 0;
                break;
            }
            case Opcode.SRL: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const oldABit0: number = getBit(oldValue, 0);
                let newValue = (oldValue >> 1);
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue);
                this.registers.setZeroFlag(newValue);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = oldABit0 > 0;
                break;
            }
            case Opcode.SWAP: {
                const oldValue = this.getOperandValue(inst.operands[0], romInst.operandBytes);
                const upperBits = getBits(oldValue, 4, 4);
                const lowerBits = getBits(oldValue, 0, 4);
                const newValue = (lowerBits << 4) + upperBits;
                this.setOperand(inst.operands[0], romInst.operandBytes, newValue);
                this.registers.setZeroFlag(newValue);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = false;
                break;
            }
            case Opcode.BIT: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.registers.flagZ = getBit(currentRegValue, bitIndex) === 0;
                this.registers.flagN = false;
                this.registers.flagH = true;
                break;
            }
            case Opcode.RES: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.registers.set(inst.operands[1], modifyBit(currentRegValue, bitIndex, 0));
                break;
            }
            case Opcode.SET: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.registers.set(inst.operands[1], modifyBit(currentRegValue, bitIndex, 1));
                break;
            }

            default:
                break;
        }

        if (this.enableInterruptsNext && inst.op !== Opcode.EI) {
            this.memory.ir = 0x1;
        }
        // PROGRESS:
        // DONE:
            // NOP, EI, DI
            // LD, LDH, POP, PUSH, ADD, ADC, SUB, SBC, AND, XOR, OR, CP,
            // DAA, SCF, CPL, CCF,
            // RET, RETI, JP, JR, CALL, RST,
            // BIT, RES, SET, RLCA, RLA, RRCA, RCA, RLC, RRC, RL, RR, SLA, SRA, SWAP, SRL
        // SKIPPED:
            // 0x10 - STOP - implement cycles and stuff first, research (something with low power standby mode)
            // 0x76 - HALT - needs research (interrupts, probably)
    }

    /**
     * Gets the number from given operand
     * @param op Operand to get via
     * @param operandBytes Operand bytes, expected in big endian.
     */
    private getOperandValue(op: Operand, operandBytes: number[]): number {
        switch (op) {
            case Operand.d8:
                return operandBytes[0];
            case Operand.d16:
            case Operand.a16:
                return (operandBytes[0] << 8) + operandBytes[1];
            case Operand.a16P:
                return this.memory.read((operandBytes[0] << 8) + operandBytes[1]);
            case Operand.a8P:
                return this.memory.read(0xFF00 + operandBytes[0]);
            case Operand.r8:
                return operandBytes[0] > 127 ? -(256 - operandBytes[0]) : operandBytes[0];
            case Operand.BCP:
            case Operand.DEP:
            case Operand.HLP:
                return this.memory.read(this.registers.get(op));
            case Operand.CP:
                return this.memory.read(0xFF00 + this.registers.c);
            case Operand.H00:
            case Operand.H08:
            case Operand.H10:
            case Operand.H18:
            case Operand.H20:
            case Operand.H28:
            case Operand.H30:
            case Operand.H38:
                return op - 200;
            default:
                return this.registers.get(op);
        }
    }

    /**
     * Set the given value to given operand
     * @param op Operand to set
     * @param operandBytes Operand bytes, expected in big endian.
     * @param value New value of the operand.
     */
    private setOperand(op: Operand, operandBytes: number[], value: number) {
        switch (op) {
            case Operand.a16P:
                return this.memory.writeTwoBytes((operandBytes[0] << 8) + operandBytes[1], value);
            case Operand.a8P:
                return this.memory.write(0xFF00 + operandBytes[0], value);
            case Operand.BCP:
            case Operand.DEP:
            case Operand.HLP:
                return this.memory.write(this.registers.get(op), value);
            case Operand.CP:
                return this.memory.write(0xFF00 + this.registers.c, value);
            default:
                return this.registers.set(op, value);
        }
    }

    /**
     * Checks whether the given operand contains a 8 bit value
     * @param op Operand
     */
    private isOperand8bit(op: Operand): boolean {
        switch (op) {
            case Operand.A:
            case Operand.B:
            case Operand.C:
            case Operand.D:
            case Operand.E:
            case Operand.H:
            case Operand.L:
            case Operand.CP:
            case Operand.HLP:
            case Operand.BCP:
            case Operand.DEP:
            case Operand.a8P:
            case Operand.a16P:
            case Operand.d8:
            case Operand.r8:
                return true;
            default:
                return false;
        }
    }

    private getFlagCondition(op: Operand): boolean {
        return (
            op === Operand.FlagNZ && !this.registers.flagZ
            || op === Operand.FlagZ && this.registers.flagZ
            || op === Operand.FlagNC && !this.registers.flagC
            || op === Operand.FlagC && this.registers.flagC
        );
    }

    private dumpOperandsAndRegisters(inst: RomInstruction, title: string) {
        let store = [];
        const operands: Operand[] = inst.instruction.operands;
        for (let operand of operands) {
            store[Operand[operand]] = this.getOperandValue(operand, inst.operandBytes);
        }
        console.log(title, store, this.registers);
    }

    private printCurrentInstruction(inst: RomInstruction) {
        const addLog: string = '0x' + this.registers.pc.toString(16);
        console.log(addLog + ': processing instruction: ' + inst.readable.toString());
    }

}