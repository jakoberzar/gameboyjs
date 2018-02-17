import { memoryConstants, screenSize } from './constants';
import { getBit, getBits, modifyBit, modifyBits } from './helpers';
import { Memory } from './memory';

export enum LCDMode {
    H_BLANK = 0,
    V_BLANK = 1,
    READING_OAM = 2,
    READING_OAM_VRAM = 3,
}

export interface PixelColor {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

export const GameboyColors: PixelColor[] = [
    {red: 255, green: 255, blue: 255, alpha: 255},
    {red: 170, green: 170, blue: 170, alpha: 255},
    {red: 85, green: 85, blue: 85, alpha: 255},
    {red: 0, green: 0, blue: 0, alpha: 255},
];

// enum videoRegisters {
//     LCDC = 0x0,
//     STAT = 0x1,
//     SCY  = 0x2,
//     SCX  = 0x3,
//     LY   = 0x4,

// }

export class Video {
    memory: Memory; // GPU / Display uses and manipulates some data from memory
    modeClocks = [
        204,  // H-BLANK
        4560, // V-BLANK
        80,   // OAM
        172,  // VRAM
    ];
    clock: number;
    // cachedMode: LCDMode; // Use local for faster access
    // cachedCoincidenceFlag: boolean; // Use local for faster access
    currentLine: number; // Current line
    screen: ImageData;
    screenOld: ImageData;
    screenBuffer: number[];
    displayLines = 144;
    canvas: CanvasRenderingContext2D;
    canvasDOM: HTMLCanvasElement;
    tiles: number[][][];

    // LCD Control register data
    displayEnabled: boolean;         // (0=Off, 1=On)
    windowTileMapSelect: boolean;    // (0=9800-9BFF, 1=9C00-9FFF)
    windowDisplayEnabled: boolean;   // (0=Off, 1=On)
    bgWindowTileDataSelect: boolean; // (0=8800-97FF, 1=8000-8FFF)
    bgTileMapSelect: boolean;        // (0=9800-9BFF, 1=9C00-9FFF)
    objSpriteSize: boolean;          // (0=8x8, 1=8x16)
    objSpriteDisplayEnable: boolean; // (0=Off, 1=On)
    bgDisplay: boolean;              // (0=Off, 1=On)

    // STAT Register
    coincidenceInterruptEnable: boolean;
    mode2InterruptEnable: boolean;
    mode1InterruptEnable: boolean;
    mode0InterruptEnable: boolean;
    coincidenceFlag: boolean;
    mode: LCDMode;

    // Internal registers; transitions to video WIP
    private lcdcReg: number;

    constructor(memory: Memory) {
        this.memory = memory;
        this.clock = 0;
        this.currentLine = 0;
        this.tiles = [];
        this.displayEnabled = true;
    }

    handleMemoryRead(address: number): number {
        switch (address) {
            case memoryConstants.LCDC_REGISTER:
                return this.lcdc;
            case memoryConstants.STAT_REGISTER:
                return this.stat;
            default:
                return 0x00;
        }
    }

    handleMemoryWrite(address: number, value: number) {
        switch (address) {
            case memoryConstants.LCDC_REGISTER:
                this.lcdc = value;
                break;
            case memoryConstants.STAT_REGISTER:
                this.stat = value;
                break;
            default:
                break;
        }

    }

    /**
     * Gets the LCD Control register
     */
    get lcdc() {
        return this.lcdcReg;
    }

