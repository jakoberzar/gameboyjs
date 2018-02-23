import * as CONSTANTS from './constants';
import { getBit, getBits, modifyBit } from './helpers';
import { Instruction, instructionToString, Opcode, Operand } from './instructions';
import { Memory } from './memory';
import { Registers } from './registers';
import { Rom, RomInstruction } from './rom';
import { Timer } from './timer';
import { Video } from './video';

interface Log {
    pc: number;
    inst: RomInstruction;
}

interface MachineState {
    running: boolean;
    stepMode: boolean;
    lastExecuted: RomInstruction;
    halted: boolean;
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
    video: Video;
    timer: Timer;

    state: MachineState;
    currentInstructions: RomInstruction[];
    currentInstructionRange: Range;

    breakpoints: number[];

    frequency = 4194304; // Original is 4.194304 MHz, but often divided by four with instruction cycles.

    displayFps = 59.727; // V-Blank frequency
    availableTimeFrame = 12; // 16.74 ms; Roughly 1000 / 59.73
    cyclesPerFrame = 70225; // How many cpu cycles need to be executed every frame.
    currentCyclesFrame = 0;

    queuedExecutes = 0;

    // Interrupts
    interruptMasterEnable = true;
    enableInterruptsNext = false;

    debugging: boolean = false;
    executedLog: Log[] = [];

    constructor(registers = new Registers(), memory = new Memory()) {
        this.registers = registers;
        this.memory = memory;

        this.video = new Video(this.memory);
        this.timer = new Timer(this.memory);
        this.memory.setIORegisters(this.video, this.timer);

        // GB sets the PC to 0x151 at start up
        // this.registers.set(Operand.PC, 0x00);
        this.registers.set(Operand.PC, CONSTANTS.bootPCValue);
        this.registers.set(Operand.PC, 0x100);
        this.state = {
            stepMode: false,
            running: false,
            lastExecuted: null,
            halted: false,
        };

        this.breakpoints = [];

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

    exitCurrent() {
        this.currentCyclesFrame = this.cyclesPerFrame;
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

            const timeoutTime = this.queuedExecutes > 10 ?
                this.availableTimeFrame * (this.queuedExecutes - 1) :
                this.availableTimeFrame;

            setTimeout(() => {
                if (!this.state.stepMode && this.breakpoints.length === 0) {
                    this.execute();
                }
            }, timeoutTime);
            this.queuedExecutes++;
        }

        this.currentCyclesFrame = 0;
        // Hacky :)
        if (!this.state.stepMode && this.breakpoints.length > 0) {
            this.currentCyclesFrame = -2000000;
            this.cyclesPerFrame = 2000000;
        }
        while (this.currentCyclesFrame < this.cyclesPerFrame) {
            const executed = this.readNext();
            this.currentCyclesFrame += executed.instruction.cycles;
        }
        this.maybeUpdateCurrentInstructions();
    }

