import 'mocha';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { CPU } from './../src/cpu';

const expect = chai.expect;
chai.use(sinonChai);

describe('CPU', () => {

  it('should write a message to console when initialized', sinon.test(function () {
    const clog = this.stub(console, 'log');
    const cpu = new CPU();
    expect(clog).to.be.calledWith('The CPU has been initialized! Again!');
  }));

});