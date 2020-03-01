import { Memory } from './memory';
import { memoryConstants } from './constants';
import { getBit, getBits } from './helpers';

export class Audio {
    // Registers
    // Channel - Square 1
    nr10: number = 0;
    nr11: number = 0;
    nr12: number = 0;
    nr13: number = 0;
    nr14: number = 0;
    // Channel - Square 2
    nr21: number = 0;
    nr22: number = 0;
    nr23: number = 0;
    nr24: number = 0;
    // Channel - Wave
    nr30: number = 0;
    nr31: number = 0;
    nr32: number = 0;
    nr33: number = 0;
    nr34: number = 0;
    // Channel - Noise
    nr41: number = 0;
    nr42: number = 0;
    nr43: number = 0;
    nr44: number = 0;
    // Control / status
    nr50: number = 0;
    nr51: number = 0;
    nr52: number = 0;

    // Wave table
    waveTable: number[];

    // Oscilators
    oscilators: OscillatorNode[];
    oscilatorsRunning: boolean[];

    // Audio context
    audioCtx: AudioContext;

    // Timers - CPU is 4194304, we need a 512Hz timer;
    internalTimer: number; // 512 Hz, we reset it every 8192 clocks
    timerTimesHit512: number; // The number of times 512 was hit.
    lengthCounters: number[]; // Length counter for every counter


    constructor(memory: Memory) {
        this.waveTable = new Array(0x10);
        this.oscilators = [];
        this.oscilatorsRunning = [];
        this.internalTimer = 0;
        this.timerTimesHit512 = 0;
        this.lengthCounters = [];

        this.audioCtx = new (window.AudioContext)(); // TODO: webkitAudioContext
        // Create oscilators
        for (let i = 0; i < 4; i++) {
            const oscilator = this.audioCtx.createOscillator();
            setTimeout(() => oscilator.start(), 5000);
            this.oscilators.push(oscilator);
            this.oscilatorsRunning.push(false);
            this.lengthCounters.push(0);
        }
        this.oscilators[0].type = 'square';
        this.oscilators[1].type = 'square';
    }


    handleMemoryRead(address: number): number {
        switch (address) {
            case memoryConstants.NR10_REGISTER:
                return this.nr10;
            case memoryConstants.NR11_REGISTER:
                return this.nr11;
            case memoryConstants.NR12_REGISTER:
                return this.nr12;
            case memoryConstants.NR13_REGISTER:
                return this.nr13;
            case memoryConstants.NR14_REGISTER:
                return this.nr14;
            case memoryConstants.NR21_REGISTER:
                return this.nr21;
            case memoryConstants.NR22_REGISTER:
                return this.nr22;
            case memoryConstants.NR23_REGISTER:
                return this.nr23;
            case memoryConstants.NR24_REGISTER:
                return this.nr24;
            case memoryConstants.NR30_REGISTER:
                return this.nr30;
            case memoryConstants.NR31_REGISTER:
                return this.nr31;
            case memoryConstants.NR32_REGISTER:
                return this.nr32;
            case memoryConstants.NR33_REGISTER:
                return this.nr33;
            case memoryConstants.NR34_REGISTER:
                return this.nr34;
            case memoryConstants.NR41_REGISTER:
                return this.nr41;
            case memoryConstants.NR42_REGISTER:
                return this.nr42;
            case memoryConstants.NR43_REGISTER:
                return this.nr43;
            case memoryConstants.NR44_REGISTER:
                return this.nr44;
            case memoryConstants.NR50_REGISTER:
                return this.nr50;
            case memoryConstants.NR51_REGISTER:
                return this.nr51;
            case memoryConstants.NR52_REGISTER:
                return this.nr52;
            default:
                if (address > memoryConstants.WAVE_TABLE_START && address <= memoryConstants.WAVE_TABLE_END) {
                    return this.waveTable[address - memoryConstants.WAVE_TABLE_START];
                }

                throw new Error('This address is not in memory!');
        }
    }

    handleMemoryWrite(address: number, value: number) {
        switch (address) {
            case memoryConstants.NR10_REGISTER:
                this.nr10 = value;
                break;
            case memoryConstants.NR11_REGISTER:
                this.nr11 = value;
                this.updateChannelLengthCounter(0);
                break;
            case memoryConstants.NR12_REGISTER:
                this.nr12 = value;
                break;
            case memoryConstants.NR13_REGISTER:
                this.nr13 = value;
                this.updateChannelFrequency(0);
                break;
            case memoryConstants.NR14_REGISTER:
                this.nr14 = value;
                this.updateChannelTrigger(0);
                this.updateChannelFrequency(0);
                break;
            case memoryConstants.NR21_REGISTER:
                this.nr21 = value;
                this.updateChannelLengthCounter(1);
                break;
            case memoryConstants.NR22_REGISTER:
                this.nr22 = value;
                break;
            case memoryConstants.NR23_REGISTER:
                this.nr23 = value;
                this.updateChannelFrequency(1);
                break;
            case memoryConstants.NR24_REGISTER:
                this.nr24 = value;
                this.updateChannelTrigger(1);
                this.updateChannelFrequency(1);
                break;
            case memoryConstants.NR30_REGISTER:
                this.nr30 = value;
                break;
            case memoryConstants.NR31_REGISTER:
                this.nr31 = value;
                this.updateChannelLengthCounter(2);
                break;
            case memoryConstants.NR32_REGISTER:
                this.nr32 = value;
                break;
            case memoryConstants.NR33_REGISTER:
                this.nr33 = value;
                this.updateChannelFrequency(2);
                break;
            case memoryConstants.NR34_REGISTER:
                this.nr34 = value;
                this.updateChannelTrigger(2);
                this.updateChannelFrequency(2);
                break;
            case memoryConstants.NR41_REGISTER:
                this.nr41 = value;
                this.updateChannelLengthCounter(3);
                break;
            case memoryConstants.NR42_REGISTER:
                this.nr42 = value;
                break;
            case memoryConstants.NR43_REGISTER:
                this.nr43 = value;
                break;
            case memoryConstants.NR44_REGISTER:
                this.nr44 = value;
                this.updateChannelTrigger(3);
                break;
            case memoryConstants.NR50_REGISTER:
                this.nr50 = value;
                break;
            case memoryConstants.NR51_REGISTER:
                this.nr51 = value;
                break;
            case memoryConstants.NR52_REGISTER:
                this.nr52 = value;
                break;
            default:
                if (address >= memoryConstants.WAVE_TABLE_START && address <= memoryConstants.WAVE_TABLE_END) {
                    this.waveTable[address - memoryConstants.WAVE_TABLE_START] = value;
                    break;
                }

                throw new Error(`This address (${address.toString(16)}) is not in memory!`);
        }
    }

