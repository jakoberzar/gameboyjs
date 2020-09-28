export const bootPCValue: number = 0x100;

class MemoryConstants {
    // TIMER AND DIVIDER
    DIV_REGISTER = 0xff04;
    TIMA_REGISTER = 0xff05;
    TMA_REGISTER = 0xff06;
    TAC_REGISTER = 0xff07;

    // IO
    INTERRUPT_FLAG_REGISTER = 0xff0f;

    // AUDIO
    // Channel 1 - Square 1
    NR10_REGISTER = 0xff10;
    NR11_REGISTER = 0xff11;
    NR12_REGISTER = 0xff12;
    NR13_REGISTER = 0xff13;
    NR14_REGISTER = 0xff14;
    // Channel 2 - Square 2
    NR21_REGISTER = 0xff16;
    NR22_REGISTER = 0xff17;
    NR23_REGISTER = 0xff18;
    NR24_REGISTER = 0xff19;
    // Channel 3 - Wave
    NR30_REGISTER = 0xff1a;
    NR31_REGISTER = 0xff1b;
    NR32_REGISTER = 0xff1c;
    NR33_REGISTER = 0xff1d;
    NR34_REGISTER = 0xff1e;
    // Channel 4 - Noise
    NR41_REGISTER = 0xff20;
    NR42_REGISTER = 0xff21;
    NR43_REGISTER = 0xff22;
    NR44_REGISTER = 0xff23;
    // Control / status
    NR50_REGISTER = 0xff24;
    NR51_REGISTER = 0xff25;
    NR52_REGISTER = 0xff26;
    // Wave table
    WAVE_TABLE_START = 0xff30;
    WAVE_TABLE_END = 0xff3f;

    // VIDEO
    LCDC_REGISTER = 0xff40;
    STAT_REGISTER = 0xff41;
    SCY_REGISTER = 0xff42;
    SCX_REGISTER = 0xff43;
    LY_REGISTER = 0xff44;
    LYC_REGISTER = 0xff45;
    WINY_REGISTER = 0xff4a;
    WINX_REGISTER = 0xff4b;
    BG_PALLETE_DATA_REGISTER = 0xff47;
    OB0_PALLETE_DATA_REGISTER = 0xff48;
    OB1_PALLETE_DATA_REGISTER = 0xff49;
}

class ScreenSize {
    WIDTH = 160;
    HEIGHT = 144;
    FULL_WIDTH = 256;
    FULL_HEIGHT = 256;
}

export let memoryConstants = new MemoryConstants();
export let screenSize = new ScreenSize();
