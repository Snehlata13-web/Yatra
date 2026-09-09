const express = require('express');
const { createGuard } = require('../controllers/guardController');

const router = express.Router();

router.post('/create', createGuard);

module.exports = router;