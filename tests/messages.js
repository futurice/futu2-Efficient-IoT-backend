const app = require('../app/bin/www');
const io = require('socket.io-client');
const socketURL = 'http://0.0.0.0:8080';
const should = require('should');
const { stream } = require('../config/index.js');
const options ={
  transports: ['websocket'],
  'force new connection': true
};

describe("App", () => {

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