    /**
     * The system has passed some time, update any timers and clock-dependant behaviour
     * @param value Amount of clocks passed
     */
    updateClock(value: number): void {
        this.internalTimer += value;
        while (this.internalTimer >= 8192) {
            if (this.timerTimesHit512 % 2 === 0) {
                // 256 Hz timer, length control
                for (let i = 0; i < 4; i++) {
                    if (this.lengthCounters[i] > 1) {
                        this.lengthCounters[i] -= 1;
                    } else if (this.lengthCounters[i] === 1) {
                        if (this.lengthStopEnabled(i) && this.oscilatorsRunning[i]) {
                            this.oscilators[i].disconnect(this.audioCtx.destination); // TODO: Change to just volume 0
                            this.oscilatorsRunning[i] = false;
                        }
                        this.lengthCounters[i] = 0;
                    }
                }
            }
            if (this.timerTimesHit512 % 4 === 2) {
                // 128 Hz timer, frequency sweep
            }
            if (this.timerTimesHit512 % 8 === 7) {
                // 64 Hz timer, volume envelope
            }
            this.internalTimer -= 8192;
            // this.timerTimesHit512 = (this.timerTimesHit512 + 1) % 8;
        }

    }

    updateChannelTrigger(channel: number) {
        if (channel > 1) return; // TODO: Remove when implementing channel 2 and 3!!!
        let regValue = 0;
        switch (channel) {
            case 0:
                regValue = this.nr14;
                break;
            case 1:
                regValue = this.nr24;
                break;
            case 2:
                regValue = this.nr34;
                break;
            case 3:
                regValue = this.nr44;
                break;
            default:
                throw new Error('Invalid channel chosen when checking for a trigger!');
        }
        const trigger = getBit(regValue, 7);
        if (trigger > 0 && !this.oscilatorsRunning[channel]) {
            this.oscilatorsRunning[channel] = true;
            this.oscilators[channel].connect(this.audioCtx.destination);
            if (this.lengthCounters[channel] === 0) {
                if (channel === 2) {
                    this.lengthCounters[channel] = 256;
                } else {
                    this.lengthCounters[channel] = 64;
                }
            }
            this.internalTimer = 0;
            this.timerTimesHit512 = 0;
            console.log('ok.start.', trigger, this.oscilatorsRunning[channel]);
        } else if (trigger === 0 && this.oscilatorsRunning[channel]) {
            this.oscilators[channel].disconnect(this.audioCtx.destination);
            this.oscilatorsRunning[channel] = false;
            console.log('ok.stop.', trigger, this.oscilatorsRunning[channel]);
        } else {
            console.log('in else...', trigger, this.oscilatorsRunning[channel]);
        }
    }

    updateChannelFrequency(channel: number) {
        let frequencyLSBReg = 0;
        let frequencyMSBReg = 0;
        switch (channel) {
            case 0:
                frequencyLSBReg = this.nr13;
                frequencyMSBReg = this.nr14;
                break;
            case 1:
                frequencyLSBReg = this.nr23;
                frequencyMSBReg = this.nr24;
                break;
            case 2:
                frequencyLSBReg = this.nr33;
                frequencyMSBReg = this.nr34;
                break;
            default:
                throw new Error('Invalid channel chosen when checking for a frequency update!');
        }
        const regFrequency = getBits(frequencyMSBReg, 0, 3) * 256 + frequencyLSBReg;
        const frequency = 131072 / (2048 - regFrequency);
        console.log(getBits(frequencyMSBReg, 0, 3), frequencyLSBReg, regFrequency, frequency);
        this.oscilators[channel].frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    }

    updateChannelLengthCounter(channel: number) {
        let length = 0;
        switch (channel) {
            case 0:
                length = 64 - getBits(this.nr11, 0, 6);
                break;
            case 1:
                length = 64 - getBits(this.nr21, 0, 6);
                break;
            case 2:
                length = 256 - getBits(this.nr31, 0, 8);
                break;
            case 3:
                length = 64 - getBits(this.nr41, 0, 6);
                break;
            default:
                throw new Error('Invalid channel chosen when checking for a length counter!');
        }

        this.lengthCounters[channel] = length;
    }

    lengthStopEnabled(channel: number): boolean {
        switch (channel) {
            case 0:
                return getBit(this.nr14, 6) === 1;
            case 1:
                return getBit(this.nr24, 6) === 1;
            case 2:
                return getBit(this.nr34, 6) === 1;
            case 3:
                return getBit(this.nr44, 6) === 1;
            default:
                throw new Error('Invalid channel chosen when looking for length enable!');
        }
    }
}