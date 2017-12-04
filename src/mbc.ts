import { memory } from "./memory";

// http://gbdev.gg8.se/wiki/articles/Memory_Bank_Controllers

export interface writeSuccess {
    address: number;
    success: boolean;
}

export class MBCNone { // 32KByte ROM only
    // Small games of not more than 32KBytes ROM do not require a MBC chip for ROM banking.
    // The ROM is directly mapped to memory at 0000-7FFFh.
    // Optionally up to 8KByte of RAM could be connected at A000-BFFF, even though that could require a tiny MBC-like circuit, but no real MBC chip.

    resolveRead(address: number): number {
        return address;
    }

    resolveWrite(address: number, value: number): number {
        return address;
    }
}

export class MBC1 { // (max 2MByte ROM and/or 32KByte RAM)
    ramBanks: number[][];
    ramBank: number[]; // Currently selected bank

    ramWriteEnabled: boolean;
    romBankNumber: number;
    ramBankNumber: number;

    constructor(ramBanksAmount: number) {
        this.ramBanks = [];
        for (let i = 0; i < ramBanksAmount; i++) {
            this.ramBanks[i] = [];
        }

        this.ramBank = this.ramBanks[0]; // Initialize on first bank
    }

    resolveRead(address: number): number {
        if (address < 0x4000) {
            // ROM Bank 00 - Read Only
            return address;
        } else if (address < 0x8000) {
            // ROM Bank 01-7F
            // TODO?
            return (address - 0x4000) * this.romBankNumber;
        } else if (address < 0xC000) {
            // RAM Bank 00-03
            // TODO: Implement returning stuff from ram bank???
            return this.ramBank[address - 0xA000];
        }
    }

    resolveWrite(address: number, value: number) {
        if (address < 0x2000) {
            // RAM Enable
            const match = value & 0x0A;251
            this.ramWriteEnabled = match > 0x00;
        } else if (address < 0x4000) {
            // ROM Bank Number
            let bankNumber = value & 0x1F;

            if (bankNumber == 0x00) bankNumber = 0x01;
            else if (bankNumber == 0x20) bankNumber = 0x21;
            else if (bankNumber == 0x40) bankNumber = 0x41;
            else if (bankNumber == 0x60) bankNumber = 0x61;

            this.romBankNumber = bankNumber;
        }
    }
}