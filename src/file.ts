import * as _ from "es6-promise";
import { bytesToInstruction, Instruction, ReadableInstruction } from './instructions';

export class ByteFileReader {
    /**
     * Loads the file into the file field.
     */
    static loadFile(filename: string): Promise<Rom> {
        return new Promise<Rom>((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open("GET", filename, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = (oEvent) => {
                let arrayBuffer = oReq.response;
                if (arrayBuffer) {
                    resolve(new Rom(new Uint8Array(arrayBuffer)));
                }
            };
            oReq.send(null);
        });
    }
}

export interface RomInstruction {
    address: number;
    instruction: Instruction;
    bytes: number[];
    readable?: ReadableInstruction;
}

export class Rom {
    private instructions: RomInstruction[] = [];
    private instructionAddresses: number[] = [];
    constructor(private file: Uint8Array) {}

    /** Gets the byte at given index */
    at(index: number): number {
        return this.file[index];
    }

    /**
     * Gets the instruction at given index
     * @param {number} index Memory (rom address)
     * @return {RomInstruction} Instruction or null (if no instruction at that address)
     */
    instAt(index: number): RomInstruction {
        return this.instructionAddresses.indexOf(index) === -1 ? null : this.instructions[index];
    }

    /** Takes the amount number of bytes at given index */
    take(index: number, amount: number): number[] {
        let bytes: number[] = [];
        this.file.slice(index, index + amount).forEach((x) => { bytes.push(x); });
        while (bytes.length < amount) bytes.push(0x00);
        return bytes;
    }

    /** Goes through the rom and decodes instructions */
    makeInstructions(): Promise<void> {
        return new Promise<void>((resolve) => {
            let position = 0;
            while (position < this.file.length) {
                let myBytes = this.take(position, 3);
                let instr: Instruction = bytesToInstruction(myBytes);
                let romInstr = {
                    address: position,
                    bytes: myBytes.slice(0, instr.byteLength),
                    instruction: instr,
                    readable: new ReadableInstruction(instr, myBytes),
                };
                this.instructionAddresses.push(position);
                for (let i = 0; i < instr.byteLength; i++) {
                    this.instructions.push(romInstr);
                }
                position += instr.byteLength;
            }
            resolve();
        });
    }
}