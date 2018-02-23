import { getBits } from './helpers';
import { bytesToInstruction, Instruction, romInstructionToString } from './instructions';
import { MBC, MBCFactory } from './mbc';
import { Rom, RomInstruction } from './rom';
import { Timer } from './timer';
import { Video } from './video';

// Link: http://bgb.bircd.org/pandocs.htm#memorymap
//
// General Memory Map
//   0000-3FFF   16KB ROM Bank 00     (in cartridge, fixed at bank 00)
//   4000-7FFF   16KB ROM Bank 01..NN (in cartridge, switchable bank number)
//   8000-9FFF   8KB Video RAM (VRAM) (switchable bank 0-1 in CGB Mode)
//   A000-BFFF   8KB External RAM     (in cartridge, switchable bank, if any)
//   C000-CFFF   4KB Work RAM Bank 0 (WRAM)
//   D000-DFFF   4KB Work RAM Bank 1 (WRAM)  (switchable bank 1-7 in CGB Mode)
//   E000-FDFF   Same as C000-DDFF (ECHO)    (typically not used)
//   FE00-FE9F   Sprite Attribute Table (OAM)
//   FEA0-FEFF   Not Usable
//   FF00-FF7F   I/O Ports
//   FF80-FFFE   High RAM (HRAM)
//   FFFF        Interrupt Enable Register

// Jump Vectors in First ROM Bank
// The following addresses are supposed to be used as jump vectors:
//   0000,0008,0010,0018,0020,0028,0030,0038   for RST commands
//   0040,0048,0050,0058,0060                  for Interrupts
export interface LastAccessed {
    address: number;
    wasRead: boolean;
    value: number;
}

export class Memory {
    vram: number[];  // 8KB
    wramBank0: number[]; // 4KB
    wramBank1: number[]; // 4KB
    oam: number[]; // 160B Sprite Attribute Table
    hram: number[]; // 133B 0xFF$$, LDH A, $$
    ie: number; // Interrupt enable register

    io: number[]; // For now, io is like ram

    rom: Rom;
    mbc: MBC;
    video: Video;
    timer: Timer;

    lastAccessed: LastAccessed;

    constructor() {
        this.vram = new Array(0x2000);
        this.wramBank0 = new Array(0x1000);
        this.wramBank1 = new Array(0x1000);
        this.oam = new Array(0xA0);
        this.hram = new Array(0x85);
        this.ie = 0x0;

        this.io = new Array(0x80);

        this.initAllArrays();

        this.lastAccessed = { address: -1, wasRead: true, value: 0 };

    }

    setRom(rom: Rom) {
        this.rom = rom;
        this.mbc = MBCFactory(rom);
    }

    setIORegisters(video: Video, timer: Timer) {
        this.video = video;
        this.timer = timer;

        this.boot();
    }

    /**
     * Gets the byte at given address
     * @param {number} address The address of the byte
     */
    read(address: number): number {
        let value = undefined;

        if (address < 0 ) {
            // throw 'Memory address cannot be lower than zero!';
        } else if (address > 0xFFFF) {
            throw 'Memory cannot be over 0xFFFF!';
        }

        // Memory map
        if (address < 0x4000) {
            // ROM Bank 00
            value = this.mbc.resolveRead(address);
        } else if (address < 0x8000) {
            // Rom Bank 01..NN
            value = this.mbc.resolveRead(address);
        } else if (address < 0xA000) {
            // Video RAM (VRAM)
            value = this.vram[address - 0x8000];
        } else if (address < 0xC000) {
            // External RAM
            value = this.mbc.resolveRead(address);
        } else if (address < 0xD000) {
            // 4KB Work RAM Bank 0
            value = this.wramBank0[address - 0xC000];
        } else if (address < 0xE000) {
            // 4KB Work RAM Bank 1
            value = this.wramBank1[address - 0xD000];
        } else if (address < 0xFE00) {
            // Echo, same as C000 - DDFF
            value = this.read(address - 0x2000);
        } else if (address < 0xFEA0) {
            // Sprite attribute table (OAM)
            value = this.oam[address - 0xFE00];
        } else if (address < 0xFF00) {
            console.log('Not usable ram used! 0x' + address.toString(16)); // Not usable
            value = 0;
        } else if (address < 0xFF80) {
            if (address >= 0xFF04 && address <= 0xFF07) {
                // Redirect timer register access
                value = this.timer.handleMemoryRead(address);
            } else if (address >= 0xFF40 && address <= 0xFF44) {
                // Redirect video register access
                value = this.video.handleMemoryRead(address);
            } else {
                switch (address) {
                    case 0xFF46:
                        console.log('Reading from IO - ', '0x' + address.toString(16));
                        value = this.io[address - 0xFF00];
                        break;
                    default:
                        value = this.io[address - 0xFF00];
                        break;
                }
            }

        } else if (address < 0xFFFF) {
            // High RAM (HRAM)
            value = this.hram[address - 0xFF80];
        } else if (address === 0xFFFF) {
            // Interrupt enable register
            value = this.ie;
        }

        this.lastAccessed.address = address;
        this.lastAccessed.wasRead = true;
        this.lastAccessed.value = value;

        if (value === undefined) return 0;
        else return value;
    }

