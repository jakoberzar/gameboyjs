export const nintendoSplashGraphic: number[] = [
    0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B, 0x03, 0x73, 0x00, 0x83,
    0x00, 0x0C, 0x00, 0x0D, 0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E,
    0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99, 0xBB, 0xBB, 0x67, 0x63,
    0x6E, 0x0E, 0xEC, 0xCC, 0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E,
];

export const bootPCValue: number = 0x100;

class MemoryConstants {
    // TIMER AND DIVIDER
    DIV_REGISTER = 0xFF04;
    TIMA_REGISTER = 0xFF05;
    TMA_REGISTER = 0xFF06;
    TAC_REGISTER = 0xFF07;

    // IO
    INTERRUPT_FLAG_REGISTER = 0xFF0F;

    // AUDIO
    // Channel 1 - Square 1
    NR10_REGISTER = 0xFF10;
    NR11_REGISTER = 0xFF11;
    NR12_REGISTER = 0xFF12;
    NR13_REGISTER = 0xFF13;
    NR14_REGISTER = 0xFF14;
    // Channel 2 - Square 2
    NR21_REGISTER = 0xFF16;
    NR22_REGISTER = 0xFF17;
    NR23_REGISTER = 0xFF18;
    NR24_REGISTER = 0xFF19;
    // Channel 3 - Wave
    NR30_REGISTER = 0xFF1A;
    NR31_REGISTER = 0xFF1B;
    NR32_REGISTER = 0xFF1C;
    NR33_REGISTER = 0xFF1D;
    NR34_REGISTER = 0xFF1E;
    // Channel 4 - Noise
    NR41_REGISTER = 0xFF20;
    NR42_REGISTER = 0xFF21;
    NR43_REGISTER = 0xFF22;
    NR44_REGISTER = 0xFF23;
    // Control / status
    NR50_REGISTER = 0xFF24;
    NR51_REGISTER = 0xFF25;
    NR52_REGISTER = 0xFF26;
    // Wave table
    WAVE_TABLE_START = 0xFF30;
    WAVE_TABLE_END = 0xFF3F;

    // VIDEO
    LCDC_REGISTER = 0xFF40;
    STAT_REGISTER = 0xFF41;
    SCY_REGISTER = 0xFF42;
    SCX_REGISTER = 0xFF43;
    LY_REGISTER = 0xFF44;
    LYC_REGISTER = 0xFF45;
    WINY_REGISTER = 0xFF4A;
    WINX_REGISTER = 0xFF4B;
    BG_PALLETE_DATA_REGISTER = 0xFF47;
    OB0_PALLETE_DATA_REGISTER = 0xFF48;
    OB1_PALLETE_DATA_REGISTER = 0xFF49;
}

class ScreenSize {
    WIDTH = 160;
    HEIGHT = 144;
    FULL_WIDTH = 256;
    FULL_HEIGHT = 256;
}

export let memoryConstants = new MemoryConstants();
export let screenSize = new ScreenSize();