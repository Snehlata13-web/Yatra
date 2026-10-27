const express = require('express');
const router = express.Router();
const authController = require('./auth.controller.js');
const authValidation = require('./auth.validation.js');

router.post('/register', authValidation.validateRegister, authController.register);
router.post('/login', authValidation.validateLogin, authController.login);

module.exports = {
    router
}