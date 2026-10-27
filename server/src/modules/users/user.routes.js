const  userController = require('./user.controller.js');
const userValidation= require('./user.validation.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize, authorizeSelfOrRoles } = require('../../middleware/role.middleware.js');
const express = require('express');

const router = express.Router();

router.get('/', authenticate, authorize('admin','warden'), userController.getUsers);
router.get('/:id', authenticate, userValidation.validateGetUserbyId,
  authorizeSelfOrRoles('id', 'admin', 'warden'), userController.getUserById);
router.put('/:id', authenticate, userValidation.validateGetUserbyId,
  authorizeSelfOrRoles('id', 'admin', 'warden'), userValidation.validateUpdateUser, userController.updateUser);
router.delete('/:id', authenticate,authorize('admin'), userValidation.validateDeleteUserbyId, userController.deleteUserbyId);

module.exports = {
  router
};