import * as CONSTANTS from './constants';
import { bytesToInstruction, Instruction, ReadableInstruction } from './instructions';

export interface RomInstruction {
    address: number;
    instruction: Instruction;
    bytes: number[];
    readable?: ReadableInstruction;
}

export enum MemoryBankController {
    None, MBC1, MBC2, MBC3, MBC5, MMM01, TAMA5, HuC3, HuC1,
}

export interface CartridgeType {
    rom: boolean;
    mbc: MemoryBankController;
    ram: boolean;
    battery: boolean;
    timer: boolean;
    rumble: boolean;
}

export class Rom {
    // Headers:
    gameTitle: string;
    isColorGameBoy: boolean;
    usesNewLicenseCode: boolean;
    oldLicenseCode: number;
    newLicenseCode: string;
    cartridgeType: CartridgeType;
    romBanksAmount: number;
    ramBanksAmount: number;
    ramBankSize: number;
    isJapanese: boolean;

    private instructions: RomInstruction[] = [];
    private instructionAddresses: number[] = [];

    constructor(private file: Uint8Array) {
        this.decodeHeaders();

        console.log('You\'re playing: ' + this.gameTitle);
        console.log('Game size is ' + this.getRomSizeBytes() / 1024 + ' KB');
    }

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

    /**
     * Decodes the rom headers and sets the appropraite variables.
     */
    decodeHeaders() {
        // Take game title from string
        this.gameTitle = this.decodeGameTitle();
        // Determine if ROM requires color gameboy
        this.isColorGameBoy = this.at(0x0143) === 0x80 || this.at(0x0143) === 0xC0;

        // Determine license code
        this.oldLicenseCode = this.at(0x014B);
        this.newLicenseCode = String.fromCharCode(this.at(0x0144)) + String.fromCharCode(this.at(0x0145));
        this.usesNewLicenseCode = this.oldLicenseCode === 0x33;

        // Determine cartridge type
        this.cartridgeType = this.decodeCartridgeType();
        // ROM and RAM size
        this.romBanksAmount = this.decodeROMBanksAmount();
        [this.ramBanksAmount, this.ramBankSize] = this.decodeRAMBanks();

        // Other headers...
        this.isJapanese = this.at(0x014A) === 0x00;
        const maskROMVersionNumber: number = this.at(0x014C);
        const complementCheck = this.at(0x014D);
        const checksum: number = this.at(0x014E) * 0x100 + this.at(0x014F);
    }

    /**
     * Decodes the title of the game from the ROM header
     */
    private decodeGameTitle(): string {
        const bytes: number[] = this.take(0x0134, 16);
        let i = 0;
        let name = '';
        while (i < bytes.length && bytes[i] !== 0) {
            name += String.fromCharCode(bytes[i]);
            i++;
        }
        return name;
    }

