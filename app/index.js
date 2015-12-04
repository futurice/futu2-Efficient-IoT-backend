'use strict';
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const Rx = require('rx');
const Cache = require('app/cache');
const location = require('app/location');
const views = require('app/views');

// init app setup
const app = express();


// init cache storage
const appCache = new Cache();


// set up socket.IO
app.io = socketIO();
app.io.on('error', error => console.log(`Socket connection error: ${error}`));
app.io.on('connection', socket => {
  const observableFor = observableFromSocketEvent(socket);
  publishLocation(observableFor('beacon'));
  publishMessage(observableFor('message'));
  sendInitData(observableFor('init'), socket);
});

const observableFromSocketEvent = socket => event => Rx.Observable.fromEvent(socket, event);

const publishLocation = source => {
  location.fromDeviceStream(source)
    .subscribe(
      location => app.io.emit('location', location),
      error => console.error(`Location stream error:${error}`));
};

const publishMessage = source => {
  source
    .flatMap(message => appCache.set(message))
    .subscribe(
      value => app.io.emit('stream', [value]),
      error => console.error(`Stream error:${error}`)
    );
};

const sendInitData = (source, socket) => {
  source
    .flatMap(appCache.getAll.bind(appCache))
    .subscribe(
      messages => socket.emit('state', messages),
      error => console.error(`Init stream error:${error}`)
    );
};


// render test page
views.renderTestPage(app);


module.exports = app;
