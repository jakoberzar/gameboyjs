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

export class Video {
    memory: Memory; // GPU / Display uses and manipulates some data from memory
    modeClocks = [
        204,  // H-BLANK
        456, // V-BLANK
        80,   // OAM
        172,  // VRAM
    ];
    clock: number;
    currentLine: number; // Current line
    screen: ImageData;
    screenOld: ImageData;
    screenBuffer: number[][]; // Contains the current color (0, 1, 2, 3) at given pixel
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
    private scxReg: number;
    private scyReg: number;
    private lycReg: number;

    constructor(memory: Memory) {
        // LCDC Register
        this.displayEnabled = true;
        this.windowTileMapSelect = false;
        this.windowDisplayEnabled = false;
        this.bgWindowTileDataSelect = true;
        this.bgTileMapSelect = false;
        this.objSpriteSize = false;
        this.objSpriteDisplayEnable = false;
        this.bgDisplay = true;

        // STAT Register
        this.coincidenceInterruptEnable = false;
        this.mode2InterruptEnable = false;
        this.mode1InterruptEnable = false;
        this.mode0InterruptEnable = false;
        this.coincidenceFlag = false;

        // Hw registers
        this.lcdcReg = 0x91;
        this.scxReg = 0x0;
        this.scyReg = 0x0;
        this.lycReg = 0x0;

        // Others
        this.memory = memory;
        this.mode = 0;
        this.coincidenceFlag = false;

        this.clock = 0;
        this.currentLine = 0;
        this.tiles = [];
        this.screenBuffer = [];
    }

    handleMemoryRead(address: number): number {
        switch (address) {
            case memoryConstants.LCDC_REGISTER:
                return this.lcdc;
            case memoryConstants.STAT_REGISTER:
                return this.stat;
            case memoryConstants.SCY_REGISTER:
                return this.scy;
            case memoryConstants.SCX_REGISTER:
                return this.scx;
            case memoryConstants.LY_REGISTER:
                return this.ly;
            case memoryConstants.LYC_REGISTER:
                return this.lyc;
            default:
                throw 'This address is not in memory!';
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
            case memoryConstants.SCY_REGISTER:
                this.scy = value;
                break;
            case memoryConstants.SCX_REGISTER:
                this.scx = value;
                break;
            case memoryConstants.LY_REGISTER:
                this.ly = value;
                break;
            case memoryConstants.LYC_REGISTER:
                this.lyc = value;
                break;
            default:
                throw 'This address is not in memory!';
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
        this.bgTileMapSelect = (value & 0x08) > 0;
        this.objSpriteSize = (value & 0x04) > 0;
        this.objSpriteDisplayEnable = (value & 0x02) > 0;
        this.bgDisplay = (value & 0x01) > 0;

        if ((current & 0x80) === 0 && this.displayEnabled) {
            // Bit 7 reenabled -> reset ly
            this.currentLine = 0;
            this.updateLY();
        }

        this.lcdcReg = value;
    }

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
        return this.lycReg;
    }

    set lyc(value: number) {
        this.lycReg = 0;
    }

    get scy() {
        return this.scyReg;
    }

    set scy(value: number) {
        this.scyReg = value;
    }

    get scx() {
        return this.scxReg;
    }

