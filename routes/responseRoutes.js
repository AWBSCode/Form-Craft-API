const express = require('express');

const { identifyUser } = require('../controllers/authController');
const { postResponse } = require('../controllers/responseController');

const router = express.Router();

router.post('/:slug', identifyUser, postResponse);

module.exports = router;
