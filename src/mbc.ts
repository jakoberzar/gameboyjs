import { modifyBit, modifyBits } from './helpers';
import { MemoryBankController, Rom, RomInstruction } from './rom';
import { storage } from './storage';

// http://gbdev.gg8.se/wiki/articles/Memory_Bank_Controllers

enum RomRamModeSelect {
    RomModeSelect,
    RamModeSelect,
}

enum RTCRamModeSelect {
    RTCModeSelect,
    RamModeSelect,
}

export class MBC {
    rom: Rom;

    ramBanks: number[][];

    ramWriteEnabled: boolean;
    romBankNumber: number;
    ramBankNumber: number;

    romRamModeSelect: RomRamModeSelect;

    constructor(rom: Rom) {
        this.rom = rom;

        this.restoreExternalRAM(rom);

        this.ramBankNumber = 0;
        this.romBankNumber = 1;
        this.romRamModeSelect = 0;
    }

    get ramBank(): number[] {
        return this.ramBanks[this.ramBankNumber];
    }

    resolveRead(address: number): number {
        if (address < 0x4000) {
            // ROM Bank 00 - Read Only
            return this.rom.at(address);
        } else if (address < 0x8000) {
            // ROM Bank 01-7F
            const location = (address - 0x4000) + 0x4000 * this.romBankNumber;
            return this.rom.at(location);
        } else if (address >= 0xA000 && address < 0xC000) {
            // RAM Bank 00-03
            return this.ramBank[address - 0xA000];
        }
    }

    resolveWrite(address: number, value: number): void {
        if (address < 0x2000) {
            // RAM Enable
            const match = value & 0x0A;
            this.ramWriteEnabled = match > 0x00;
        } else if (address < 0x4000) {
            // ROM Bank Number
            let bankNumber = value & 0x1F;

            if (bankNumber === 0x00) bankNumber = 0x01;
            else if (bankNumber === 0x20) bankNumber = 0x21;
            else if (bankNumber === 0x40) bankNumber = 0x41;
            else if (bankNumber === 0x60) bankNumber = 0x61;

            this.romBankNumber = modifyBits(this.romBankNumber, 0, value, 5);
        } else if (address < 0x6000) {
            const val = value & 0x03;
            if (this.romRamModeSelect === RomRamModeSelect.RamModeSelect) {
                this.ramBankNumber = val;
            } else {
                this.romBankNumber = modifyBits(this.romBankNumber, 5, value, 2);
            }
        } else if (address < 0x8000) {
            if (value === 0x00) this.romRamModeSelect = RomRamModeSelect.RomModeSelect;
            else if (value === 0x01) this.romRamModeSelect = RomRamModeSelect.RamModeSelect;
        } else if (address >= 0xA000 && address < 0xC000) {
            this.writeToExternalRAM(address, value);
        }
    }

    /**
     * Saves data to the cartridge RAM
     * @param address Should be in original form, without A000 subtracted
     * @param value Value to write in memory
     */
    writeToExternalRAM(address: number, value: number) {
        this.ramBank[address - 0xA000] = value;
        storage.queueSave('mbc-ram', this.ramBanks, 1000, true);
    }

    restoreExternalRAM(rom: Rom) {
        const restored = storage.restoreSave('mbc-ram', null, true);
        if (restored === null) {
            this.ramBanks = [];
            for (let i = 0; i < rom.ramBanksAmount; i++) {
                this.ramBanks[i] = [];
            }
        } else {
            this.ramBanks = restored;
        }

    }

    cachedInstructionAt(address: number): RomInstruction {
        return this.rom.cachedInstructionAt(address);
    }

    saveInstructionAt(address: number, romInstr: RomInstruction): void {
        this.rom.saveInstructionAt(address, romInstr);
    }

}

export class MBCNone extends MBC { // 32KByte ROM only
    constructor(rom: Rom) {
        super(rom);
    }

    resolveRead(address: number): number {
        return this.rom.at(address);
    }

    resolveWrite(address: number, value: number): void {
        // Only ROM implemented here. Docs say it could also contain an external RAM, but unsure of that for now.
    }
}

export class MBC1 extends MBC {
    // MBC1 is the most similar to other, so others just extend it.
}

export class MBC2 extends MBC {

    constructor(rom: Rom) {
        super(rom);
    }

    resolveRead(address: number): number {
        if (address < 0x4000) {
            // ROM Bank 00 - Read Only - Same as MBC1
            return super.resolveRead(address);
        } else if (address < 0x8000) {
            // ROM Bank 01-7F
            // Same as for MBC1, but only a total of 16 ROM banks is supported.
            return super.resolveRead(address);
        } else if (address >= 0xA000 && address < 0xA200) {
            // 512x4bits RAM, built-in into the MBC2 chip
            return this.ramBank[address - 0xA000];
        }
    }

    resolveWrite(address: number, value: number) {
        if (address < 0x2000 && (address & 0x0100) === 0x0000) {
            // RAM Enable
            this.ramWriteEnabled = !this.ramWriteEnabled;
        } else if (address < 0x4000 && (address & 0x0100) === 0x0100) {
            // ROM Bank Number
            this.romBankNumber = value & 0x0F;
        } else if (address >= 0xA000 && address < 0xA200) {
            // 512x4bits RAM, built-in into the MBC2 chip
            this.writeToExternalRAM(address, value);
        } else {
            console.log('Writing MBC2 address ' + address + '?');
        }
    }

}

