import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinonChai from 'sinon-chai';

import { } from './../src/file';

const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('File', () => {
    // I'm not sure there's a good way to test ByteFileReader without repeating the same code.
    // therefore no tests for now.
});