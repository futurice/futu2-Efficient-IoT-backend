#!/usr/bin/env node
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const grid = require('./grid/grid');
const { beacons } = require('./config');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routes);
app.use((err, req, res, next) => {
  logger('error:' + err.message);
});

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.io = socketIO();

const sgrid = grid.create(10,4);
console.log(grid.position(sgrid, [{ id:1, distance: 2.3 }, { id:2, distance: 2.3 }], beacons));

app.io.use((socket, next) => {
  if (socket.handshake.query.email) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

app.io.on('error', () => console.log('user connection failed'));

app.io.on('connection', socket => {

  socket.on('user', msg => app.io.emit('user', msg));

  socket.on('newmessage', msg => {
    console.log('newmessage:', msg);
    app.io.emit('newmessage', msg);
  });

  socket.on('disconnect', () => console.log('user disconnected'));
});

module.exports = app;

