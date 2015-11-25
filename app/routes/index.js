const express = require('express');
const { stream } = require('config');

const router = express.Router();

router.get('/', (req, res) => {
	res.render('index', {
		title: 'Futu2',
    stream: stream
	});
});

module.exports = router;
