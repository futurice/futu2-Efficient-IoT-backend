'use strict';
const TEST_MESSAGE = { type: 'test-room', id: '1a', text:'text' };
const io = require('socket.io-client');
const socketURL = 'http://0.0.0.0:8080';
const should = require('should');
const { stream } = require('../config/index.js');
const assert = require('assert');
const sinon = require('sinon');
const fakeRedis = require('fakeRedis');
const options ={
  transports: ['websocket'],
  'force new connection': true
};
const redisClient = fakeRedis.createClient();
sinon.spy(redisClient, 'set');
sinon.stub(require('redis'), 'createClient').returns(redisClient);

describe('App', () => {

  before(() => {
    const app = require('../bin/www');
  });

  afterEach(done => {
    redisClient.flushdb(err => done());
  });

  describe('On "beacon" events', () => {

    it('should locate user', done => {
      /*
       Beacon locations (1,2,3) are in config/test.json
       ClientA location should be in the center: 2,2

       +---+---+---+
       |   |   |   |
       | 1 |   | 2 |
       |   |   |   |
       +-----------+
       |   |   |   |
       |   | A |   |
       |   |   |   |
       +-----------+
       |   |   |   |
       | 3 |   |   |
       |   |   |   |
       +---+---+---+
       */

      const CLIENT_A_LOCATION = { email: 'ClientA', x: 2, y: 2 };
      const clientA = io.connect(socketURL, options);
      const clientB = io.connect(socketURL, options);

      clientA.on('connect', () => {
        clientA.emit('beacon', { email: 'ClientA', id: 1, distance: 1, floor: 1 });
        clientA.emit('beacon', { email: 'ClientA', id: 2, distance: 1, floor: 1 });
        clientA.emit('beacon', { email: 'ClientA', id: 3, distance: 1, floor: 1 });

        clientA.on('location', message => {
          should(message).deepEqual(CLIENT_A_LOCATION);
          done();
        });

        clientA.disconnect();
      });

      clientB.on('location', message => {
        should(message).deepEqual(CLIENT_A_LOCATION);
        clientB.disconnect();
        done();
      });

    });

  });

  describe('On socket "message" event', () => {

    it('should publish messages', done => {
      const clientA = io.connect(socketURL, options);
      const clientB = io.connect(socketURL, options);

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

  describe('On "init" event', () => {

    it('should return messages from cache', done => {
      const client = io.connect(socketURL, options);
      redisClient.set(`${TEST_MESSAGE.type}:${TEST_MESSAGE.id}`, JSON.stringify(TEST_MESSAGE)); // set

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

});
