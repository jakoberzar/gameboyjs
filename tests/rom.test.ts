import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';

import { Rom, RomInstruction } from './../src/rom';

import { basicInstructionSet } from './../src/instructions';

const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Rom', () => {
    // TODO: Make the test ROM include headers, so it doesn't fail other tests.
    const testRomArray = new Uint8Array([ // length of this is 0x90
        0x47, 0x11, 0x00, 0xC0, 0x0E, 0x10, 0x2A, 0x12, 0x1C, 0x20, 0xFB, 0x14, 0x0D, 0x20, 0xF7, 0x78,
        0xC3, 0x00, 0xC0, 0xD6, 0x05, 0x30, 0xFC, 0x1F, 0x30, 0x00, 0xCE, 0x01, 0xD0, 0xC8, 0x00, 0xC9,
        0xB7, 0xC8, 0xF5, 0x3E, 0xDF, 0xCD, 0x13, 0x02, 0xF1, 0x3D, 0x20, 0xF6, 0xC9, 0xB7, 0xC8, 0xF5,
        0x3E, 0xFF, 0xCD, 0x22, 0x02, 0x3E, 0xD4, 0xCD, 0x13, 0x02, 0xF1, 0x3D, 0x20, 0xF1, 0xC9, 0xF5,
        0x7C, 0xCD, 0x20, 0x02, 0x7D, 0xCD, 0x13, 0x02, 0xF1, 0xC9, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC9, 0x18, 0x00, 0x3E,
        0xFF, 0xE0, 0xC0, 0xE0, 0xC1, 0xE0, 0xC2, 0xE0, 0xC3, 0xC9, 0xF5, 0xC5, 0xD5, 0xE5, 0x21, 0xC3,
        0xFF, 0x46, 0x2D, 0x4E, 0x2D, 0x56, 0x2D, 0xAE, 0x26, 0x08, 0xCB, 0x38, 0xCB, 0x19, 0xCB, 0x1A,
        0x1F, 0x30, 0x10, 0x5F, 0x78, 0xEE, 0xED, 0x47, 0x79, 0xEE, 0xB8, 0x4F, 0x7A, 0xEE, 0x83, 0x57,
    ]);

    describe('at function', () => {
        const testRom = new Rom(testRomArray);
        it('should give the bytes at certain adresses', () => {
            expect(testRom.at(0x00)).to.equal(0x47);
            expect(testRom.at(0x6A)).to.equal(0xF5);
        });
        it('should return undefined if trying to reach unreachable address', () => {
            expect(testRom.at(-1)).to.be.undefined;
            expect(testRom.at(0x90)).to.be.undefined;
        });
    });

    describe('makeInstructions and instAt', () => {
        it('should return the instruction at given address' , async () => {
            const testRom = new Rom(testRomArray);
            await testRom.makeInstructions();
            let rins: RomInstruction = testRom.instAt(0x01);
            expect(rins.operandBytes.length).to.equal(2);
            expect(rins.operandBytes).to.deep.equal([0x00, 0xC0]);
            expect(rins.instruction).to.equal(basicInstructionSet[0x11]);
            expect(rins.address).to.equal(0x01);
        });
        it('should return null if the byte at address is not an instruction', async () => {
            const testRom = new Rom(testRomArray);
            await testRom.makeInstructions();
            let rins: RomInstruction = testRom.instAt(0x02);
            expect(rins).to.be.null;
        });
    });

    describe('take function', () => {
        const testRom = new Rom(testRomArray);
        it('should give the bytes at certain adresses', () => {
            expect(testRom.take(0x00, 5)).to.deep.equal([0x47, 0x11, 0x00, 0xC0, 0x0E]);
            expect(testRom.take(0x6A, 2)).to.deep.equal([0xF5, 0xC5]);
            expect(testRom.take(0x00, 0)).to.deep.equal([]);
        });
        it('should give zeros if going over bounds', () => {
            // This might be a bit unexpected, but it is actually planned.
            // It allows us to always take a certain amount of bits for instructions,
            // without any worry of errors.
            expect(testRom.take(-1, 2)).to.deep.equal([0, 0]);
            expect(testRom.take(0x90, 3)).to.deep.equal([0, 0, 0]);
            expect(testRom.take(0x8F, 2)).to.deep.equal([0x57, 0x00]);
        });
    });
});