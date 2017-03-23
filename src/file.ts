import * as _ from 'es6-promise';
import { bytesToInstruction, Instruction, ReadableInstruction } from './instructions';

export class ByteFileReader {
    /**
     * Reads the Rom from a file given
     * @param  {string} filename Path to the file.
     * @returns {Promise<Rom>}
     */
    static loadFile(filename: string): Promise<Rom> {
        return new Promise<Rom>((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open('GET', filename, true);
            oReq.responseType = 'arraybuffer';
            oReq.onload = (oEvent) => {
                let arrayBuffer = oReq.response;
                if (arrayBuffer) {
                    resolve(new Rom(new Uint8Array(arrayBuffer)));
                } else {
                    reject('File is empty or does not exist!');
                }
            };
            oReq.onerror = (oEvent) => {
                reject({
                    event: oEvent,
                    message: 'There was an AJAX error!',
                    oreq: oReq,
                });
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

    /**
     * Gets the byte at given address
     * @param {number} index Address of the byte
     * @return {number} Single byte, value of 0-255
     */
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

    /**
     * Get a certain amount of bytes following some address
     * @param {number} index Address of byte to start from
     * @param {number} amount The number of bytes to take
     * @return {number[]} Data at given bytes, additional zeros if overbound.
     */
    take(index: number, amount: number): number[] {
        const bytes: number[] = [];
        let taken;
        for (taken = 0; this.file[index + taken] !== undefined && taken < amount; taken++) {
            bytes.push(this.file[index + taken]);
        }

        // Add any overbound zeros.
        for (let i = 0; i < amount - taken; i++) {
            bytes.push(0);
        }

        return bytes;
    }

    /**
     * Goes through the rom and decodes instructions
     * @return {Promise<void>}
     */
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