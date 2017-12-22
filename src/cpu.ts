import * as CONSTANTS from './constants';
import { getBit, modifyBit } from './helpers';
import { Instruction, Opcode, Operand } from './instructions';
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

export class CPU {
    registers: Registers;
    memory: Memory;
    rom: Rom;

    state: MachineState;

    frequency = 4194304; // Original is 4.194304 MHz, but often divided by four with instruction cycles.

    displayFps = 59.73; // V-Blank frequency
    availableTimeFrame = 16 * 16; // 16.74 ms; Roughly 1000 / 59.73
    cyclesPerFrame = 70221; // How many cpu cycles need to be executed every frame.

    queuedExecutes = 0;

    debugging: boolean = false;
    executedLog: Log[] = [];

    constructor(registers = new Registers(), memory = new Memory()) {
        this.registers = registers;
        this.memory = memory;

        // GB sets the PC to 0x151 at start up
        this.registers.set(Operand.PC, CONSTANTS.bootPCValue);
        this.state = {
            running: false,
            lastExecuted: null,
        };

        console.log('The CPU has been initialized!');
    }

    setRom(rom: Rom) {
        this.rom = rom;
        this.memory.setRom(rom);
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
    }

    readNext() {
        const currentInst: RomInstruction = this.memory.getInstructionAt(this.registers.pc);
        const len = currentInst.instruction.byteLength;

        // DEPRECATED
        // let currentInst: RomInstruction = this.rom.instAt(this.registers.pc);
        // // As currently not all instructions are executed properly, we might
        // // get wrong PC addresses. That's why we do a bit of searching for now.
        // let tries = 0;
        // while (currentInst == null) {
        //     // TODO: Remove when all instructions implemented!!!!
        //     if (tries === 4) {
        //         this.registers.pc = Math.abs(Math.ceil(Math.random() * 0x3FF));
        //     } else if (tries === 10) {
        //         this.registers.pc = CONSTANTS.bootPCValue;
        //     }
        //     this.registers.pc++;
        //     currentInst = this.rom.instAt(this.registers.pc);
        //     tries++;
        // }

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

    processInstruction(romInst: RomInstruction) {
        const inst = romInst.instruction;
        const opcode = inst.op;
        switch (opcode) {
            // Misc, control instructions
            case Opcode.NOP:
                break;

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
                this.registers.set(inst.operands[0], this.memory.read(this.registers.sp));
                this.registers.sp += 2;
                break;
            }
            case Opcode.PUSH: {
                this.memory.write(this.registers.sp, this.registers.get(inst.operands[0]));
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

                this.registers.setZeroFlag(this.registers.a);
                this.registers.flagN = false;
                this.registers.flagH = true;
                this.registers.flagC = false;

                break;
            }
            case Opcode.XOR: {
                this.registers.a = this.registers.a ^ this.getOperandValue(inst.operands[0], romInst.operandBytes);

                this.registers.setZeroFlag(this.registers.a);
                this.registers.flagN = false;
                this.registers.flagH = false;
                this.registers.flagC = false;

                break;
            }
            case Opcode.OR: {
                this.registers.a = this.registers.a | this.getOperandValue(inst.operands[0], romInst.operandBytes);

                this.registers.setZeroFlag(this.registers.a);
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

            // Rotations, shifts
            case Opcode.RLCA: {
                const oldABit7: number = getBit(this.registers.a, 7);
                this.registers.flagC = oldABit7 > 0;
                this.registers.a = this.registers.a << 1;
                break;
            }
            case Opcode.RRCA: {
                const oldABit0: number = getBit(this.registers.a, 0);
                this.registers.flagC = oldABit0 > 0;
                this.registers.a = this.registers.a >> 1;
                break;
            }

            // CB instructions
            case Opcode.BIT: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.registers.get(inst.operands[1]);
                this.registers.flagZ = getBit(currentRegValue, bitIndex) > 0;
                this.registers.flagN = false;
                this.registers.flagH = true;
                break;
            }
            case Opcode.RES: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.registers.get(inst.operands[1]);
                this.registers.set(inst.operands[1], modifyBit(currentRegValue, bitIndex, 0));
                break;
            }
            case Opcode.SET: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.registers.get(inst.operands[1]);
                this.registers.set(inst.operands[1], modifyBit(currentRegValue, bitIndex, 1));
                break;
            }