    set scx(value: number) {
        this.scxReg = value;
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
                    this.clock -= this.modeClocks[LCDMode.READING_OAM];
                    this.mode = LCDMode.READING_OAM_VRAM;
                }
                break;
            case LCDMode.READING_OAM_VRAM:
                if (this.clock >= this.modeClocks[LCDMode.READING_OAM_VRAM]) {
                    this.clock -= this.modeClocks[LCDMode.READING_OAM_VRAM];
                    this.mode = LCDMode.H_BLANK;

                    // TODO: Render a line
                    this.renderLine();
                    this.updateCanvas();

                    if (this.mode0InterruptEnable) {
                        this.requestInterrupt(0);
                    }
                }
                break;
            case LCDMode.H_BLANK:
                if (this.clock >= this.modeClocks[LCDMode.H_BLANK]) {
                    this.clock -= this.modeClocks[LCDMode.H_BLANK];
                    this.currentLine++;

                    if (this.currentLine === this.displayLines - 1) {
                        this.mode = LCDMode.V_BLANK;
                        this.renderLine();

                        // this.renderBackground(); // DEBUG - TODO - DRAW LINE BY LINE
                        // if (this.windowDisplayEnabled) {
                        //     this.renderBackground(false);
                        // }
                        // if (this.objSpriteDisplayEnable) {
                        //     this.renderOAM();
                        // }
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
                        if (this.mode2InterruptEnable) {
                            this.requestInterrupt(1);
                        }
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

        for (let y = 0; y < 144; y++) {
            this.screenBuffer[y] = [];
            for (let x = 0; x < 160; x++) {
                this.screenBuffer[y][x] = 0;
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
        // this.screen = this.canvas.getImageData(0, 0, screenSize.FULL_WIDTH, screenSize.FULL_HEIGHT);
        this.screen = this.canvas.getImageData(0, 0, screenSize.WIDTH, screenSize.HEIGHT);
        this.screenOld = this.screen;
        this.initTiles();
        // this.initNintyLogo();
        this.renderBackground();
        this.updateCanvas();
    }

    renderBackground(bg = true) {
        const bgTileStart = (this.bgTileMapSelect && bg || this.windowTileMapSelect && !bg) ? 0x9C00 : 0x9800;
        const bgColorMap = this.colorMap(this.bgp);

        const startX = bg ? 0 : this.winx - 7;
        const startY = bg ? 0 : this.winy;

        for (let tileRow = startY; tileRow < 32; tileRow++) {
            for (let tileCol = startX; tileCol < 32; tileCol++) {
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

    renderOAM() {
        // Sprite Pattern Table: $8000 - $8FFF, unsigned
        // Sprite Attributes - OAM - $FE00 - FE9F
        for (let spriteIdx = 0; spriteIdx < 40; spriteIdx++) {
            const oamOffset = 0xFE00 + spriteIdx * 4;
            const posY = this.memory.read(oamOffset) - 16;
            const posX = this.memory.read(oamOffset + 1) - 8;
            const tileNumber = this.memory.read(oamOffset + 2);
            const flags = this.memory.read(oamOffset + 3);

            const upperTileNumber = this.objSpriteSize ? tileNumber & 0xFE : tileNumber;
            const lowerTileNumber = tileNumber | 0x01;

            const priority = getBit(flags, 7);
            const yFlip = getBit(flags, 6);
            const xFlip = getBit(flags, 5);
            const palleteNumber = getBit(flags, 4);

            const colors = this.colorMap(palleteNumber > 0 ? this.obp1 : this.obp0);

            for (let x = 0; x < 8; x++) {
                const actualX = posX + x;
                if (actualX >= 0 && actualX <= 160) {
                    for (let y = 0; y < 16; y++) {
                        const actualY = y + posY;
                        if (actualY >= 0 && actualY <= 140 && !(y > 7 && !this.objSpriteSize)) {
                            const tile = (y < 8) ? this.tiles[upperTileNumber] : this.tiles[lowerTileNumber];
                            const tileX = xFlip > 0 ? 7 - x : x;
                            let tileY = y & 0x7;
                            if (yFlip > 0) tileY = 7 - tileY;

                            const px = tile[tileY][tileX];
                            if (px > 0) {
                                const color = colors[px];
                                const canvasOffset = (this.scy + actualY) * 256 * 4 + (this.scx + actualX) * 4;
                                this.screen.data[canvasOffset] = color.red;
                                this.screen.data[canvasOffset + 1] = color.green;
                                this.screen.data[canvasOffset + 2] = color.blue;
                                this.screen.data[canvasOffset + 3] = color.alpha;
                            }
                        }
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

    renderLine() {
        const windowLine = this.currentLine;
        const virtualLine = (this.scy + windowLine) % 256;

        const bgTileStart = this.bgTileMapSelect ? 0x9C00 : 0x9800;
        const winTileStart = this.windowTileMapSelect ? 0x9C00 : 0x9800;
        const bgWinColorMap = this.colorMap(this.bgp);

        const windowX = this.winx;
        const windowY = this.winy;

        const insideWinY = this.windowDisplayEnabled && windowY <= windowLine;

        for (let x = 0; x < 160; x++) {
            const insideWinPx = insideWinY && windowX <= x + 7; // Display window, actually

            const virtualX = (this.scx + x) % 256;
            const tileMapIdx = Math.floor((insideWinPx ? windowLine : virtualLine) / 8) * 32
                + Math.floor((insideWinPx ? x : virtualX) / 8); // A bit redundant... TODO


            let tileIndex = this.memory.read((insideWinPx ? winTileStart : bgTileStart)  + tileMapIdx);

            // If using mode 8800, add 256 to skip first banks
            if (!this.bgWindowTileDataSelect && tileIndex < 128) {
                tileIndex += 256;
            }

            const canvasOffset = windowLine * 160 * 4 + x * 4;

            const colorNum = this.tiles[tileIndex][(insideWinPx ? windowLine : virtualLine) & 0x7][(insideWinPx ? x : virtualX) & 0x7];
            let color = bgWinColorMap[colorNum];
            this.screen.data[canvasOffset] = color.red;
            this.screen.data[canvasOffset + 1] = color.green;
            this.screen.data[canvasOffset + 2] = color.blue;
            this.screen.data[canvasOffset + 3] = color.alpha;

            // if (insideWinY && windowX <= x + 7) {
            //     let winTileIndex = this.memory.read(winTileStart + tileMapIdx);

            //     // If using mode 8800, add 256 to skip first banks
            //     if (!this.bgWindowTileDataSelect && winTileIndex < 128) {
            //         winTileIndex += 256;
            //     }

            //     const winColorNum = this.tiles[winTileIndex][virtualLine & 0x7][virtualX & 0x7];
            //     let winColor = bgWinColorMap[winColorNum];
            //     this.screen.data[canvasOffset] = winColor.red;
            //     this.screen.data[canvasOffset + 1] = winColor.green;
            //     this.screen.data[canvasOffset + 2] = winColor.blue;
            //     this.screen.data[canvasOffset + 3] = winColor.alpha;

            // }
        }

    }

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
        // let same = true;
        // for (let i = 0; i < this.screen.data.length; i++) {
        //     if (this.screen.data[i] !== this.screenOld.data[i]) {
        //         same = false;
        //     }
        // }

        // if (same) {
        //     console.log('Updated screen, but was the same...');
        // } else {
        //     console.log('Updated screen, not same!!!');
        // }

        // this.canvas.strokeStyle = 'black';
        // this.canvas.strokeRect(this.scx, this.scy, 160, 144);
        // const diffY = 255 - this.scy;
        // if (diffY < 144) {
        //     this.canvas.strokeRect(this.scx, 0, 160, 144 - diffY);
        // }
        // this.canvas.strokeRect(this.scx, this.scy, 160, 144);
        // this.screenOld = this.screen;
    }

    requestInterrupt(bitNumber) {
        const interruptFlag = this.memory.read(memoryConstants.INTERRUPT_FLAG_REGISTER);
        const modifiedFlag = modifyBit(interruptFlag, bitNumber, 1);
        if (modifiedFlag !== interruptFlag) {
            this.memory.write(memoryConstants.INTERRUPT_FLAG_REGISTER, modifiedFlag);
        }
    }
}