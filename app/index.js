const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const logger = require('morgan');
const Rx = require('rx');
const bodyParser = require('body-parser');
const { stream } = require('config');
const routes = require('app/routes');
const location = require('app/location');
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

app.io = socketIO();
app.io.on('error', () => console.log('user connection failed'));

const observableFromSocketEvent = event => socket => Rx.Observable.fromEvent(socket, event);
const connectionSource = observableFromSocketEvent('connection')(app.io.sockets);
const beaconSource = connectionSource.flatMap(observableFromSocketEvent('beacon'));
const messageSource = connectionSource.flatMap(observableFromSocketEvent('message'));

location.fromDeviceStream(beaconSource)
    .subscribe(
      location => app.io.emit('location', location),
      error => console.log(`location stream error:${error}`));

messageSource
  .bufferWithTime(stream.interval)
  .subscribeOnNext(
    messages => app.io.emit('stream', messages),
    error => console.log(`Stream error:${error}`));

module.exports = app;
