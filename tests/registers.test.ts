import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';

import { Registers } from './../src/registers';

import { Operand } from './../src/instructions';

const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Registers', () => {
    let r: Registers = new Registers();
    it('should get and set registers', () => {
        r.set(Operand.A, 0xCC);
        expect(r.get(Operand.A)).to.equal(0xCC);
        r.set(Operand.E, 0xAB);
        expect(r.get(Operand.E)).to.equal(0xAB);
        r.set(Operand.D, 0xFF);
        expect(r.get(Operand.D)).to.equal(0xFF);
    });
    describe('Double registers', () => {
        it('should get double registers if set seperately', () => {
            r.set(Operand.A, 0xAB);
            r.set(Operand.F, 0xCD);
            expect(r.get(Operand.AF)).to.equal(0xABCD);
        });
        it('should set double registers and get seperately', () => {
            r.set(Operand.BC, 0xFEDC);
            expect(r.get(Operand.B)).to.equal(0xFE);
            expect(r.get(Operand.C)).to.equal(0xDC);
        });
    });
    describe('Test flags', () => {
        it('should set and get flags seperately', () => {
            // Zero flag
            r.set(Operand.F, 0);
            r.flagZ = true;
            expect(r.flagZ).to.be.true;
            expect(r.get(Operand.F)).to.equal(0b10000000);
            // Subtract flag
            r.set(Operand.F, 0);
            r.flagN = true;
            expect(r.flagN).to.be.true;
            expect(r.get(Operand.F)).to.equal(0b01000000);
            // Half Carry flag
            r.set(Operand.F, 0);
            r.flagH = true;
            expect(r.flagH).to.be.true;
            expect(r.get(Operand.F)).to.equal(0b00100000);
            // Carry flag
            r.set(Operand.F, 0);
            r.flagC = true;
            expect(r.flagC).to.be.true;
            expect(r.get(Operand.F)).to.equal(0b00010000);
        });
        it('should set and get multiple flags', () => {
            r.flagZ = true;
            r.flagC = true;
            expect(r.get(Operand.F)).to.equal(0b10010000);
            r.flagN = true;
            r.flagC = false;
            expect(r.get(Operand.F)).to.equal(0b11000000);
        });
    });
    describe('SP and PC registers', () => {
        it('should get and set like normal registers', () => {
            r.set(Operand.PC, 0xAB);
            expect(r.get(Operand.PC)).to.equal(0xAB);
            r.set(Operand.SP, 0xFF);
            expect(r.get(Operand.SP)).to.equal(0xFF);
        });
    });
    it('should increase the value of a register', () => {
        r.set(Operand.A, 0xAB);
        r.increase(Operand.A, 3);
        expect(r.get(Operand.A)).to.equal(0xAE);

        r.set(Operand.PC, 0xCDED);
        r.increase(Operand.PC);
        expect(r.get(Operand.PC)).to.equal(0xCDEE);
    });
});