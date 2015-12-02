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


// render test page
views.renderTestPage(app);


// init cache storage
const appCache = new Storage();


// set up socket.IO
app.io = socketIO();
app.io.on('error', error => console.log(`Socket connection error: ${error}`));


// socket connection
const observableFromSocketEvent = event => socket => Rx.Observable.fromEvent(socket, event);
const connectionSource = observableFromSocketEvent('connection')(app.io.sockets);


// get location by beacon
const beaconSource = connectionSource.flatMap(observableFromSocketEvent('beacon'));
location.fromDeviceStream(beaconSource)
  .subscribe(
    location => app.io.emit('location', location),
    error => console.error(`Location stream error:${error}`));


// set data
const messageSource = connectionSource.flatMap(observableFromSocketEvent('message'));
const setStorageSource = messageSource.flatMap(message => appCache.set(message));

setStorageSource
  .subscribe(
    value => app.io.emit('stream', [value]),
    error => console.error(`Stream error:${error}`)
  );

// init data for clients
const initSource = connectionSource.flatMap(observableFromSocketEvent('init'));
const storageSource =
  initSource
    .flatMap(val => appCache.getAll());

storageSource
    .subscribe(
      messages => app.io.emit('state', messages),
      error => console.error(`Stream error:${error}`)
    );

module.exports = app;
