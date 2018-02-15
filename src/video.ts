import { memoryConstants, screenSize } from './constants';
import { getBit, getBits, modifyBits } from './helpers';
import { Memory } from './memory';

export enum LCDMode {
    H_BLANK = 0,
    V_BLANK = 1,
    READING_ORM = 2,
    READING_ORM_VRAM = 3,
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

export class Video {
    memory: Memory; // GPU / Display uses and manipulates some data from memory
    modeClocks = [
        204,  // H-BLANK
        4560, // V-BLANK
        80,   // OAM
        172,  // VRAM
    ];
    clock: number;
    cachedMode: LCDMode; // Use local for faster access
    cachedCoincidenceFlag: boolean; // Use local for faster access
    currentLine: number; // Current line
    screen: ImageData;
    screenBuffer: number[];
    displayLines = 144;
    canvas: CanvasRenderingContext2D;
    canvasDOM: HTMLCanvasElement;
    tiles: number[][][];

    constructor(memory: Memory) {
        this.memory = memory;
        this.clock = 0;
        this.currentLine = 0;
        this.tiles = [];
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

    get mode(): LCDMode {
        return getBits(this.stat, 0, 2);
    }

    set mode(value: LCDMode) {
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
        this.clock += value;

        switch (this.cachedMode) {
            case LCDMode.READING_ORM:
                if (this.clock >= this.modeClocks[LCDMode.READING_ORM]) {
                    this.clock = 0;
                    this.mode = LCDMode.READING_ORM_VRAM;
                }
                break;
            case LCDMode.READING_ORM_VRAM:
                if (this.clock >= this.modeClocks[LCDMode.READING_ORM_VRAM]) {
                    this.clock = 0;
                    this.mode = LCDMode.H_BLANK;
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
                    } else {
                        this.mode = LCDMode.READING_ORM;
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
                        this.mode = LCDMode.READING_ORM;
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
        const signedTileDataSelect = getBit(this.lcdc, 4) === 0;
        const bgTileStart = getBit(this.lcdc, 3) === 0 ? 0x9800 : 0x9C00;
        const bgColorMap = this.colorMap(this.bgp);

        for (let tileRow = 0; tileRow < 32; tileRow++) {
            for (let tileCol = 0; tileCol < 32; tileCol++) {
                const tileOffset = tileRow * 32 + tileCol;
                let tileIndex = this.memory.read(bgTileStart + tileOffset);

                // If using mode 8800, add 256 to skip first banks
                if (signedTileDataSelect && tileIndex < 128) {
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
        this.canvas.strokeStyle = 'black';
        this.canvas.strokeRect(this.scx, this.scy, 160, 144);
    }
}