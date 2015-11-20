const location = require('../app/bin/www');
const io = require('socket.io-client');
const socketURL = 'http://0.0.0.0:8080';
const should = require('should');
const options ={
  transports: ['websocket'],
  'force new connection': true
};

const beaconEvents = [
  { id: 1, distance: 1 },
  { id: 2, distance: 1 },
  { id: 3, distance: 1 }
];

describe("App", () => {

  it('should locate user', done => {
    const client = io.connect(socketURL, options);

    /*
     Location is should be in the center: 2,2
     +---+---+---+
     |   |   |   |
     | 2 |   | 3 |
     |   |   |   |
     +-----------+
     |   |   |   |
     |   | x |   |
     |   |   |   |
     +-----------+
     |   |   |   |
     | 1 |   |   |
     |   |   |   |
     +---+---+---+
     */

    client.on('connect', data => {
      client.emit('beacon', beaconEvents[0]);
      client.emit('beacon', beaconEvents[1]);
      client.emit('beacon', beaconEvents[2]);
    });

    client.on('location', message => {
      should(message.x).be.exactly(2);
      should(message.y).be.exactly(2);
      done();
      client.disconnect();
    });
  });
});
