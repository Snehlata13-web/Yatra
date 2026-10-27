const express = require('express');
const helpdeskController = require('./helpdesk.controller.js');
const helpdeskValidation = require('./helpdesk.validation.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize } = require('../../middleware/role.middleware.js');

const router = express.Router();

router.use(authenticate, authorize('student'));
router.post('/', helpdeskValidation.validateHelpRequest, helpdeskController.createHelpRequest);
router.get('/', helpdeskController.getHelpRequests);
router.get('/:id', helpdeskValidation.validateHelpRequestId,
    helpdeskController.getHelpRequestById);

module.exports = router;