            // Special arithmetic instructions
            case Opcode.SCF: { // Set carry flag
                this.registers.flagC = true;
                this.registers.flagH = false;
                this.registers.flagN = false;
                break;
            }
            case Opcode.CPL: { // Complement register a
                this.registers.a = this.registers.a ^ 0xFF;
                this.registers.flagN = true;
                this.registers.flagH = true;
                break;
            }
            case Opcode.CCF: { // Complement c flag
                this.registers.flagC = !this.registers.flagC;
                this.registers.flagN = false;
                this.registers.flagH = false;
                break;
            }

            // Jumps, calls
            // TODO: FIX CYCLES - IF EXECUTED, 12, ELSE 8
            case Opcode.JR: {
                const conditionPassed = inst.byteLength === 3 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 2 || conditionPassed) {
                    this.registers.increasePC(romInst.operandBytes[0] - inst.byteLength);
                    // -bytes to account for length of this instruction
                    // (auto increment of PC after each instruction)
                }
                break;
            }
            case Opcode.JP: {
                const conditionPassed = inst.byteLength === 2 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 1 || conditionPassed) {
                    if (inst.operands[1] === Operand.a16) {
                        this.registers.pc = romInst.operandBytes[0] << 8 + romInst.operandBytes[1];
                    }
                }
                break;
            }
            case Opcode.RET: {
                const conditionPassed = inst.operands.length === 1 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 1 || conditionPassed) {
                    this.registers.pc = this.memory.read(this.registers.sp);
                    this.registers.sp += 2;
                }
                break;
            }
            case Opcode.CALL: {
                const conditionPassed = inst.operands.length === 2 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 1 || conditionPassed) {
                    this.registers.sp -= 2;
                    // this.memory.set(this.registers.sp, this.registers.pc + inst.byteLength)
                    this.registers.pc = romInst.operandBytes[0] << 8 + romInst.operandBytes[1];
                }
                break;
            }
            case Opcode.RST: {
                this.registers.sp -= 2;
                // this.memory.set(this.registers.sp, this.registers.pc + inst.byteLength)
                // const hOperandValue = inst.operands[0] - 200; // H operands have value if - 200
                // this.registers.pc = hOperandValue;
                break;
            }

            default:
                break;
        }
        // PROGRESS:
        // DONE:
            // NOP, LD, LDH, POP, PUSH, ADD, ADC, SUB, SBC, AND, XOR, OR, CP
            // 0x37 - SCF
            // 0x2F - CPL
            // 0x3F - CCF
            // 0xC0, 0xD0, 0xC8, 0xD8, 0xC9 - RET
            // 0xC2, 0xD2, 0xC3, 0xC9, 0D9 - JP
            // 0xCB BIT, RES, SET
        // PARTLY:
            // 0x07 - RLCA - NEEDS TEST
            // 0x0F - RRCA - NEEDS TEST
            // 0x88+ - ADC - NEEDS TEST
            // 0x98+ - SBC - NEEDS TEST
        // SKIPPED:
            // 0x10 - STOP - implement cycles and stuff first, research (something with low power standby mode)
            // 0x17 - RLA - needs research (similar to RLCA)
            // 0x1F - RRA - needs research (similar to RRA)
            // 0x27 - DAA - needs research (something with adjusting BCD, decimal)
            // 0x76 - HALT - needs research (interrupts, probably)
            // 0xE9 - JP (HL) - BLOCKED, impement pointer operands
            // 0xC4, 0xD4, 0xCC, 0xDC, 0xCD - CALL - BLOCKED, needs writing to memory
            // 0xC7, 0xD7, 0xE7, 0xF7, 0xCF, 0xDF, 0xEF, 0xFF - RST - BLOCKED, needs writing to memory
            // 0xD9 - RETI - BLOCKED, needs interrupts
            // 0xF3 - DI - BLOCKED, needs interrupts
            // 0xEA, 0xFA - BLOCKED, implement pointer operands
            // 0xF8 - EI - BLOCKED, needs interrupts
            // 0xCB 0x0x - 0xCB 0x3x - bit rotations and stuff, similar to rla and stuff I think, needs research
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
                return operandBytes[0] > 0x127 ? -(256 - operandBytes[0]) : operandBytes[0];
            case Operand.BCP:
            case Operand.DEP:
            case Operand.HLP:
                return this.memory.read(this.registers.get(op));
            case Operand.CP:
                return this.memory.read(0xFF00 + this.registers.c);
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
            store[Operand[operand]] = this.registers.get(operand);
        }
        console.log(title, store, this.registers);
    }

    private printCurrentInstruction(inst: RomInstruction) {
        const addLog: string = '0x' + this.registers.pc.toString(16);
        console.log(addLog + ': processing instruction: ' + inst.readable.toString());
    }

}