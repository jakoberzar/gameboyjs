import { modifyBit } from './helpers';

export class Input {

    private padReg: number;
    private btnReg: number;
    private selectedReg: number;

    constructor() {
        this.padReg = 0xF;
        this.btnReg = 0xF;
        this.selectedReg = 0x10;

        this.bindEvents();
    }

    handleMemoryRead(address: number): number {
        if (address === 0xFF00) {
            return this.selectedReg === 0x20 ? this.padReg : this.btnReg;
        } else {
            throw 'Not input`s work!';
        }
    }

    handleMemoryWrite(address: number, value: number): void {
        if (address === 0xFF00) {
            this.selectedReg = value;
        } else {
            throw 'Not input`s work!';
        }
    }

    keyDown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowRight':
                this.padReg = modifyBit(this.padReg, 0, 0);
                break;
            case 'ArrowLeft':
                this.padReg = modifyBit(this.padReg, 1, 0);
                break;
            case 'ArrowUp':
                this.padReg = modifyBit(this.padReg, 2, 0);
                break;
            case 'ArrowDown':
                this.padReg = modifyBit(this.padReg, 3, 0);
                break;
            case 'a':
                this.btnReg = modifyBit(this.btnReg, 0, 0);
                break;
            case 'b':
                this.btnReg = modifyBit(this.btnReg, 1, 0);
                break;
            case 'Space':
                this.btnReg = modifyBit(this.btnReg, 2, 0);
                break;
            case 'Enter':
                this.btnReg = modifyBit(this.btnReg, 3, 0);
                break;
            default:
                break;
        }
    }

    keyUp(e) {
        switch (e.key) {
            case 'ArrowRight':
                this.padReg = modifyBit(this.padReg, 0, 1);
                break;
            case 'ArrowLeft':
                this.padReg = modifyBit(this.padReg, 1, 1);
                break;
            case 'ArrowUp':
                this.padReg = modifyBit(this.padReg, 2, 1);
                break;
            case 'ArrowDown':
                this.padReg = modifyBit(this.padReg, 3, 1);
                break;
            case 'a':
                this.btnReg = modifyBit(this.btnReg, 0, 1);
                break;
            case 'b':
                this.btnReg = modifyBit(this.btnReg, 1, 1);
                break;
            case 'Space':
                this.btnReg = modifyBit(this.btnReg, 2, 1);
                break;
            case 'Enter':
                this.btnReg = modifyBit(this.btnReg, 3, 1);
                break;
            default:
                break;
        }

    }

    bindEvents() {
        window.addEventListener('keydown', (e) => this.keyDown(e));
        window.addEventListener('keyup', (e) => this.keyUp(e));
    }

}