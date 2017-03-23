import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { niceByteHexa } from './../src/helpers';

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
});