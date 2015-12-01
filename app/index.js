'use strict';
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const logger = require('morgan');
const Rx = require('rx');
const bodyParser = require('body-parser');
const Storage = require('app/storage');
const routes = require('app/routes');
const location = require('app/location');

// init app
const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, './views/js')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/', routes);
app.use((err) => {
  logger('error:' + err.message);
});

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// init storage
const appStorage = new Storage();


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
    error => console.log(`Location stream error:${error}`));


// set data
const messageSource =
  connectionSource
    .flatMap(observableFromSocketEvent('message'));

const setStorageSource =
  messageSource
    .flatMap(message => appStorage.set(message));

setStorageSource
  .subscribe(
    value => app.io.emit('stream', [value]),
    error => console.log(`Stream error:${error}`)
  );

// init data for clients
const initSource = connectionSource.flatMap(observableFromSocketEvent('init'));
const storageSource =
  initSource
    .flatMap(val => appStorage.getAll());

storageSource
    .subscribe(
      messages => app.io.emit('state', messages),
      error => console.log(`Stream error:${error}`)
    );

module.exports = app;



