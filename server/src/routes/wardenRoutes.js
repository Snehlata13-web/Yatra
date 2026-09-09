const express = require('express');
const { createWarden} = require('../controllers/wardenController');

const router = express.Router();

router.post('/create', createWarden);


module.exports = router;