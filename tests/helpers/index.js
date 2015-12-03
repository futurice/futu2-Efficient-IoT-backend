'use strict';
const io = require('socket.io-client');
const sinon = require('sinon');
const fakeRedis = require('fakeRedis');

const socketURL = `http://0.0.0.0:${process.env.PORT}`;
var cache = null;

const helpers = {

  TEST_MESSAGE: {
    "type": "test-room",
    "id": "1a",
    "text": "text"
  },

  createSocketConnection: () => io.connect(socketURL, {
    transports: ['websocket'],
    'force new connection': true
  }),

  setupCache: () => {
    if (cache) {
      return cache;
    } else {
      cache = fakeRedis.createClient();
      sinon.spy(cache, 'set');
      const redisStub = sinon.stub(require('redis'), 'createClient').returns(cache);
      return cache;
    }
  },

  flushCache: done => {
    cache.flushdb(err => done());
  }

};

module.exports = helpers;