    /**
     * Decodes the type of the cartridge from ROM headers
     */
    private decodeCartridgeType(): CartridgeType {
        // tslint:disable:object-literal-sort-key max-line-length
        switch (this.at(0x0147)) {
            case 0x00:
                return { rom: true, mbc: MemoryBankController.None, ram: false, battery: false, timer: false, rumble: false };
            case 0x01:
                return { rom: true, mbc: MemoryBankController.MBC1, ram: false, battery: false, timer: false, rumble: false };
            case 0x02:
                return { rom: true, mbc: MemoryBankController.MBC1, ram: true, battery: false, timer: false, rumble: false };
            case 0x03:
                return { rom: true, mbc: MemoryBankController.MBC1, ram: true, battery: true, timer: false, rumble: false };
            case 0x05:
                return { rom: true, mbc: MemoryBankController.MBC2, ram: false, battery: false, timer: false, rumble: false };
            case 0x06:
                return { rom: true, mbc: MemoryBankController.MBC2, ram: false, battery: true, timer: false, rumble: false };
            case 0x08:
                return { rom: true, mbc: MemoryBankController.None, ram: true, battery: false, timer: false, rumble: false };
            case 0x09:
                return { rom: true, mbc: MemoryBankController.None, ram: true, battery: true, timer: false, rumble: false };
            case 0x0B:
                return { rom: true, mbc: MemoryBankController.MMM01, ram: false, battery: false, timer: false, rumble: false };
            case 0x0C:
                return { rom: true, mbc: MemoryBankController.MMM01, ram: true, battery: false, timer: false, rumble: false };
            case 0x0D:
                return { rom: true, mbc: MemoryBankController.MMM01, ram: true, battery: true, timer: false, rumble: false };
            case 0x0F:
                return { rom: true, mbc: MemoryBankController.MBC3, ram: false, battery: true, timer: true, rumble: false };
            case 0x10:
                return { rom: true, mbc: MemoryBankController.MBC3, ram: true, battery: true, timer: true, rumble: false };
            case 0x11:
                return { rom: true, mbc: MemoryBankController.MBC3, ram: false, battery: false, timer: false, rumble: false };
            case 0x12:
                return { rom: true, mbc: MemoryBankController.MBC3, ram: true, battery: false, timer: false, rumble: false };
            case 0x13:
                return { rom: true, mbc: MemoryBankController.MBC3, ram: true, battery: true, timer: false, rumble: false };
            case 0x19:
                return { rom: true, mbc: MemoryBankController.MBC5, ram: false, battery: false, timer: false, rumble: false };
            case 0x1A:
                return { rom: true, mbc: MemoryBankController.MBC5, ram: true, battery: false, timer: false, rumble: false };
            case 0x1B:
                return { rom: true, mbc: MemoryBankController.MBC5, ram: true, battery: true, timer: false, rumble: false };
            case 0x1C:
                return { rom: true, mbc: MemoryBankController.MBC5, ram: false, battery: false, timer: false, rumble: true };
            case 0x1D:
                return { rom: true, mbc: MemoryBankController.MBC5, ram: true, battery: false, timer: false, rumble: true };
            case 0x1E:
                return { rom: true, mbc: MemoryBankController.MBC5, ram: true, battery: true, timer: false, rumble: true };
            case 0x1F: // Camera
                return { rom: false, mbc: MemoryBankController.None, ram: false, battery: false, timer: false, rumble: false };
            case 0xFD:
                return { rom: true, mbc: MemoryBankController.TAMA5, ram: false, battery: false, timer: false, rumble: false };
            case 0xFE:
                return { rom: true, mbc: MemoryBankController.HuC3, ram: false, battery: false, timer: false, rumble: false };
            case 0xFF:
                return { rom: true, mbc: MemoryBankController.HuC1, ram: false, battery: false, timer: false, rumble: false };
            default:
                console.log('Unknown cartridge?');
                return { rom: true, mbc: MemoryBankController.MBC3, ram: true, battery: false, timer: false, rumble: false };
        }
        // tslint:enable:object-literal-sort-keys max-line-length
    }

    /**
     * Gets the amount of banks for ROM from header
     */
    private decodeROMBanksAmount(): number {
        const val: number = this.at(0x0148);
        if (val <= 0x06) {
            return Math.pow(2, val + 1);
        } else if (val === 0x52) {
            return 72;
        } else if (val === 0x53) {
            return 80;
        } else if (val === 0x54) {
            return 96;
        } else {
            console.log('Unknown ROM size?');
            return 2;
        }
    }

    /**
     * Calculates the size of ROM, in bytes
     */
    private getRomSizeBytes(): number {
        return this.romBanksAmount * 1024 * 16;
    }

    /**
     * Gets the amount of ram banks, and their size.
     * @return {[number, number]} [ramBanksAmount, ramBankSize] Ram banks amount and bank size (in bytes).
     */
    private decodeRAMBanks(): [number, number] {
        const val: number = this.at(0x0149);
        if (val === 0) {
            return [0, 0];
        } else if (val === 1) {
            return [1, 2 * 1024];
        } else if (val <= 4) {
            return [Math.pow(4, val - 2), 8 * 1024];
        } else {
            console.log('Unknown RAM size!');
            return [1, 8 * 1024];
        }
    }

}