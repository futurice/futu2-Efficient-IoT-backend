'use strict';
const app = require('../bin/www');
const io = require('socket.io-client');
const socketURL = 'http://0.0.0.0:8080';
const should = require('should');
const { stream } = require('../config/index.js');
const options ={
  transports: ['websocket'],
  'force new connection': true
};

describe("App", () => {

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

  it('should publish messages', done => {
    const clientSending = io.connect(socketURL, options);
    const clientListening = io.connect(socketURL, options);
    const messageContent = { test: 'test', text:'text' };

    clientSending.on('connect', data => {
      clientSending.emit('message', messageContent);
    });

    clientSending.on('stream', message => {
      should(message[0]).deepEqual(messageContent);
    });

    clientListening.on('stream', message => {
      should(message[0]).deepEqual(messageContent);
      done();
    });

  });

});
