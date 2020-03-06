import { Memory } from './memory';
import { memoryConstants } from './constants';
import { getBit, getBits, modifyBits } from './helpers';
import * as fft from 'jsfft';
import { NumberTMap } from './ts-helpers/common-interfaces';

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
    // Gain nodes
    gains: GainNode[];
    // Noise buffer
    noiseBuffer: AudioBufferSourceNode;
    noiseBufferPlayed: boolean;
    noiseBufferIsPlaying: boolean;

    // Audio context
    audioCtx: AudioContext;

    // Timers - CPU is 4194304, we need a 512Hz timer;
    internalTimer: number; // 512 Hz, we reset it every 8192 clocks
    timerTimesHit512: number; // The number of times 512 was hit.
    lengthCounters: number[]; // Length counter for every counter
    volumeTimers: number[]; // Volume envelope timers
    freqSweepTimer: number; // Frequency sweep timer for channel 1

    noiseMap: NumberTMap<Uint8Array>; // Map of stored buffers
    noiseBufferMap: NumberTMap<Uint8Array>; // Map of stored buffers
    lastPlayedBuffer: number;

    constructor(memory: Memory) {
        this.waveTable = new Array(0x10);
        this.oscilators = [];
        this.oscilatorsRunning = [];
        this.gains = [];
        this.internalTimer = 0;
        this.timerTimesHit512 = 0;
        this.lengthCounters = [];
        this.volumeTimers = [];
        this.freqSweepTimer = 0;
        this.noiseMap = [];
        this.noiseBufferMap = [];
        this.lastPlayedBuffer = -1;

        this.audioCtx = new (window.AudioContext)(); // TODO: webkitAudioContext

        // Create gains and length counters
        for (let i = 0; i < 4; i++) {
            const gain = this.audioCtx.createGain();
            gain.gain.value = 1;
            gain.connect(this.audioCtx.destination);
            this.gains.push(gain);

            this.oscilatorsRunning.push(false);
            this.lengthCounters.push(0);
            this.volumeTimers.push(0);
        }

        // Create oscilators
        for (let i = 0; i < 3; i++) {
            const oscilator = this.audioCtx.createOscillator();

            setTimeout(() => oscilator.start(), 5000);
            this.oscilators.push(oscilator);
        }
        this.oscilators[0].type = 'square';
        this.oscilators[1].type = 'square';
        this.oscilators[2].type = 'square';
        // Create noise channel
        this.noiseBuffer = this.audioCtx.createBufferSource();
        this.noiseBufferPlayed = false;
        this.noiseBufferIsPlaying = false;
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
                if (address >= memoryConstants.WAVE_TABLE_START && address <= memoryConstants.WAVE_TABLE_END) {
                    return this.waveTable[address - memoryConstants.WAVE_TABLE_START];
                } else if (address >= 0xFF10 && address <= 0xFF3F) {
                    // Just an unused audio register
                    return 0;
                }

                throw new Error(`This address (${address.toString(16)}) is not in memory!`);
        }
    }

    handleMemoryWrite(address: number, value: number) {
        switch (address) {
            case memoryConstants.NR10_REGISTER:
                this.nr10 = value;
                this.updateFrequencySweep();
                break;
            case memoryConstants.NR11_REGISTER:
                this.nr11 = value;
                this.updateChannelLengthCounter(0);
                break;
            case memoryConstants.NR12_REGISTER:
                this.nr12 = value;
                this.updateVolumeEnvelope(0);
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
                this.updateVolumeEnvelope(1);
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
                this.updateVolumeEnvelope(2);
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
                this.updateVolumeEnvelope(3);
                break;
            case memoryConstants.NR43_REGISTER:
                this.nr43 = value;
                this.updateNoiseChannel();
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
                    this.updateWaveChannel();
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
                            if (i !== 3) {
                                this.oscilators[i].disconnect(this.gains[i]); // Or, somehow make output to 0 in other way?
                            } else {
                                this.noiseBuffer.disconnect(this.gains[i]);
                                this.noiseBuffer.stop();
                                this.noiseBufferIsPlaying = false;
                            }
                            this.oscilatorsRunning[i] = false;
                        }
                        this.lengthCounters[i] = 0;
                    }
                }
            }
            if (this.timerTimesHit512 % 4 === 2) {
                // 128 Hz timer, frequency sweep
                this.performFrequencySweep(); // Only in pulse channel 1
            }
            if (this.timerTimesHit512 % 8 === 7) {
                // 64 Hz timer, volume envelope
                this.performVolumeEnvelopeSweep(0);
                this.performVolumeEnvelopeSweep(1);
                // No volume envelope for channel 3
                this.performVolumeEnvelopeSweep(3);
            }
            this.internalTimer -= 8192;
            this.timerTimesHit512 = (this.timerTimesHit512 + 1) % 8;
        }

    }

    updateChannelTrigger(channel: number) {
        if (channel > 2) return; // TODO: Currently noise channel disabled for performance reasons
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

            if (channel !== 3) {
                this.oscilators[channel].connect(this.gains[channel]);
            } else {
                // this.noiseBuffer.connect(this.gains[channel]);
                this.updateNoiseChannel();
            }

            if (this.lengthCounters[channel] === 0) {
                if (channel === 2) {
                    this.lengthCounters[channel] = 256;
                } else {
                    this.lengthCounters[channel] = 64;
                }
            }

            this.internalTimer = 0;
            this.timerTimesHit512 = 0;
            console.error('ok.start.', channel, trigger, this.oscilatorsRunning[channel]);
        } else if (trigger === 0 && this.oscilatorsRunning[channel]) {
            if (channel !== 3) {
                this.oscilators[channel].disconnect(this.gains[channel]);
            } else {
                this.noiseBuffer.disconnect(this.gains[channel]);
                this.noiseBuffer.stop();
                this.noiseBufferIsPlaying = false;
            }
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
        let frequency;
        if (channel < 2) {
            frequency = 131072 / (2048 - regFrequency);
        } else {
            frequency = 65536 / (2048 - regFrequency);
        }
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

    updateVolumeEnvelope(channel: number) {
        let envelopeReg = 0;
        switch (channel) {
            case 0:
                envelopeReg = this.nr12;
                break;
            case 1:
                envelopeReg = this.nr22;
                break;
            case 2:
                // TODO: Move the code for this in a seperate function?
                envelopeReg = this.nr32;
                const volumeBits = getBits(envelopeReg, 5, 2);
                let waveVolume;
                if (volumeBits === 0) {
                    waveVolume = 0;
                } else if (volumeBits === 1) {
                    waveVolume = 1;
                } else if (volumeBits === 2) {
                    waveVolume = 0.5;
                } else if (volumeBits === 3) {
                    waveVolume = 0.25;
                } else {
                    throw new Error('Invalid value of volume bits!');
                }
                this.gains[channel].gain.setValueAtTime(waveVolume, this.audioCtx.currentTime);
                return;
            case 3:
                envelopeReg = this.nr42;
                break;
            default:
                throw new Error('Invalid channel chosen when checking for volume envelope!');
        }

        const startingVolume = getBits(envelopeReg, 4, 4) / 15.0;
        this.gains[channel].gain.setValueAtTime(startingVolume, this.audioCtx.currentTime);
        const period = getBits(envelopeReg, 0, 3);
        this.volumeTimers[channel] = period;
    }

    updateFrequencySweep() {
        const freqReg = this.nr10;
        const period = getBits(freqReg, 4, 3);
        this.freqSweepTimer = period;
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

    performVolumeEnvelopeSweep(channel: number) {
        let envelopeReg = 0;
        switch (channel) {
            case 0:
                envelopeReg = this.nr12;
                break;
            case 1:
                envelopeReg = this.nr22;
                break;
            case 2:
                return; // No envelope sweep
            case 3:
                envelopeReg = this.nr42;
                break;
            default:
                throw new Error('Invalid channel chosen when checking for volume envelope - sweep!');
        }

        const envelopeDirection = getBit(envelopeReg, 3);
        const sweepNumber = getBits(envelopeReg, 0, 3);

        if (sweepNumber === 0) return; // Volume sweep is disabled

        if (this.volumeTimers[channel] > 1) {
            this.volumeTimers[channel] -= 1;
            return;
        }

        // Reload the timer
        this.volumeTimers[channel] = sweepNumber;

        // Perform the volume sweep
        const currentVolume = this.gains[channel].gain.value;
        let newVolume;
        if (envelopeDirection === 0) {
            newVolume = currentVolume - 1 / 15.0;
        } else {
            newVolume = currentVolume + 1 / 15.0;
        }
        if (newVolume >= 0 && newVolume <= 1) {
            this.gains[channel].gain.setValueAtTime(newVolume, this.audioCtx.currentTime);
        }
    }


    performFrequencySweep() {
        const currentReg = this.nr10;
        const sweepTime = getBits(currentReg, 4, 3);
        const envelopeDirection = getBit(currentReg, 3);
        const sweepNumber = getBits(currentReg, 0, 3);

        if (sweepTime === 0) return; // Sweep is off

        if (this.freqSweepTimer > 1) {
            this.freqSweepTimer -= 1;
            return;
        }

        // Reload the timer
        this.freqSweepTimer = sweepTime;

        // Perform the frequency sweep
        const currentRegFrequency = getBits(this.nr14, 0, 3) * 256 + this.nr13;
        let newFrequency;
        if (envelopeDirection === 0) {
            newFrequency = currentRegFrequency + (currentRegFrequency >> sweepNumber);
        } else {
            newFrequency = currentRegFrequency - (currentRegFrequency >> sweepNumber);
        }
        if (newFrequency > 2047) {
            // Channel becomes disabled
            this.oscilators[0].disconnect(this.gains[0]);
            this.oscilatorsRunning[0] = false;
        }
        if (newFrequency >= 0 && newFrequency <= 2047) {
            this.nr13 = newFrequency & 0xFF;
            this.nr14 = modifyBits(this.nr14, 0, getBits(newFrequency, 8, 3), 3);
            const frequency = 131072 / (2048 - newFrequency);
            this.oscilators[0].frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        }
    }

    updateWaveChannel() {
        // Duplicate each sample 8 times, to get a more accurate sound from transformation
        const times = 16;
        const fptable = new Float32Array(32 * times);
        for (let i = 0; i < this.waveTable.length; i++) {
            const byte = this.waveTable[i];
            const sample1 = getBits(byte, 4, 4);
            const sample2 = getBits(byte, 0, 4);
            for (let j = 0; j < times; j++) {
                fptable[i * 2 * times + j] = sample1;
                fptable[i * 2 * times + times + j] = sample2;
            }
        }

        const complexTable = new fft.ComplexArray(32 * times).map((value, i , n) => {
            value.real = fptable[i];
        });

        console.log(this.waveTable, fptable, complexTable);

        const frequencies = fft.FFT(complexTable);

        console.log('result', frequencies);

        const wave = this.audioCtx.createPeriodicWave(frequencies.real, frequencies.imag);
        this.oscilators[2].setPeriodicWave(wave);
    }

    updateNoiseChannel() {
        return; // Currently disabled for performance reasons
        const reg = this.nr43;

        const shiftClockFreq = getBits(reg, 4, 4);
        const step = getBit(reg, 3);
        let dividingRatio = getBits(reg, 0, 3);
        if (dividingRatio === 0) dividingRatio = 0.5;
        const frequency = 524288 / dividingRatio / (1 << (shiftClockFreq + 1));


        let buffer;
        if (reg in this.noiseBufferMap) {
            console.error('Noise buffer hit at ' + reg);
            buffer = this.noiseBufferMap[reg];
        } else {
            let samples;
            if (reg in this.noiseMap) {
                console.error('Samples hit at ' + reg);
                samples = this.noiseMap[reg];
            } else {
                console.error('Samples not hit at ' + reg);
                samples = new Uint8Array(frequency);
                let LFSR = Math.floor(Math.random() * ((1 << 15) - 1));
                for (let i = 0; i < frequency; i++) {
                    LFSR += 1;
                    const lowbits = getBit(LFSR, 0) ^ getBit(LFSR, 1);
                    LFSR = LFSR >> 1;
                    LFSR += lowbits * (1 << 14);
                    if (step === 1) {
                        LFSR = (LFSR & 0xFFBF) | lowbits;
                    }
                    const output = 1 - (LFSR & 0x1);
                    samples[i] = output;
                }
                this.noiseMap[reg] = samples;
            }

            const noiseLength = 1
            const bufferSize = this.audioCtx.sampleRate * noiseLength;
            buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            const ratio = frequency / bufferSize;
            if (ratio > 1) {
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = samples[Math.floor(i * ratio)];
                }
            } else {
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = samples[Math.floor(i * bufferSize / frequency)];
                }
            }

            console.error('Noise buffer not hit at ' + reg);
            this.noiseBufferMap[reg] = buffer;
        }


        if (this.noiseBufferIsPlaying) {
            this.noiseBuffer.stop();
            this.noiseBuffer.disconnect(this.gains[3]);
        }

        this.noiseBuffer = this.audioCtx.createBufferSource();
        this.noiseBuffer.buffer = buffer;
        if (this.oscilatorsRunning[3]) {
            this.noiseBuffer.connect(this.gains[3]);
            this.noiseBuffer.start();
            this.noiseBufferIsPlaying = true;
            this.noiseBufferPlayed = true;
            this.lastPlayedBuffer = reg;
        }
    }
}