    set lcdc(value: number) {
        const current = this.lcdcReg;

        this.displayEnabled = (value & 0x80) > 0;
        this.windowTileMapSelect = (value & 0x40) > 0;
        this.windowDisplayEnabled = (value & 0x20) > 0;
        this.bgWindowTileDataSelect = (value & 0x10) > 0;
        this.bgWindowTileDataSelect = (value & 0x08) > 0;
        this.bgWindowTileDataSelect = (value & 0x04) > 0;
        this.bgWindowTileDataSelect = (value & 0x02) > 0;
        this.bgWindowTileDataSelect = (value & 0x01) > 0;

        if ((current & 0x80) === 0 && this.displayEnabled) {
            // Bit 7 reenabled -> reset ly
            this.currentLine = 0;
            this.updateLY();
        }

        this.lcdcReg = value;
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
    // get stat() {
    //     return this.memory.read(memoryConstants.STAT_REGISTER);
    // }

    // set stat(value: number) {
    //     this.memory.write(memoryConstants.STAT_REGISTER, value);
    // }

    get stat() {
        let n = this.mode;
        if (this.coincidenceFlag) n += 0x04;
        if (this.mode0InterruptEnable) n += 0x08;
        if (this.mode1InterruptEnable) n += 0x10;
        if (this.mode2InterruptEnable) n += 0x20;
        if (this.coincidenceInterruptEnable) n += 0x40;
        return n;
    }

    set stat(value: number) {
        if (value & 0x40) this.coincidenceInterruptEnable = true;
        if (value & 0x20) this.mode2InterruptEnable = true;
        if (value & 0x10) this.mode1InterruptEnable = true;
        if (value & 0x08) this.mode0InterruptEnable = true;
        // Coincidence flag and mode are read only.
    }

    get ly() {
        return this.currentLine;
    }

    set ly(value: number) {
        this.currentLine = 0;
    }

    get lyc() {
        return this.memory.read(memoryConstants.LYC_REGISTER);
    }

    get scy() {
        return this.memory.read(memoryConstants.SCY_REGISTER);
    }

    get scx() {
        return this.memory.read(memoryConstants.SCX_REGISTER);
    }

    get winy() {
        return this.memory.read(memoryConstants.WINY_REGISTER);
    }

    get winx() {
        return this.memory.read(memoryConstants.WINX_REGISTER);
    }

    get bgp() {
        return this.memory.read(memoryConstants.BG_PALLETE_DATA_REGISTER);
    }

    get obp0() {
        return this.memory.read(memoryConstants.OB0_PALLETE_DATA_REGISTER);
    }

    get obp1() {
        return this.memory.read(memoryConstants.OB1_PALLETE_DATA_REGISTER);
    }

    updateClock(value: number): void {
        if (!this.displayEnabled) {
            // I assume this is correct? LCDC sets this bit, not 100% what it means
            return;
        }

        this.clock += value;

        switch (this.mode) {
            case LCDMode.READING_OAM:
                if (this.clock >= this.modeClocks[LCDMode.READING_OAM]) {
                    this.clock = 0;
                    this.mode = LCDMode.READING_OAM_VRAM;
                }
                break;
            case LCDMode.READING_OAM_VRAM:
                if (this.clock >= this.modeClocks[LCDMode.READING_OAM_VRAM]) {
                    this.clock = 0;
                    this.mode = LCDMode.H_BLANK;
                    if (this.mode0InterruptEnable) {
                        this.requestInterrupt(0);
                    }
                }
                break;
            case LCDMode.H_BLANK:
                if (this.clock >= this.modeClocks[LCDMode.H_BLANK]) {
                    this.clock = 0;
                    this.currentLine++;

                    if (this.currentLine === this.displayLines - 1) {
                        this.mode = LCDMode.V_BLANK;
                        this.renderBackground(); // DEBUG - TODO - DRAW LINE BY LINE
                        this.updateCanvas();

                        // Make an interrupt
                        this.requestInterrupt(0);
                        if (this.mode1InterruptEnable) {
                            this.requestInterrupt(1);
                        }
                    } else {
                        this.mode = LCDMode.READING_OAM;
                        if (this.mode2InterruptEnable) {
                            this.requestInterrupt(1);
                        }
                    }

                    this.updateLY();
                }
                break;
            case LCDMode.V_BLANK:
            default:
                if (this.clock >= this.modeClocks[LCDMode.V_BLANK]) {
                    this.clock = 0;
                    this.currentLine++;

                    if (this.currentLine > 153) {
                        this.mode = LCDMode.READING_OAM;
                        this.currentLine = 0;
                    }

                    this.updateLY();
                }
                break;
        }
    }

    updateLY() {
        this.coincidenceFlag = this.currentLine === this.lyc;
        if (this.coincidenceFlag && this.coincidenceInterruptEnable) {
            this.requestInterrupt(1);
        }
    }

    initTiles() {
        for (let tile = 0; tile < 384; tile++) {
            this.tiles[tile] = [];
            for (let row = 0; row < 8; row++) {
                this.tiles[tile][row] = [0, 0, 0, 0, 0, 0, 0, 0];
            }
        }
    }

    /**
     * Updates the tile at given address
     * @param address Address should already have 0x8000 subtracted - should be lower than 0x2000
     * @param value New byte at given value
     */
    updateVRAMByte(address: number, value: number) {
        // We only need to update given row.
        const tileRow = address & 0x1FFE;
        const tile = (tileRow >> 4) & 0x1FF;
        const row = (tileRow >> 1) & 0x7;

        let byte1 = this.memory.read(0x8000 + tileRow);
        let byte2 = this.memory.read(0x8000 + tileRow + 1);

        if (!byte1) byte1 = 0;
        if (!byte2) byte2 = 0;

        // Update column by column
        for (let col = 7; col >= 0; col--) {
            this.tiles[tile][row][col] = (byte1 & 1) + (byte2 & 1) * 2;
            byte1 >>= 1;
            byte2 >>= 1;
        }
    }

    bindCanvas(id: string) {
        this.canvasDOM = <HTMLCanvasElement> document.getElementById(id);
        this.canvas = this.canvasDOM.getContext('2d');
        this.screen = this.canvas.getImageData(0, 0, screenSize.FULL_WIDTH, screenSize.FULL_HEIGHT);
        this.initTiles();
        this.initNintyLogo();
        this.renderBackground();
        this.updateCanvas();
    }

    renderBackground() {
        const bgTileStart = this.bgTileMapSelect ? 0x9C00 : 0x9800;
        const bgColorMap = this.colorMap(this.bgp);

        for (let tileRow = 0; tileRow < 32; tileRow++) {
            for (let tileCol = 0; tileCol < 32; tileCol++) {
                const tileOffset = tileRow * 32 + tileCol;
                let tileIndex = this.memory.read(bgTileStart + tileOffset);

                // If using mode 8800, add 256 to skip first banks
                if (!this.bgWindowTileDataSelect && tileIndex < 128) {
                    tileIndex += 256;
                }

                const canvasTileRow = tileRow * 8;
                const canvasTileCol = tileCol * 8;
                for (let y = 0; y < 8; y++) {
                    let canvasOffset = (canvasTileRow + y) * 256 * 4 + canvasTileCol * 4;
                    for (let x = 0; x < 8; x++) {
                        let color = bgColorMap[this.tiles[tileIndex][y][x]];
                        this.screen.data[canvasOffset] = color.red;
                        this.screen.data[canvasOffset + 1] = color.green;
                        this.screen.data[canvasOffset + 2] = color.blue;
                        this.screen.data[canvasOffset + 3] = color.alpha;

                        canvasOffset += 4;
                    }
                }
            }
        }
    }

    colorMap(pallete: number): PixelColor[] {
        const colors = [];
        for (let i = 0; i < 4; i++) {
            colors.push(GameboyColors[getBits(pallete, i * 2, 2)]);
        }
        return colors;
    }

    // renderLine() {

    // }

    initNintyLogo() {
        const dataRow1 = [
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0xF0, 0x00, 0xF0, 0x00, 0xFC, 0x00, 0xFC, 0x00, 0xFC, 0x00, 0xFC, 0x00, 0xF3, 0x00, 0xF3,
            0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C,
            0x00, 0xF0, 0x00, 0xF0, 0x00, 0xF0, 0x00, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF3, 0x00, 0xF3,

        ];
        for (let i = 0; i < dataRow1.length; i++) {
            this.memory.write(0x8000 + i, dataRow1[i]);
        }

        const dataRow2 = [
            0x00, 0xF3, 0x00, 0xF3, 0x00, 0xF0, 0x00, 0xF0, 0x00, 0xF0, 0x00, 0xF0, 0x00, 0xF0, 0x00, 0xF0,
            0x00, 0x3C, 0x00, 0x3C, 0x00, 0xFC, 0x00, 0xFC, 0x00, 0xFC, 0x00, 0xFC, 0x00, 0x3C, 0x00, 0x3C,
            0x00, 0xF3, 0x00, 0xF3, 0x00, 0xF3, 0x00, 0xF3, 0x00, 0xF3, 0x00, 0xF3, 0x00, 0xF3, 0x00, 0xF3,

        ];
        for (let i = 0; i < dataRow2.length; i++) {
            this.memory.write(0x80D0 + i, dataRow2[i]);
        }
        this.memory.write(0x9904, 0x01);
        this.memory.write(0x9905, 0x02);
        this.memory.write(0x9906, 0x03);
        this.memory.write(0x9924, 0x0D);
        this.memory.write(0x9925, 0x0E);
        this.memory.write(0x9926, 0x0F);
    }

    updateCanvas() {
        this.canvas.putImageData(this.screen, 0, 0);
        // Check if anything new
        if (this.screenOld === undefined) this.screenOld = this.screen;
        for (let i = 0; i < this.screen.data.length; i++) {
            if (this.screen.data[i] !== this.screenOld.data[i]) {
                console.log('Updating screen!!!');
                break;
            }
        }

        this.canvas.strokeStyle = 'black';
        this.canvas.strokeRect(this.scx, this.scy, 160, 144);
        this.screenOld = this.screen;
    }

    requestInterrupt(bitNumber) {
        const interruptFlag = this.memory.read(memoryConstants.INTERRUPT_FLAG_REGISTER);
        const modifiedFlag = modifyBit(interruptFlag, bitNumber, 1);
        if (modifiedFlag !== interruptFlag) {
            this.memory.write(memoryConstants.INTERRUPT_FLAG_REGISTER, modifiedFlag);
        }
    }
}