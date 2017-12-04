import { Rom } from './rom';

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

export class Memory {
    vram: number[];  // 8KB
    wramBank0: number[]; // 4KB
    wramBank1: number[]; // 4KB
    oam: number[]; // 160B Sprite Attribute Table
    hram: number[]; // 133B 0xFF$$, LDH A, $$
    ir: number; // Interrupt enable register

    rom: Rom;

    constructor() {
        this.vram = new Array(0x2000);
        this.wramBank0 = new Array(0x1000);
        this.wramBank1 = new Array(0x1000);
        this.oam = new Array(0xA0);
        this.hram = new Array(0x85);
        this.ir = 1;
        console.log('Memory has been inited!');
    }

    setRom(r: Rom) {
        this.rom = r;
    }

    /**
     * Gets the byte at given address
     * @param {number} address The address of the byte
     */
    at(address: number): number {
        if (address < 0 ) {
            // throw 'Memory address cannot be lower than zero!';
        } else if (address > 0xFFFF) {
            throw 'Memory cannot be over 0xFFFF!';
        }

        // Memory map
        if (address < 0x4000) {
            // ROM Bank 00
            // return this.rom.at(address); // TODO: Implement bank 0 in rom class
            return 0; // TODO: Implement bank 0 in rom class
        } else if (address < 0x8000) {
            // Rom Bank 01..NN
            return 1; // TODO: Implement banks in rom class
        } else if (address < 0xA000) {
            // Video RAM (VRAM)
            return this.vram[address - 0x8000];
        } else if (address < 0xC000) {
            // External RAM
            return 2; // TODO: Implement external ram in rom class
        } else if (address < 0xD000) {
            // 4KB Work RAM Bank 0
            return this.wramBank0[address - 0xC000];
        } else if (address < 0xE000) {
            // 4KB Work RAM Bank 1
            return this.wramBank1[address - 0xD000];
        } else if (address < 0xFE00) {
            // Echo, same as C000 - DDFF
            return this.at(address - 0x2000);
        } else if (address < 0xFEA0) {
            // Sprite attribute table (OAM)
            return this.oam[address - 0xFE00];
        } else if (address < 0xFF00) {
            console.log('Not usable ram used! 0x' + address.toString(16)); // Not usable
            return 0;
        } else if (address < 0xFF80) {
            // I/O Ports
            return 3; // TODO: Implement I/O
        } else if (address < 0xFFFF) {
            // High RAM (HRAM)
            return this.hram[address - 0xFF80];
        } else if (address === 0xFFFF) {
            // Interrupt enable register
            return this.ir;
        }
    }

    set(address: number, value: number): void {
        // Code similar to at, because it's more efficient than other ways to
        // pass parameters by reference or kinds of pointers.

        // Separate value by bytes, because each address only holds one 8-bit byte.
        // const firstByte: number;

        if (address < 0 ) {
            // throw 'Memory address cannot be lower than zero!';
        } else if (address > 0xFFFF) {
            throw 'Memory cannot be over 0xFFFF!';
        }

        // Memory map
        if (address < 0x4000) {
            // ROM Bank 00
            return; // TODO: Implement bank 0 in rom class
        } else if (address < 0x8000) {
            // Rom Bank 01..NN
            return; // TODO: Implement banks in rom class
        } else if (address < 0xA000) {
            // Video RAM (VRAM)
            this.vram[address - 0x8000] = value;
        } else if (address < 0xC000) {
            // External RAM
            return; // TODO: Implement external ram in rom class
        } else if (address < 0xD000) {
            // 4KB Work RAM Bank 0
            this.wramBank0[address - 0xC000] = value;
        } else if (address < 0xE000) {
            // 4KB Work RAM Bank 1
            this.wramBank1[address - 0xD000] = value;
        } else if (address < 0xFE00) {
            // Echo, same as C000 - DDFF
            this.set(address - 0x2000, value);
        } else if (address < 0xFEA0) {
            // Sprite attribute table (OAM)
            this.oam[address - 0xFE00] = value;
        } else if (address < 0xFF00) {
            console.log('Not usable ram used! 0x' + address.toString(16)); // Not usable
            return;
        } else if (address < 0xFF80) {
            // I/O Ports
            return; // TODO: Implement I/O
        } else if (address < 0xFFFF) {
            // High RAM (HRAM)
            this.hram[address - 0xFF80] = value;
        } else if (address === 0xFFFF) {
            // Interrupt enable register
            this.ir = value;
        }
    }
}

export let memory = new Memory();