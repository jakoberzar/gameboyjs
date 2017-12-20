import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { getBit, getBits, modifyBit, modifyBits, niceByteHexa } from './../src/helpers';

const expect = chai.expect;
chai.use(sinonChai);

describe('Helpers', () => {
    describe('niceByteHexa function', () => {
        it('should return a hex string for a normal byte', () => {
            let hex: string = niceByteHexa(255);
            expect(hex).to.equal('FF');
        });
        it('should return a hex string for a single-hex byte', () => {
            let hex: string = niceByteHexa(12);
            expect(hex).to.equal('0C');
        });
    });
    describe('getBit and modifyBit functions', () => {
        it('should get the correct bit', () => {
            let bit8 = 0b10101010;
            let bit16 = 0b1111000011110000;
            expect(getBit(bit8, 0)).to.be.equal(0);
            expect(getBit(bit8, 1)).to.be.equal(1);
            expect(getBit(bit8, 2)).to.be.equal(0);
            expect(getBit(bit8, 3)).to.be.equal(1);
            expect(getBit(bit8, 7)).to.be.equal(1);
            expect(getBit(bit16, 0)).to.be.equal(0);
            expect(getBit(bit16, 3)).to.be.equal(0);
            expect(getBit(bit16, 4)).to.be.equal(1);
            expect(getBit(bit16, 5)).to.be.equal(1);
            expect(getBit(bit16, 15)).to.be.equal(1);
        });
        it('should get the correct bits', () => {
            let bit8 = 0b10101010;
            let bit16 = 0b1111000011110000;
            expect(getBits(bit8, 0)).to.be.equal(0);
            expect(getBits(bit8, 1, 1)).to.be.equal(1);
            expect(getBits(bit8, 1, 0)).to.be.equal(0); // No bits selected
            expect(getBits(bit8, 2, 2)).to.be.equal(0b10);
            expect(getBits(bit8, 3, 3)).to.be.equal(0b101);
            expect(getBits(bit8, 7)).to.be.equal(1);
            expect(getBits(bit16, 0)).to.be.equal(0);
            expect(getBits(bit16, 3)).to.be.equal(0);
            expect(getBits(bit16, 8, 8)).to.be.equal(0b11110000);
            expect(getBits(bit16, 0, 8)).to.be.equal(0b11110000);
            expect(getBits(bit16, 0, 16)).to.be.equal(0b1111000011110000);
        });
        it('should modify the correct bit', () => {
            let bit8 = 0b10101010;
            let bit16 = 0b1111000011110000;
            expect(modifyBit(bit8, 0, 1)).to.be.equal(0b10101011);
            expect(modifyBit(bit8, 1, 1)).to.be.equal(0b10101010);
            expect(modifyBit(bit8, 2, 0)).to.be.equal(0b10101010);
            expect(modifyBit(bit8, 3, 1)).to.be.equal(0b10101010);
            expect(modifyBit(bit8, 7, 0)).to.be.equal(0b00101010);
            expect(modifyBit(bit16, 0, 1)).to.be.equal(0b1111000011110001);
            expect(modifyBit(bit16, 3, 0)).to.be.equal(0b1111000011110000);
            expect(modifyBit(bit16, 4, 1)).to.be.equal(0b1111000011110000);
            expect(modifyBit(bit16, 5, 0)).to.be.equal(0b1111000011010000);
            expect(modifyBit(bit16, 15, 0)).to.be.equal(0b0111000011110000);
        });
        it('should modify the correct bits', () => {
            let bit8 = 0b10101010;
            let bit16 = 0b1111000011110000;
            // TODO: Better tests
            expect(modifyBits(bit8, 0, 0b111, 3)).to.be.equal(0b10101111);
            expect(modifyBits(bit8, 1, 1, 1)).to.be.equal(0b10101010);
            expect(modifyBits(bit8, 3, 1, 1)).to.be.equal(0b10101010);
            expect(modifyBits(bit8, 7, 0, 1)).to.be.equal(0b00101010);
            expect(modifyBits(bit8, 5, 0b10, 2)).to.be.equal(0b11001010); // Modify bits 5-6
            expect(modifyBits(bit8, 0, 0b10111, 5)).to.be.equal(0b10110111); // Modify bits 0-4
            expect(modifyBits(bit16, 0, 1, 1)).to.be.equal(0b1111000011110001);
            expect(modifyBits(bit16, 3, 0, 1)).to.be.equal(0b1111000011110000);
            expect(modifyBits(bit16, 4, 1, 1)).to.be.equal(0b1111000011110000);
            expect(modifyBits(bit16, 5, 0, 1)).to.be.equal(0b1111000011010000);
            expect(modifyBits(bit16, 15, 0, 1)).to.be.equal(0b0111000011110000);
        });
    });
});