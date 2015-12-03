'use strict';
const express = require('express');
const { STREAM } = require('config');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Futu2',
    STREAM: STREAM
  });
});

module.exports = router;
