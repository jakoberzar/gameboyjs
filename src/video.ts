import { memoryConstants } from './constants';
import { getBits, modifyBits } from './helpers';
import { Memory } from './memory';

export enum LCD_MODE {
    H_BLANK = 0,
    V_BLANK = 1,
    READING_ORM = 2,
    READING_ORM_VRAM = 3,
}

export class Video {
    memory: Memory; // GPU / Display uses and manipulates some data from memory
    modeClocks = [
        204,  // H-BLANK
        4560, // V-BLANK
        80,   // OAM
        172,  // VRAM
    ];
    clock: number;
    cachedMode: LCD_MODE; // Use local for faster access
    cachedCoincidenceFlag: boolean; // Use local for faster access
    currentLine: number; // Current line
    screen: ImageData;
    screenBuffer: number[];
    displayLines = 144;
    canvas: CanvasRenderingContext2D;

    constructor(memory: Memory) {
        this.memory = memory;
        this.clock = 0;
    }

    /**
     * Gets the LCD Control register
     *
     * Bit 7 - LCD Display Enable             (0=Off, 1=On)
     * Bit 6 - Window Tile Map Display Select (0=9800-9BFF, 1=9C00-9FFF)
     * Bit 5 - Window Display Enable          (0=Off, 1=On)
     * Bit 4 - BG & Window Tile Data Select   (0=8800-97FF, 1=8000-8FFF)
     * Bit 3 - BG Tile Map Display Select     (0=9800-9BFF, 1=9C00-9FFF)
     * Bit 2 - OBJ (Sprite) Size              (0=8x8, 1=8x16)
     * Bit 1 - OBJ (Sprite) Display Enable    (0=Off, 1=On)
     * Bit 0 - BG/Window Display/Priority     (0=Off, 1=On)
     */
    get lcdc() {
        return this.memory.read(memoryConstants.LCDC_REGISTER);
    }

    set lcdc(value: number) { // Can only be written during mode 3!!!
        this.memory.write(memoryConstants.LCDC_REGISTER, value);
    }

    /**
     * Gets the LCD Status register
     *
     *  Bit 6 - LYC=LY Coincidence Interrupt (1=Enable) (Read/Write)
     *  Bit 5 - Mode 2 OAM Interrupt         (1=Enable) (Read/Write)
     *  Bit 4 - Mode 1 V-Blank Interrupt     (1=Enable) (Read/Write)
     *  Bit 3 - Mode 0 H-Blank Interrupt     (1=Enable) (Read/Write)
     *  Bit 2 - Coincidence Flag  (0:LYC<>LY, 1:LYC=LY) (Read Only)
     *  Bit 1-0 - Mode Flag       (Mode 0-3, see below) (Read Only)
     *          0: During H-Blank
     *          1: During V-Blank
     *          2: During Searching OAM
     *          3: During Transferring Data to LCD Driver
     */
    get stat() {
        return this.memory.read(memoryConstants.STAT_REGISTER);
    }

    set stat(value: number) {
        this.memory.write(memoryConstants.STAT_REGISTER, value);
    }

    get mode(): LCD_MODE {
        return getBits(this.stat, 0, 2);
    }

    set mode(value: LCD_MODE) {
        this.cachedMode = value;
        this.stat = modifyBits(this.stat, 0, value, 2);
    }

    set coincidenceFlag(value: boolean) {
        this.cachedCoincidenceFlag = value;
        const nVal = value ? 1 : 0;
        this.stat = modifyBits(this.stat, 2, nVal, 1);
    }

    get lyc() {
        return this.memory.read(memoryConstants.LYC_REGISTER);
    }

    updateClock(value: number): void {
        this.clock += value;

        switch (this.cachedMode) {
            case LCD_MODE.READING_ORM:
                if (this.clock >= this.modeClocks[LCD_MODE.READING_ORM]) {
                    this.clock = 0;
                    this.mode = LCD_MODE.READING_ORM_VRAM;
                }
                break;
            case LCD_MODE.READING_ORM_VRAM:
                if (this.clock >= this.modeClocks[LCD_MODE.READING_ORM_VRAM]) {
                    this.clock = 0;
                    this.mode = LCD_MODE.H_BLANK;
                }
                break;
            case LCD_MODE.H_BLANK:
                if (this.clock >= this.modeClocks[LCD_MODE.H_BLANK]) {
                    this.clock = 0;
                    this.currentLine++;

                    if (this.currentLine === this.displayLines - 1) {
                        this.mode = LCD_MODE.V_BLANK;
                        this.canvas.putImageData(this.screen, 0, 0);
                    } else {
                        this.mode = LCD_MODE.READING_ORM;
                    }

                    this.updateLY();
                }
                break;
            case LCD_MODE.V_BLANK:
            default:
                if (this.clock >= this.modeClocks[LCD_MODE.V_BLANK]) {
                    this.clock = 0;
                    this.currentLine++;

                    if (this.currentLine > 153) {
                        this.mode = LCD_MODE.READING_ORM;
                        this.currentLine = 0;
                    }

                    this.updateLY();
                }
                break;
        }
    }

    updateLY() {
        this.memory.write(memoryConstants.LY_REGISTER, this.currentLine);
        this.coincidenceFlag = this.currentLine === this.lyc;
    }

    renderLine() {

    }
}