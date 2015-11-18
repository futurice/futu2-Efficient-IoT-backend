#!/usr/bin/env node
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const location = require('./location/location');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routes);
app.use((err) => { logger('error:' + err.message); });

app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.io = socketIO();

app.io.on('error', () => console.log('user connection failed'));

app.io.on('connection', socket => {

	location.listen(socket);

	socket.on('disconnect', () => console.log('user disconnected'));

});

module.exports = app;
