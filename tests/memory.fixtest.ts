import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';

import { Rom } from '../src/rom';
import { Memory } from './../src/memory';

const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Memory', () => {
    const testRomArray = new Uint8Array([
       0x31, 0xFE, 0xFF, 0xAF, 0x21, 0xFF, 0x9F, 0x32, 0xCB, 0x7C,
    ]);
    const rom = new Rom(testRomArray);

    const memory = new Memory();
    memory.setRom(rom);

    describe('readMultiple function', () => {
        it('should transform little endian to big endian by default', () => {
            expect(memory.readMultiple(0x01, 2)).to.deep.equal([0xFF, 0xFE]);
        });
        it('should not transform endian if requested', () => {
            expect(memory.readMultiple(0x08, 2, true)).to.deep.equal([0xCB, 0x7C]);
        });
    });
});