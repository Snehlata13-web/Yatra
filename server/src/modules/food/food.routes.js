const express = require('express');
const foodController = require('./food.controller.js');
const foodValidation = require('./food.validation.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize } = require('../../middleware/role.middleware.js');

const router = express.Router();

router.use(authenticate, authorize('student'));
router.post('/reviews', foodValidation.validateReview, foodController.createReview);
router.get('/reviews', foodValidation.validateDateQuery, foodController.getReviews);
router.get('/reviews/:id', foodValidation.validateReviewId, foodController.getReview);
router.put('/reviews/:id', foodValidation.validateReviewId,
    foodValidation.validateReview, foodController.updateReview);

module.exports = router;