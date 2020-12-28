import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';

import * as inst from './../src/instructions';

const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Instructions', () => {
    const i1: inst.Instruction = {
        byteLength: 1,
        op: inst.Opcode.INC,
        cycles: 4,
        operands: [inst.Operand.D],
    };
    const i2: inst.Instruction = {
        byteLength: 2,
        op: inst.Opcode.SRL,
        cycles: 8,
        operands: [inst.Operand.H],
    };
    describe('bytesToInstruction function', () => {
        it('should convert some bytes to instructions', () => {
            expect(inst.bytesToInstruction([0x14, 0x00])).to.deep.equal(i1);
            expect(inst.bytesToInstruction([0xcb, 0x3c])).to.deep.equal(i2);
        });
        it('should throw errors if not enough bytes given', () => {
            const errorString =
                'Not enough bytes given, always give at least 2!';
            const errorHandler = () => inst.bytesToInstruction([0x14]);
            expect(errorHandler).to.throw(errorString);
        });
    });

    describe('instructionToBytes function', () => {
        it('should translate instructions to bytes', () => {
            const i3 = inst.bytesToInstruction([0x14, 0x00]);
            const i4 = inst.bytesToInstruction([0xcb, 0x3c]);
            expect(inst.instructionToBytes(i3)).to.deep.equal([0x14]);
            expect(inst.instructionToBytes(i4)).to.deep.equal([0xcb, 0x3c]);
        });
    });

    // ReadableInstruction testing not done yet,
    // since it might get changed due to performance reasons soon.
});