    /**
     * Writes a byte to the given location
     * @param address The address to write to
     * @param value The value to write in memory
     */
    write(address: number, value: number): void {
        if (address < 0 ) {
            // throw 'Memory address cannot be lower than zero!';
        } else if (address > 0xFFFF) {
            throw 'Memory cannot be over 0xFFFF!';
        }

        // Memory map
        if (address < 0x4000) {
            // ROM Bank 00
            this.mbc.resolveWrite(address, value);
        } else if (address < 0x8000) {
            // Rom Bank 01..NN
            this.mbc.resolveWrite(address, value);
        } else if (address < 0xA000) {
            // Video RAM (VRAM)
            this.vram[address - 0x8000] = value;
            // if (value > 0) console.log('VRAM write: 0x' + address.toString(16), value);
            if (address < 0x9800) {
                this.video.updateVRAMByte(address - 0x8000, value);
            }
        } else if (address < 0xC000) {
            // External RAM
            this.mbc.resolveWrite(address, value);
        } else if (address < 0xD000) {
            // 4KB Work RAM Bank 0
            this.wramBank0[address - 0xC000] = value;
        } else if (address < 0xE000) {
            // 4KB Work RAM Bank 1
            this.wramBank1[address - 0xD000] = value;
        } else if (address < 0xFE00) {
            // Echo, same as C000 - DDFF
            this.write(address - 0x2000, value);
        } else if (address < 0xFEA0) {
            // Sprite attribute table (OAM)
            this.oam[address - 0xFE00] = value;
        } else if (address < 0xFF00) {
            console.log('Not usable ram used! 0x' + address.toString(16)); // Not usable
            return;
        } else if (address < 0xFF80) {
            // I/O Ports
            if (address === 0xFF02) {
                console.log(this.io[1].toString(16).toUpperCase(), String.fromCharCode(this.io[1]).toUpperCase());
            } else if (address >= 0xFF04 && address <= 0xFF07) {
                // Redirect timer register access
                this.timer.handleMemoryWrite(address, value);
            } else if (address >= 0xFF40 && address <= 0xFF44) {
                // Redirect video register access
                this.video.handleMemoryWrite(address, value);
            } else if (address === 0xFF46) {
                // OAM DMA
                for (let i = 0; i < 0xA0; i++) {
                    this.oam[i] = this.read((value << 8) + i);
                }
            } else {
                switch (address) {
                    case 0xFF0F:
                        // console.log('Writing to IO - ', '0x' + address.toString(16), value.toString(16));
                        this.io[address - 0xFF00] = value;
                        break;
                    default:
                        this.io[address - 0xFF00] = value;
                        break;
                }
            }

        } else if (address < 0xFFFF) {
            // High RAM (HRAM)
            this.hram[address - 0xFF80] = value;
        } else if (address === 0xFFFF) {
            // Interrupt enable register
            // console.log('Using ie: 0x' + value.toString(16));
            this.ie = value;
        }

        this.lastAccessed.address = address;
        this.lastAccessed.wasRead = false;
        this.lastAccessed.value = value;
    }

