import { modifyBit, modifyBits } from './helpers';
import { memory } from './memory';

// http://gbdev.gg8.se/wiki/articles/Memory_Bank_Controllers

export interface WriteSuccess {
    address: number;
    success: boolean;
}

export class MBCNone { // 32KByte ROM only
    // Small games of not more than 32KBytes ROM do not require a MBC chip for ROM banking.
    // The ROM is directly mapped to memory at 0000-7FFFh.
    // Optionally up to 8KByte of RAM could be connected at A000-BFFF,
    // even though that could require a tiny MBC-like circuit, but no real MBC chip.

    resolveRead(address: number): number {
        return address;
    }

    resolveWrite(address: number, value: number): number {
        return address;
    }
}

enum RomRamModeSelect {
    RomModeSelect,
    RamModeSelect,
}

enum RTCRamModeSelect {
    RTCModeSelect,
    RamModeSelect,
}

export class MBC1 { // (max 2MByte ROM and/or 32KByte RAM)
    ramBanks: number[][];

    ramWriteEnabled: boolean;
    romBankNumber: number;
    ramBankNumber: number;

    romRamModeSelect: RomRamModeSelect;

    constructor(ramBanksAmount: number) {
        this.ramBanks = [];
        for (let i = 0; i < ramBanksAmount; i++) {
            this.ramBanks[i] = [];
        }

        this.ramBankNumber = 0;
    }

    get ramBank(): number[] {
        return this.ramBanks[this.ramBankNumber];
    }

    resolveRead(address: number): number {
        if (address < 0x4000) {
            // ROM Bank 00 - Read Only
            return address;
        } else if (address < 0x8000) {
            // ROM Bank 01-7F
            return (address - 0x4000) + 0x4000 * this.romBankNumber;
        } else if (address >= 0xA000 && address < 0xC000) {
            // RAM Bank 00-03
            return this.ramBank[address - 0xA000];
        }
    }

    resolveWrite(address: number, value: number) {
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
            this.ramBank[address - 0xA000] = value;
        }
    }
}

export class MBC2 extends MBC1 { // (max 2MByte ROM and/or 32KByte RAM)

    constructor(ramBanksAmount: number) {
        super(ramBanksAmount);
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
            this.ramBank[address - 0xA000] = value;
        } else {
            console.log('Writing MBC2 address ' + address + '?');
        }
    }

}

export class MBC3 extends MBC1 {
    rtcRegisters: number[];

    hasRamBanks: boolean;

    rtcWriteEnabled: boolean;
    rtcRamModeSelect: RTCRamModeSelect;
    rtcRegisterNumber: number;

    latchClockPrevious = false;

    constructor(ramBanksAmount: number) {
        super(ramBanksAmount);
        this.hasRamBanks = ramBanksAmount > 0;

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
            this.ramBank[address - 0xA000] = value;
        }

        if (this.latchClockPrevious && deleteLatchPrevious) {
            this.latchClockPrevious = false;
        }
    }

}

export class MBC5 extends MBC1 {
    constructor(ramBanksAmount: number) {
        super(ramBanksAmount);
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
            this.ramBank[address - 0xA000] = value;
        }
    }

}