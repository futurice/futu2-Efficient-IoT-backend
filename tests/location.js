'use strict';
const io = require('socket.io-client');
const socketURL = 'http://0.0.0.0:8080';
const app = require('../bin/www');
const should = require('should');
const options ={
  transports: ['websocket'],
  'force new connection': true
};

describe("App", () => {

  const CLIENT_A_LOCATION = { email: 'ClientA', x: 2, y: 2 };
  const clientA = io.connect(socketURL, options);
  const clientB = io.connect(socketURL, options);

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