    /**
     * Reads multiple bytes, right to left (little endian). Receive in big endian by default.
     * @param address Starting address
     * @param amount Amount of bytes to read from memory. If reading more than 3, be careful with int limits.
     * @param bigEndian The order in which to return received bytes
     */
    readMultiple(address: number, amount = 2, bigEndian = false): number[] {
        const bytes = [];
        for (let i = 0; i < amount; i++) {
            const byte = this.read(address + i);
            if (bigEndian) bytes.push(byte);
            else bytes.unshift(byte);
        }
        return bytes;
    }

    /**
     * Writes multiple bytes, right to left (little endian)
     * @param address Starting address
     * @param value The value to write in memory
     * @param bigEndian The order in which to take bytes
     */
    writeTwoBytes(address: number, value: number, bigEndian = false): void {
        if (bigEndian) {
            this.write(address, (value & 0xFF00) >> 8);
            this.write(address + 1, value & 0xFF);
        } else {
            this.write(address, value & 0xFF);
            this.write(address + 1, (value & 0xFF00) >> 8);
        }
    }

    /**
     * Get the instruction together with the bytes at given address
     * @param address Address of instruction (first byte)
     */
    getInstructionAt(address: number): RomInstruction {
        // Try to find processed instruction in rom cache
        const cached = this.mbc.cachedInstructionAt(address);
        if (cached && address < 0x4000) {
            return cached;
        }

        // Decode instruction if not cached
        const bytes = this.readMultiple(address, 2, true);
        const instruction: Instruction = bytesToInstruction(bytes);
        const operandBytes = bytes[0] === 0xCB ?
            [] :
            this.readMultiple(address + 1, instruction.byteLength - 1);
        const readable = romInstructionToString({operandBytes, instruction, address});
        const romInstr = {
            address,
            instruction,
            operandBytes,
            readable,
        };

        this.mbc.saveInstructionAt(address, romInstr);

        return romInstr;
    }

    initAllArrays() {
        for (let i = 0; i < this.wramBank0.length; i++) {
            this.wramBank0[i] = 0;
            this.wramBank1[i] = 0;
        }

        for (let i = 0; i < this.vram.length; i++) {
            this.vram[i] = 0;
        }
    }

    /**
     * Set memory values (IO ports) to the default boot ones. (BIOS)
     */
    boot() {
        this.write(0xFF05, 0x00); // TIMA
        this.write(0xFF06, 0x00); // TMA
        this.write(0xFF07, 0x00); // TAC
        this.write(0xFF10, 0x80); // NR10
        this.write(0xFF11, 0xBF); // NR11
        this.write(0xFF12, 0xF3); // NR12
        this.write(0xFF14, 0xBF); // NR14
        this.write(0xFF16, 0x3F); // NR21
        this.write(0xFF17, 0x00); // NR22
        this.write(0xFF19, 0xBF); // NR24
        this.write(0xFF1A, 0x7F); // NR30
        this.write(0xFF1B, 0xFF); // NR31
        this.write(0xFF1C, 0x9F); // NR32
        this.write(0xFF1E, 0xBF); // NR33
        this.write(0xFF20, 0xFF); // NR41
        this.write(0xFF21, 0x00); // NR42
        this.write(0xFF22, 0x00); // NR43
        this.write(0xFF23, 0xBF); // NR30
        this.write(0xFF24, 0x77); // NR50
        this.write(0xFF25, 0xF3); // NR50
        this.write(0xFF26, 0xF1); // NR51
        this.write(0xFF40, 0x91); // LCDC
        this.write(0xFF42, 0x00); // SCY
        this.write(0xFF43, 0x00); // SCX
        this.write(0xFF45, 0x00); // LYC
        this.write(0xFF47, 0xFC); // BGP
        this.write(0xFF48, 0xFF); // OBP0
        this.write(0xFF49, 0xFF); // OBP1
        this.write(0xFF4A, 0x00); // WY
        this.write(0xFF4B, 0x00); // WX
        this.write(0xFFFF, 0x00); // IE
    }
}