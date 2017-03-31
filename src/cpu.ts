import { Rom, RomInstruction } from './file';
import { getBit, modifyBit } from './helpers';
import { BasicIns, Instruction, Operand } from './instructions';
import { Memory } from './memory';
import { Registers } from './registers';
export class CPU {
    registers: Registers;
    memory: Memory;
    rom: Rom;
    constructor(registers?: Registers, memory?: Memory) {
        this.registers = new Registers();
        this.memory = new Memory();

        this.registers.set(Operand.PC, 0x151);
        console.log('The CPU has been initialized!');
    }

    setRom(rom: Rom) {
        this.rom = rom;
    }
    readNext() {
        const currentPC: number = this.registers.pc;
        const currentInst: RomInstruction = this.rom.instAt(currentPC);
        this.processInstruction(currentInst);
        this.registers.increasePC(currentInst.instruction.byteLength);
    }

    processInstruction(romInst: RomInstruction) {
        const inst = romInst.instruction;
        const basic = inst.op;
        switch (basic) {
            case BasicIns.NOP:
                break;
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
            case BasicIns.JR: {
                const conditionPassed = inst.byteLength === 3 && (
                       inst.operands[0] === Operand.NZ && !this.registers.flagZ
                    || inst.operands[0] === Operand.Z && this.registers.flagZ
                    || inst.operands[0] === Operand.NC && !this.registers.flagC
                    || inst.operands[0] === Operand.C && this.registers.flagC
                );
                if (inst.byteLength === 2 || conditionPassed) {
                    this.registers.increasePC(romInst.bytes[1] - inst.byteLength);
                    // -bytes to account for length of this instruction
                    // (auto increment of PC after each instruction)
                }
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
                // Could be optimized to take A or HL for first operand
                const current: number = this.registers.get(inst.operands[0]);
                const newVal: number = current + this.get8BitOperand(inst.operands[1], romInst.bytes);
                this.registers.set(inst.operands[0], newVal);
                break;
            }
            case BasicIns.ADC: {
                // Could be optimized to take A  first operand
                const flagVal = this.registers.flagC ? 1 : 0;
                this.registers.a += this.get8BitOperand(inst.operands[1], romInst.bytes) + flagVal;
                break;
            }
            case BasicIns.SUB: {
                this.registers.a -= this.get8BitOperand(inst.operands[1], romInst.bytes);
                break;
            }
            case BasicIns.SBC: {
                const flagVal = this.registers.flagC ? 1 : 0;
                this.registers.a -= (this.get8BitOperand(inst.operands[1], romInst.bytes) + flagVal);
                break;
            }
            case BasicIns.AND: {
                this.registers.a = this.registers.a & this.get8BitOperand(inst.operands[1], romInst.bytes);
                break;
            }
            case BasicIns.XOR: {
                this.registers.a = this.registers.a ^ this.get8BitOperand(inst.operands[1], romInst.bytes);
                break;
            }
            case BasicIns.OR: {
                this.registers.a = this.registers.a | this.get8BitOperand(inst.operands[1], romInst.bytes);
                break;
            }


            // Special commands
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
            // 0xCX - RET - BLOCKED, implement pointer operands, needs research?

    }

    private get8BitOperand(op: Operand, bytes: number[]): number {
        if (op === Operand.d8) {
            return bytes[1];
        } else {
            return this.registers.get(op);
        }
    }

}