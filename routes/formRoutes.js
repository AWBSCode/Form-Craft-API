const express = require('express');
const { protect } = require('../controllers/authController');
const { createForm } = require('../controllers/formController');
const handleSubIdsMD = require('../middlewares/handleSubIdsMD');

const router = express.Router();

router.post('/new', protect, handleSubIdsMD, createForm);

module.exports = router;
