'use strict';
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const Rx = require('rx');
const Storage = require('app/storage');
const location = require('app/location');
const views = require('app/views');

// init app setup
const app = express();


// init cache storage
const appCache = new Storage();


// set up socket.IO
app.io = socketIO();
app.io.on('error', error => console.log(`Socket connection error: ${error}`));


// socket connection
app.io.on('connection', socket => {
  const listenerFor = observableFromSocketEvent(socket);
  publishLocation(listenerFor('beacon'));
  publishMessage(listenerFor('message'));
  sendInitData(listenerFor('init'),socket);
});

const observableFromSocketEvent = socket => event => Rx.Observable.fromEvent(socket, event);

const publishLocation = source => {
  location.fromDeviceStream(source)
    .subscribe(
      location => app.io.emit('location', location),
      error => console.error(`Location stream error:${error}`));
};

const publishMessage = source => {
  const setStorageSource = source.flatMap(message => appCache.set(message));

  setStorageSource
    .subscribe(
      value => app.io.emit('stream', [value]),
      error => console.error(`Stream error:${error}`)
    );
};

const sendInitData = (source, socket) => {
  const storageSource =
    source
      .flatMap(appCache.getAll());

  storageSource
    .subscribe(
      messages => socket.emit('state', messages),
      error => console.error(`Stream error:${error}`)
    );
};


// render test page
views.renderTestPage(app);


module.exports = app;
