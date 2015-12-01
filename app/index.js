'use strict';
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const logger = require('morgan');
const Rx = require('rx');
const bodyParser = require('body-parser');
const { stream } = require('config');
const AppStorage = require('app/storage');
const routes = require('app/routes');
const location = require('app/location');

// init app
const app = express();


// init storage
var appStorage = new AppStorage();


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


// set up socket.IO
app.io = socketIO();
app.io.on('error', error => console.log(`Socket connection error: ${error}`));


const observableFromSocketEvent = event => socket => Rx.Observable.fromEvent(socket, event);
const connectionSource = observableFromSocketEvent('connection')(app.io.sockets);

// Locations
const beaconSource = connectionSource.flatMap(observableFromSocketEvent('beacon'));
location.fromDeviceStream(beaconSource)
  .subscribe(
    location => app.io.emit('location', location),
    error => console.log(`Location stream error:${error}`));


// Messages
const messageSource =
  connectionSource
    .flatMap(observableFromSocketEvent('message'))
    .map(message => appStorage.set(message));


messageSource
  .subscribe(
    messages => app.io.emit('stream', [messages]),
    error => console.log(`Stream error:${error}`)
  );

//Init
const initSource = connectionSource.flatMap(observableFromSocketEvent('init'));
const storageSource = appStorage.getAll();

initSource
    .flatMap(storageSource) // only interested about when init happens
    .subscribe(
      messages => app.io.emit('state', messages),
      error => console.log(`Stream error:${error}`)
    );

module.exports = app;