    readNext() {
        const currentInst: RomInstruction = this.memory.getInstructionAt(this.registers.pc);
        const len = currentInst.instruction.byteLength;

        if (this.debugging) {
            // this.printCurrentInstruction(currentInst);
            // this.dumpOperandsAndRegisters(currentInst, 'Before');
        }

        // this.executedLog.push({pc: this.registers.pc, inst: currentInst});

        if (!this.state.halted) {
            this.registers.increasePC(currentInst.instruction.byteLength);
        }

        const oldPC = this.registers.pc;

        if (!this.state.halted) {
            this.processInstruction(currentInst);
        }

        const clocksPassed = this.state.halted ? 4 : currentInst.instruction.cycles;

        this.video.updateClock(clocksPassed);

        this.timer.updateClock(clocksPassed);

        this.handleInterrupts();

        const newPC = this.registers.pc;
        if (newPC !== oldPC) {
            // console.log('PC changed from 0x' + oldPC.toString(16) + ' to 0x' + newPC.toString(16));
            // if (newPC === 0) {
            //     console.log(currentInst);
            //     this.stop();
            //     console.log('Big PC change!');
            //     this.exitCurrent();
            //     debugger;
            // }
        }

        if (this.debugging) {
            // this.dumpOperandsAndRegisters(currentInst, 'After');
            if (this.breakpoints.some((x) => x === newPC)) {
                console.log('Breakpoint hit at ' + newPC.toString(16).toUpperCase() + 'h');
                this.exitCurrent();
            }
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
                this.interruptMasterEnable = false;
                console.log('DI', this.interruptMasterEnable);
                break;
            }
            case Opcode.HALT: {
                // gb-programming-manual.pdf page 112
                console.log('halted...');
                let intWaiting = this.memory.ie & this.memory.read(CONSTANTS.memoryConstants.INTERRUPT_FLAG_REGISTER);
                if (!intWaiting) {
                    this.state.halted = true;
                }
                break;
            }
            case Opcode.STOP: {
                // gb-programming-manual.pdf page 112
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
                this.registers.setHalfCarryAddition(this.registers.sp & 0xFF, r8 & 0xFF, 8);
                this.registers.setCarryAddition(this.registers.sp & 0xFF, r8 & 0xFF, 8);
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
                    if (inst.operands[0] === Operand.SP) {
                        this.registers.flagZ = false;
                        this.registers.setHalfCarryAddition(op1Val & 0xFF, op2Val & 0xFF, 8);
                        this.registers.setCarryAddition(op1Val & 0xFF, op2Val & 0xFF, 8);
                    } else {
                        this.registers.setHalfCarryAddition(op1Val, op2Val, 16);
                        this.registers.setCarryAddition(op1Val, op2Val, 16);
                    }
                }
                this.registers.set(inst.operands[0], result);
                break;
            }
            case Opcode.ADC: {
                const flagVal = this.registers.flagC ? 1 : 0;
                const op1Val: number = this.registers.a;
                const op2Val: number = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                let result = op1Val + op2Val + flagVal;
                result = result & 0xFF;

                this.registers.setZeroFlag(result);
                this.registers.flagN = false;
                this.registers.setHalfCarryAddition(op1Val, op2Val, 8);
                if (!this.registers.flagH) {
                    this.registers.setHalfCarryAddition(op1Val + op2Val, flagVal, 8);
                }
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
                const op2Val: number = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                let result = op1Val - op2Val - flagVal;
                result = result & 0xFF;

                this.registers.setZeroFlag(result);
                this.registers.flagN = true;
                this.registers.setHalfCarrySubtraction(op1Val, op2Val, 8);
                if (!this.registers.flagH && flagVal) {
                    this.registers.setHalfCarrySubtraction((op1Val - op2Val) & 0xFF, flagVal, 8);
                }
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
            case Opcode.DAA: {
                let n1 = getBits(this.registers.a, 4, 4);
                let n2 = getBits(this.registers.a, 0, 4);

                if (!this.registers.flagN) {
                    if (this.registers.a > 0x99 || this.registers.flagC) {
                        this.registers.a = (this.registers.a + 0x60) & 0xFF;
                        this.registers.flagC = true;
                    }
                    if (n2 > 0x9 || this.registers.flagH) {
                        this.registers.a = (this.registers.a + 0x06) & 0xFF;
                    }
                } else {
                    if (this.registers.flagC && this.registers.flagH) {
                        this.registers.a = (this.registers.a + 0x9A) & 0xFF;
                    } else if (this.registers.flagC) {
                        this.registers.a = (this.registers.a + 0xA0) & 0xFF;
                    } else if (this.registers.flagH) {
                        this.registers.a = (this.registers.a + 0xFA) & 0xFF;
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
                this.interruptMasterEnable = true;
                console.log('RETI', this.interruptMasterEnable);
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
                this.setOperand(inst.operands[1], romInst.operandBytes, modifyBit(currentRegValue, bitIndex, 0));
                break;
            }
            case Opcode.SET: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.getOperandValue(inst.operands[1], romInst.operandBytes);
                this.setOperand(inst.operands[1], romInst.operandBytes, modifyBit(currentRegValue, bitIndex, 1));
                break;
            }

            default:
                break;
        }

        if (this.enableInterruptsNext && inst.op !== Opcode.EI) {
            this.interruptMasterEnable = true;
            this.enableInterruptsNext = false;
            console.log('EI', this.interruptMasterEnable);
        }

        // PROGRESS:
        // DONE:
            // NOP, EI, DI
            // LD, LDH, POP, PUSH, ADD, ADC, SUB, SBC, AND, XOR, OR, CP,
            // DAA, SCF, CPL, CCF,
            // RET, RETI, JP, JR, CALL, RST,
            // BIT, RES, SET, RLCA, RLA, RRCA, RCA, RLC, RRC, RL, RR, SLA, SRA, SWAP, SRL
        // SKIPPED:
            // STOP, HALT - Looks like reachable code using it so far...
    }

    handleInterrupts() {
        if (this.interruptMasterEnable || this.state.halted) {
            let requested = this.memory.ie & this.memory.read(CONSTANTS.memoryConstants.INTERRUPT_FLAG_REGISTER);
            if (requested) {
                this.state.halted = false;

                if (this.interruptMasterEnable) {
                    let interruptIdx = 0;
                    while ((requested & 0x1) === 0) {
                        requested >>= 1;
                        interruptIdx++;
                    }

                    console.log('Interrupt', interruptIdx);

                    let interruptVector = 0x40 + interruptIdx * 0x8;

                    // Reset the interrupt request bit
                    const oldIF = this.memory.read(CONSTANTS.memoryConstants.INTERRUPT_FLAG_REGISTER);
                    const newIF = modifyBit(oldIF, interruptIdx, 0);
                    this.memory.write(CONSTANTS.memoryConstants.INTERRUPT_FLAG_REGISTER, newIF);

                    // Disable IME
                    this.interruptMasterEnable = false;

                    // Save PC
                    this.memory.writeTwoBytes(this.registers.sp - 2, this.registers.pc);
                    this.registers.sp -= 2;

                    // New PC
                    this.registers.pc = interruptVector;
                } else {
                    console.log('Exited halt');
                }

            }
        }
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
                return this.memory.read(this.registers.bc);
            case Operand.DEP:
                return this.memory.read(this.registers.de);
            case Operand.HLP:
                return this.memory.read(this.registers.hl);
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
                return this.memory.write((operandBytes[0] << 8) + operandBytes[1], value);
            case Operand.a16P2B:
                return this.memory.writeTwoBytes((operandBytes[0] << 8) + operandBytes[1], value);
            case Operand.a8P:
                return this.memory.write(0xFF00 + operandBytes[0], value);
            case Operand.BCP:
                return this.memory.write(this.registers.bc, value);
            case Operand.DEP:
                return this.memory.write(this.registers.de, value);
            case Operand.HLP:
                return this.memory.write(this.registers.hl, value);
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
            store[Operand[operand]] = this.getOperandValue(operand, inst.operandBytes).toString(16).toUpperCase();
        }
        console.log(title, store, this.registers.getAllValues());
    }

    private printCurrentInstruction(inst: RomInstruction) {
        const addLog: string = '0x' + this.registers.pc.toString(16);
        console.log(addLog + ': processing instruction: ' + inst.readable.toString());
    }

}