export class MBC3 extends MBC {
    rtcRegisters: number[];

    hasRamBanks: boolean;

    rtcWriteEnabled: boolean;
    rtcRamModeSelect: RTCRamModeSelect;
    rtcRegisterNumber: number;

    latchClockPrevious = false;

    constructor(rom: Rom) {
        super(rom);
        this.hasRamBanks = rom.ramBanksAmount > 0;
        this.rtcRegisters = [];
        for (let i = 0; i < 5; i++) this.rtcRegisters[i] = 0;
    }

    get rtcRegister(): number {
        return this.rtcRegister[this.rtcRegisterNumber];
    }

    resolveRead(address: number): number {
        if (address < 0x4000) {
            // ROM Bank 00 - Read Only
            return super.resolveRead(address);
        } else if (address < 0x8000) {
            // ROM Bank 01-7F
            return super.resolveRead(address);
        } else if (address >= 0xA000 && address < 0xC000) {
            if (this.rtcRamModeSelect === RTCRamModeSelect.RamModeSelect) {
                // RAM Bank 00-03
                return this.ramBank[address - 0xA000];
            } else {
                // RTC Register 08-0C
                return this.rtcRegisters[address - 0xA008];
            }
        }
    }

    resolveWrite(address: number, value: number) {
        let deleteLatchPrevious = true;

        if (address < 0x2000) {
            // RAM and Timer Enable
            const match = value & 0x0A;
            this.rtcWriteEnabled = match > 0x00;
            this.ramWriteEnabled = match > 0x00;
        } else if (address < 0x4000) {
            // ROM Bank Number
            let bankNumber = value;
            if (bankNumber === 0x00) bankNumber = 0x01;

            this.romBankNumber = bankNumber;
        } else if (address < 0x6000) {
            // RAM Bank Number - or - RTC Register Select
            const rtcSelected = (value & 0x08) > 0x00;
            this.rtcRamModeSelect = rtcSelected ? RTCRamModeSelect.RTCModeSelect : RTCRamModeSelect.RamModeSelect;
            if (rtcSelected) {
                this.rtcRamModeSelect = RTCRamModeSelect.RTCModeSelect;
                this.rtcRegisterNumber = value - 0x08;
            } else {
                this.rtcRamModeSelect = RTCRamModeSelect.RamModeSelect;
                this.ramBankNumber = value & 0x03;
            }
        } else if (address < 0x8000) {
            // Latch Clock Data
            if (value === 0x00) {
                this.latchClockPrevious = true;
                deleteLatchPrevious = false;
            }
            if (value === 0x01) {
                // Do the latch
                const d = new Date();
                this.rtcRegisters[0] = d.getSeconds();
                this.rtcRegisters[1] = d.getMinutes();
                this.rtcRegisters[2] = d.getHours();
                this.rtcRegisters[3] = d.getDate();
                this.rtcRegisters[4] = 0x00;
            }

        } else if (address >= 0xA000 && address < 0xC000) {
            this.writeToExternalRAM(address, value);
        }

        if (this.latchClockPrevious && deleteLatchPrevious) {
            this.latchClockPrevious = false;
        }
    }

}

export class MBC5 extends MBC {
    constructor(rom: Rom) {
        super(rom);
    }

    resolveRead(address: number): number {
        if (address < 0x4000) {
            // ROM Bank 00 - Read Only
            return super.resolveRead(address);
        } else if (address < 0x8000) {
            // ROM Bank 00-1FF
            return super.resolveRead(address);
        } else if (address >= 0xA000 && address < 0xC000) {
            // RAM Bank 00-0F
            return super.resolveRead(address);
        }
    }

    resolveWrite(address: number, value: number) {
        if (address < 0x2000) {
            // RAM Enable
            const match = value & 0x0A;
            this.ramWriteEnabled = match > 0x00;
        } else if (address < 0x3000) {
            // ROM Bank Number - Low 8 bits
            this.romBankNumber = modifyBits(this.romBankNumber, 0, value, 8);
        } else if (address < 0x4000) {
            // ROM Bank Number - High bit
            this.romBankNumber = modifyBit(this.romBankNumber, 8, value);
        } else if (address < 0x6000) {
            this.ramBankNumber = value & 0x0F;
        } else if (address >= 0xA000 && address < 0xC000) {
            this.writeToExternalRAM(address, value);
        }
    }

}

export function MBCFactory(rom: Rom) {
    switch (rom.cartridgeType.mbc) {
        case MemoryBankController.None:
            return new MBCNone(rom);
        case MemoryBankController.MBC1:
            return new MBC1(rom);
        case MemoryBankController.MBC2:
            return new MBC2(rom);
        case MemoryBankController.MBC3:
            return new MBC3(rom);
        case MemoryBankController.MBC5:
            return new MBC5(rom);
        case MemoryBankController.HuC1:
        case MemoryBankController.HuC3: // Not confirmed
        case MemoryBankController.MMM01:
        default:
            return new MBC1(rom);
    }
}