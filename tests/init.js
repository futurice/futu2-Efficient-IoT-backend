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
    const client = helpers.createSocketConnection();

    cache.set(`${TEST_MESSAGE.type}:${TEST_MESSAGE.id}`, JSON.stringify(TEST_MESSAGE)); // set

    client.on('connect', () => {
      client.emit('init');
    });

    client.on('state', messages => {
      should(messages[0]).deepEqual(TEST_MESSAGE);
      client.disconnect();
      done();
    });

  });

});
