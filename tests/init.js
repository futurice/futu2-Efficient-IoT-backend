'use strict';
const should = require('should');
const assert = require('assert');
const helpers = require('./helpers/index');
const cache = helpers.setupCache();

describe('App: On "init" event', () => {

  before(() => {
    const app = require('../bin/www');
  });

  afterEach(helpers.flushCache);

  it('should return messages from cache', done => {
    const TEST_MESSAGE = helpers.TEST_MESSAGE;
    const clientA = helpers.createSocketConnection();
    const clientB = helpers.createSocketConnection();

    cache.set(`${TEST_MESSAGE.type}:${TEST_MESSAGE.id}`, JSON.stringify(TEST_MESSAGE)); // set

    clientA.on('connect', () => {
      clientA.emit('init');
    });

    clientA.on('state', messages => {
      should(messages[0]).deepEqual(TEST_MESSAGE);
      clientA.disconnect();
      done();
    });

  });

});
