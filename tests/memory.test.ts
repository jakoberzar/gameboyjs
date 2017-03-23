import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';

import { Memory } from './../src/memory';

const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Memory', () => {
    let m = new Memory();
});