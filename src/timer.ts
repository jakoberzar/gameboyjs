import { memoryConstants } from './constants';
import { modifyBit } from './helpers';
import { Memory } from './memory';

enum TimerClocks {
    clock1024 = 0,
    clock16 = 1,
    clock64 = 2,
    clock256 = 3,
}

export class Timer {
    memory: Memory;

    clock: number;
    clock16: number;
    clock64: number;
    clock256: number;
    clock1024: number;

    timerEnabled: boolean;
    timerClock: TimerClocks;

    private divRegister: number;
    private timaRegister: number;
    private tmaRegister: number;
    private tacRegister: number;

    constructor (memory: Memory) {
        this.memory = memory;

        this.clock = 0;
        this.clock16 = 0;
        this.clock64 = 0;
        this.clock256 = 0;
        this.clock1024 = 0;

        this.timerEnabled = false;
        this.timerClock = 0;

        this.divRegister = 0;
        this.timaRegister = 0;
        this.tmaRegister = 0;
        this.tacRegister = 0;
    }

    handleMemoryRead(address: number): number {
        switch (address) {
            case memoryConstants.DIV_REGISTER:
                return this.div;
            case memoryConstants.TIMA_REGISTER:
                return this.tima;
            case memoryConstants.TMA_REGISTER:
                return this.tma;
            case memoryConstants.TAC_REGISTER:
                return this.tac;
            default:
                throw 'This is not Timer material!!!';
        }
    }

    handleMemoryWrite(address: number, value: number) {
        switch (address) {
            case memoryConstants.DIV_REGISTER:
                this.div = value;
                break;
            case memoryConstants.TIMA_REGISTER:
                this.tima = value;
                break;
            case memoryConstants.TMA_REGISTER:
                this.tma = value;
                break;
            case memoryConstants.TAC_REGISTER:
                this.tac = value;
                break;
            default:
                throw 'This is not Timer material!!!';
        }
    }

    get div() {
        return this.divRegister;
    }

    set div(value: number) {
        this.divRegister = 0;
    }

    get tima() {
        return this.timaRegister;
    }

    set tima(value: number) {
        this.timaRegister = value;
    }

    get tma() {
        return this.tmaRegister;
    }

    set tma(value: number) {
        this.tmaRegister = value;
    }

    get tac() {
        return this.tacRegister;
    }

    set tac(value: number) {
        this.timerClock = value & 0x3;
        this.timerEnabled = (value & 0x4) > 0;
        this.tacRegister = value;
    }

    updateClock(value: number) {
        this.clock += value;

        // Probably could've done this with a loop or some other way... Oh well
        if (this.clock >= 16) {
            this.clock -= 16;
            this.clock16++;
            this.increaseTimer(TimerClocks.clock16);

            if (this.clock16 >= 4) {
                this.clock16 -= 4;
                this.clock64++;
                this.increaseTimer(TimerClocks.clock64);

                if (this.clock64 >= 4) {
                    this.clock64 -= 4;
                    this.clock256++;
                    this.increaseTimer(TimerClocks.clock256);

                    this.divRegister++;
                    if (this.divRegister > 0xFF) {
                        this.divRegister = 0;
                    }

                    if (this.clock256 >= 4) {
                        this.clock256 -= 4;
                        this.clock1024++;
                        this.increaseTimer(TimerClocks.clock1024);
                    }
                }
            }
        }
    }

    increaseTimer(timerClock: TimerClocks) {
        if (this.timerEnabled && this.timerClock === timerClock) {
            this.timaRegister++;
            if (this.timaRegister > 0xFF) {
                // Overflow
                this.timaRegister = this.tmaRegister;
                // Request an interrupt
                const interruptFlag = this.memory.read(memoryConstants.INTERRUPT_FLAG_REGISTER);
                const modifiedFlag = modifyBit(interruptFlag, 2, 1);
                if (modifiedFlag !== interruptFlag) {
                    this.memory.write(memoryConstants.INTERRUPT_FLAG_REGISTER, modifiedFlag);
                }
            }
        }
    }
}