import * as CONSTANTS from './constants';
import { getBit, modifyBit } from './helpers';
import { BasicIns, Instruction, Operand } from './instructions';
import { Memory } from './memory';
import { Registers } from './registers';
import { Rom, RomInstruction } from './rom';

interface Log {
    pc: number;
    inst: RomInstruction;
}
export class CPU {
    registers: Registers;
    memory: Memory;
    rom: Rom;

    debugging: boolean = false;
    executedLog: Log[] = [];

    constructor(registers?: Registers, memory?: Memory) {
        // TODO: Check parameters?
        this.registers = new Registers();
        this.memory = new Memory();

        // GB sets the PC to 0x151 at start up
        this.registers.set(Operand.PC, CONSTANTS.bootPCValue);

        console.log('The CPU has been initialized!');
    }

    setRom(rom: Rom) {
        this.rom = rom;
    }

    readNext() {
        let currentInst: RomInstruction = this.rom.instAt(this.registers.pc);

        // As currently not all instructions are executed properly, we might
        // get wrong PC addresses. That's why we do a bit of searching for now.
        let tries = 0;
        while (currentInst == null) {
            // TODO: Remove when all instructions implemented!!!!
            if (tries === 4) {
                this.registers.pc = Math.abs(Math.ceil(Math.random() * 0x3FF));
            } else if (tries === 10) {
                this.registers.pc = CONSTANTS.bootPCValue;
            }
            this.registers.pc++;
            currentInst = this.rom.instAt(this.registers.pc);
            tries++;
        }

        if (this.debugging) {
            this.printCurrentInstruction(currentInst);
            this.dumpOperandsAndRegisters(currentInst, 'Before');
        }

        this.processInstruction(currentInst);

        if (this.debugging) {
            this.dumpOperandsAndRegisters(currentInst, 'After');
        }

        this.executedLog.push({pc: this.registers.pc, inst: currentInst});

        this.registers.increasePC(currentInst.instruction.byteLength);
    }

    processInstruction(romInst: RomInstruction) {
        const inst = romInst.instruction;
        const basic = inst.op;
        switch (basic) {
            // Misc, control instructions
            case BasicIns.NOP:
                break;

            // Load, store, move instructions
            case BasicIns.LD: {
                let value: number = 0;
                if (inst.operands[1] === Operand.d16) {
                    value = (romInst.bytes[1] << 8) + romInst.bytes[2];
                } else if (inst.operands[2] === Operand.d8) {
                    value = romInst.bytes[1];
                } else {
                    value = this.registers.get(inst.operands[1]);
                }

                this.registers.set(inst.operands[0], value);
                break;
            }
            case BasicIns.LDH: {
                if (inst.operands[0] === Operand.A) {
                    this.registers.a = 0xFF00 + romInst.bytes[1];
                }
                break;
            }
            case BasicIns.POP: {
                this.registers.set(inst.operands[0], this.memory.at(this.registers.sp));
                this.registers.sp += 2;
                break;
            }
            case BasicIns.PUSH: {
                // Implement writing to memory!
                // this.memory.set(this.registers.sp, this.registers.get(inst.operands[0]))
                break;
            }

            // Arithmetic and logical instructions
            case BasicIns.INC:
                this.registers.increase(inst.operands[0], 1);
                break;
            case BasicIns.DEC:
                this.registers.increase(inst.operands[0], -1);
                break;
            case BasicIns.ADD: {
                const current: number = this.registers.get(inst.operands[0]);
                const newVal: number = current + this.get8BitOperand(inst.operands[1], romInst.bytes);
                this.registers.set(inst.operands[0], newVal);
                break;
            }
            case BasicIns.ADC: {
                const flagVal = this.registers.flagC ? 1 : 0;
                this.registers.a += this.get8BitOperand(inst.operands[1], romInst.bytes) + flagVal;
                break;
            }
            case BasicIns.SUB: {
                this.registers.a -= this.get8BitOperand(inst.operands[0], romInst.bytes);
                break;
            }
            case BasicIns.SBC: {
                const flagVal = this.registers.flagC ? 1 : 0;
                this.registers.a -= (this.get8BitOperand(inst.operands[1], romInst.bytes) + flagVal);
                break;
            }
            case BasicIns.AND: {
                this.registers.a = this.registers.a & this.get8BitOperand(inst.operands[0], romInst.bytes);
                break;
            }
            case BasicIns.XOR: {
                this.registers.a = this.registers.a ^ this.get8BitOperand(inst.operands[0], romInst.bytes);
                break;
            }
            case BasicIns.OR: {
                this.registers.a = this.registers.a | this.get8BitOperand(inst.operands[0], romInst.bytes);
                break;
            }

            // Rotations, shifts
            case BasicIns.RLCA: {
                const oldABit7: number = getBit(this.registers.a, 7);
                this.registers.flagC = oldABit7 > 0;
                this.registers.a = this.registers.a << 1;
                break;
            }
            case BasicIns.RRCA: {
                const oldABit0: number = getBit(this.registers.a, 0);
                this.registers.flagC = oldABit0 > 0;
                this.registers.a = this.registers.a >> 1;
                break;
            }

            // CB instructions
            case BasicIns.BIT: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.registers.get(inst.operands[1]);
                this.registers.flagZ = getBit(currentRegValue, bitIndex) > 0;
                this.registers.flagN = false;
                this.registers.flagH = true;
                break;
            }
            case BasicIns.RES: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.registers.get(inst.operands[1]);
                this.registers.set(inst.operands[1], modifyBit(currentRegValue, bitIndex, 0));
                break;
            }
            case BasicIns.SET: {
                const bitIndex = inst.operands[0] - 100;
                const currentRegValue = this.registers.get(inst.operands[1]);
                this.registers.set(inst.operands[1], modifyBit(currentRegValue, bitIndex, 1));
                break;
            }

