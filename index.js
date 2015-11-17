#!/usr/bin/env node
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

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

app.io.on('connection', socket => {
  console.log('user connected');
});

app.io.on('connection', socket => {

  socket.on('user', msg => {
    console.log('user', msg);
    app.io.emit('user', msg);
  });

  socket.on('new message', msg => {
    console.log('new message:', msg);
    app.io.emit('new message', msg);
  });

  socket.on('disconnect', () => console.log('user disconnected'));
});

module.exports = app;

