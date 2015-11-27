'use strict';
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const logger = require('morgan');
const Rx = require('rx');
const bodyParser = require('body-parser');
const bluebird = require('bluebird');
const redis = require('redis');
const { stream } = require('config');
const routes = require('app/routes');
const location = require('app/location');
const app = express();

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient();

// redis staff
const storeRedis = message => {
  const label = `${message.type}:${message.id}`;
  return redisClient.set([label, JSON.stringify(message)], (err, str) => {
    if (str) {
      console.log(`${label} saved to redis`);
      return message;
    } else {
      console.log(`error when saving ${label} to redis`);
      return null
    }
  });
};

const getAll = () => {
  redisClient.keys('*', (err, keys) => {
    if (keys) {
      return keys.map(key => {
        console.log(key);
        redisClient.get(key)
      });
    }
    return []
  });
};


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
app.io.on('error', error => console.log(`Socket connection error: ${error}`));
redisClient.on('error', error => console.log(`Redis connection error: ${error}`));


const observableFromSocketEvent = event => socket => Rx.Observable.fromEvent(socket, event);
const connectionSource = observableFromSocketEvent('connection')(app.io.sockets);

// Locations
const beaconSource = connectionSource.flatMap(observableFromSocketEvent('beacon'));
location.fromDeviceStream(beaconSource)
  .subscribe(
    location => app.io.emit('location', location),
    error => console.log(`Location stream error:${error}`));


// Messages
const cachedSource =
  connectionSource
    .flatMap(observableFromSocketEvent('message'))
    .map((message) => {
      if (storeRedis(message)){
        return message;
      } else {
        return null;
      }
    });

cachedSource
  .subscribe(
    messages => app.io.emit('stream', [messages]),
    error => console.log(`Stream error:${error}`)
  );


//Init
const initSource = connectionSource.flatMap(observableFromSocketEvent('init'));
const stateSource = Rx.Observable.fromCallback(getAll);

initSource
    .flatMap(stateSource)
    .subscribe(
      messages => {
        console.log(messages);
        app.io.emit('state', [messages])
      },
      error => console.log(`Stream error:${error}`)
    );

module.exports = app;



