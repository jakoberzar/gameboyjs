import * as CONSTANTS from './constants';
import { bytesToInstruction, Instruction, ReadableInstruction } from './instructions';

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

    // First 150 bytes have additional meaning.
    // 0x0000 - 0x0060 contains mostly vectors for jumps and stuff
    // ------------------------------------------------------------
    // Location | Meaning
    // ------------------------------------------------------------
    // 0x0000   | Restart $00 Address (RST $00 calls this address.)
    // 0x0008   | Restart $08 Address (RST $08 calls this address.)
    // 0x0010   | Restart $10 Address (RST $10 calls this address.)
    // 0x0018   | Restart $18 Address (RST $18 calls this address.)
    // 0x0020   | Restart $20 Address (RST $20 calls this address.)
    // 0x0028   | Restart $28 Address (RST $28 calls this address.)
    // 0x0030   | Restart $30 Address (RST $30 calls this address.)
    // 0x0038   | Restart $38 Address (RST $38 calls this address.)
    // 0x0040   | Vertical Blank Interrupt Start Address
    // 0x0048   | LCDC Status Interrupt Start Address
    // 0x0050   | Timer Overflow Interrupt Start Address
    // 0x0058   | Serial Transfer Completion Interrupt Start Address
    // 0x0060   | High-to-Low of P10-P13 Interrupt Start Address
    // ------------------------------------------------------------

    // An internal information area is located at 0100-014F in each cartridge.
    // ------------------------------------------------------------
    // Location        | Meaning
    // ------------------------------------------------------------
    // 0x0100 - 0x0103 | This is the begin code execution point in a cart.
    //                 | Usually there is a NOP and a JP instruction here but not always.
    // 0x0104 - 0x0133 | Scrolling Nintendo graphic, in CONSTANTS.nintendoSplashGraphic.
    //                 | (Rom shouldn't run if changed)
    // 0x0134 - 0x0142 | Title of the game in UPPER CASE ASCII.
    //                 | If it is less than 16 characters, the remaining bytes are filled with 00's.
    // 0x0143          | $80 = Color GB, $00 or other = not Color GB
    // 0x0144          | Ascii hex digit, high nibble of licensee code (new).
    // 0x0145          | Ascii hex digit, low nibble of licensee code (new).
    //                 | (These are normally $00 if [$014B] <> $33.)
    // 0x0146          | GB/SGB Indicator (00 = GameBoy, 03 = Super GameBoy functions)
    //                 | (Super GameBoy functions won't work if <> $03.)
    // 0x147           | Cartridge type
    // 0x148           | ROM size
    // 0x149           | RAM size
    // 0x14A           | Destination code: 0 - Japanese, 1 - Non Japanese
    // 0x014B          | License code (old)
    // 0x014C          | Mask ROM Version number (usually $00)
    // 0x014D          | Complement check (Rom shouldn't run on GB if not correct)
    // 0x014E - 0x14F  | Checksum (higher byte first) produced by adding all bytes of a cartridge,
    //                 | except for two checksum bytes and taking two lower bytes of the result.
    //                 | (GameBoy ignores this value.)

    // TODO: Implement cartridge types in an array
        // 0 - ROM ONLY
        // 1 - ROM + MBC1
        // 2 - ROM + MBC1 + RAM
        // 3 - ROM + MBC1 + RAM + BATT
        // 5 - ROM + MBC2
        // 6 - ROM + MBC2 + BATTERY
        // 8 - ROM + RAM
        // 9 - ROM + RAM + BATTERY
        // B - ROM + MMM01
        // C - ROM + MMM01 + SRAM
        // D - ROM + MMM01 + SRAM + BATT
        // F - ROM + MBC3 + TIMER + BATT
        // 10 - ROM + MBC3 + TIMER + RAM + BATT
        // 11 - ROM + MBC3
        // 12 - ROM + MBC3 + RAM
        // 13 - ROM + MBC3 + RAM + BATT
        // 19 - ROM + MBC5
        // 1A - ROM + MBC5 + RAM
        // 1B - ROM + MBC5 + RAM + BATT
        // 1C - ROM + MBC5 + RUMBLE
        // 1D - ROM + MBC5 + RUMBLE + SRAM
        // 1E - ROM + MBC5 + RUMBLE + SRAM + BATT
        // 1F - Pocket Camera
        // FD - Bandai TAMA5
        // FE - Hudson HuC-3
        // FF - Hudson HuC-1

    // TODO: Implement rom size
        // 0 - 256Kbit = 32KByte = 2 banks
        // 1 - 512Kbit = 64KByte = 4 banks
        // ...
        // 6 - 16Mbit = 2MByte = 128 banks
        // 0x52 - 9Mbit = 1.1MByte = 72 banks
        // 0x53 - 10Mbit = 1.2MByte = 80 banks
        // 0x54 - 12Mbit = 1.5MByte = 96 banks

    decodeHeaders() {
        // TODO
    }
}