            // Special arithmetic instructions
            case BasicIns.SCF: { // Set carry flag
                this.registers.flagC = true;
                this.registers.flagH = false;
                this.registers.flagN = false;
                break;
            }
            case BasicIns.CPL: { // Complement register a
                this.registers.a = this.registers.a ^ 0xFF;
                this.registers.flagN = true;
                this.registers.flagH = true;
                break;
            }
            case BasicIns.CCF: { // Complement c flag
                this.registers.flagC = !this.registers.flagC;
                this.registers.flagN = false;
                this.registers.flagH = false;
                break;
            }

            // Jumps, calls
            case BasicIns.JR: {
                const conditionPassed = inst.byteLength === 3 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 2 || conditionPassed) {
                    this.registers.increasePC(romInst.bytes[1] - inst.byteLength);
                    // -bytes to account for length of this instruction
                    // (auto increment of PC after each instruction)
                }
                break;
            }
            case BasicIns.JP: {
                const conditionPassed = inst.byteLength === 2 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 1 || conditionPassed) {
                    if (inst.operands[1] === Operand.a16) {
                        this.registers.pc = romInst.bytes[1] << 8 + romInst.bytes[2];
                    }
                }
                break;
            }
            case BasicIns.RET: {
                const conditionPassed = inst.operands.length === 1 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 1 || conditionPassed) {
                    this.registers.pc = this.memory.at(this.registers.sp);
                    this.registers.sp += 2;
                }
                break;
            }
            case BasicIns.CALL: {
                const conditionPassed = inst.operands.length === 2 && this.getFlagCondition(inst.operands[0]);
                if (inst.byteLength === 1 || conditionPassed) {
                    this.registers.sp -= 2;
                    // this.memory.set(this.registers.sp, this.registers.pc + inst.byteLength)
                    this.registers.pc = romInst.bytes[1] << 8 + romInst.bytes[2];
                }
                break;
            }
            case BasicIns.RST: {
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
            // 0x00 - NOP
            // 0x01, 0x11, 0x21, 0x31 - LD x, d16
            // 0x03, 0x13, 0x23, 0x33 - INC
            // 0x04, 0x14, 0x24 - INC
            // 0x05, 0x15, 0x25 - DEC
            // 0x06, 0x16, 0x26 - LD x, d8
            // 0x09, 0x19, 0x29, 0x39 - ADD HL, x
            // 0x0B, 0x1B, 0x2B, 0x3B - DEC x
            // 0x0C, 0x1C, 0x2C, 0x3C - INC x
            // 0x0D, 0x1D, 0x2D, 0x3D - DEC x
            // 0x0E, 0x1E, 0x2E, 0x3E - LD x, d8
            // 0x18, 0x20, 0x28, 0x30, 0x38 - JR x, r8
            // 0x37 - SCF
            // 0x2F - CPL
            // 0x3F - CCF
            // 0x40 to 0x7F, LD. Excluding pointer operands and HALT
            // 0x8x - ADD
            // 0x9x - SUB
            // 0xAx - AND and XOR
            // 0xBx - OR
            // 0xC0, 0xD0, 0xC8, 0xD8, 0xC9 - RET
            // 0xC1, 0xD1, 0xE1, 0xF1 - POP
            // 0xC2, 0xD2, 0xC3, 0xC9, 0D9 - JP
            // 0xCB BIT, RES, SET
        // PARTLY:
            // 0x07 - RLCA - NEEDS TEST
            // 0x0F - RRCA - NEEDS TEST
            // 0x88+ - ADC - NEEDS TEST
            // 0x98+ - SBC - NEEDS TEST
        // SKIPPED:
            // 0x02, 0x12, 0x22, 0x32 - LD (x), A - BLOCKED, implement pointer operands
            // 0x34 - INC (HL) - BLOCKED, implement pointer operands
            // 0x35 - DEC (HL) - BLOCKED, implement pointer operands
            // 0x36 - LD (HL), d8 - BLOCKED, implement pointer operands
            // 0x08 - LD (a16), SP - BLOCKED, implement pointer operands
            // 0x0A, 0x1A, 0x2A, 0x3A - BLOCKED, implement pointer operands
            // 0x10 - STOP - implement cycles and stuff first, research (something with low power standby mode)
            // 0x17 - RLA - needs research (similar to RLCA)
            // 0x1F - RRA - needs research (similar to RRA)
            // 0x27 - DAA - needs research (something with adjusting BCD, decimal)
            // 0x76 - HALT - needs research (interrupts, probably)
            // 0xB8 - CP - needs flag research
            // 0xC5, 0xD5, 0xE5, 0xF5 - PUSH - BLOCKED, needs writing to memory
            // 0xE9 - JP (HL) - BLOCKED, impement pointer operands
            // 0xC4, 0xD4, 0xCC, 0xDC, 0xCD - CALL - BLOCKED, needs writing to memory
            // 0xC7, 0xD7, 0xE7, 0xF7, 0xCF, 0xDF, 0xEF, 0xFF - RST - BLOCKED, needs writing to memory
            // 0xD9 - RETI - BLOCKED, needs interrupts
            // 0xE0 - LDH a8, a - BLOCKED, needs writing to memory
            // 0xE2 - LD (C), a - BLOCKED, needs writing to memory
            // 0xF2 - LD a, (C) - BLOCKED, needs additional operands
            // 0xF3 - DI - BLOCKED, needs interrupts
            // 0xE8 - ADD SP,r8 - needs signed & unsigned javascript int research
            // 0xF8 - LD HL, SP+r8 - needs signed & unsigned javascript int research
            // 0xEA, 0xFA - BLOCKED, implement pointer operands
            // 0xF8 - EI - BLOCKED, needs interrupts
            // 0xCB 0x0x - 0xCB 0x3x - bit rotations and stuff, similar to rla and stuff I think, needs research
    }

    private get8BitOperand(op: Operand, bytes: number[]): number {
        if (op === Operand.d8) {
            return bytes[1];
        } else {
            return this.registers.get(op);
        }
    }

    private getFlagCondition(op: Operand): boolean {
        return (
            op === Operand.NZ && !this.registers.flagZ
            || op === Operand.Z && this.registers.flagZ
            || op === Operand.NC && !this.registers.flagC
            || op === Operand.C && this.registers.flagC
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