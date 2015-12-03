'use strict';
const should = require('should');
const assert = require('assert');
const helpers = require('./helpers/index');
const cache = helpers.setupCache();

describe('App: On socket "message" event', function() {

  before(() => {
    const app = require('../bin/www');
  });

  afterEach(helpers.flushCache);

  it('should publish messages', done => {
    const TEST_MESSAGE = helpers.TEST_MESSAGE;
    const clientA = helpers.createSocketConnection();
    const clientB = helpers.createSocketConnection();

    clientA.on('connect', () => {
      clientA.emit('message', TEST_MESSAGE);
    });

    clientA.on('stream', message => {
      should(message[0]).deepEqual(TEST_MESSAGE);
    });

    clientB.on('stream', message => {
      should(message[0]).deepEqual(TEST_MESSAGE);
      clientA.disconnect();
      clientB.disconnect();
      done();
    });

  });

});
