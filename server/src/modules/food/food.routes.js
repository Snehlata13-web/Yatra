const express = require('express');
const foodController = require('./food.controller.js');
const foodValidation = require('./food.validation.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize } = require('../../middleware/role.middleware.js');

const router = express.Router();

router.use(authenticate);
router.post('/reviews', authorize('student'),
    foodValidation.validateReview, foodController.createReview);
router.get('/reviews/me', authorize('student'),
    foodValidation.validateDateQuery, foodController.getMyReviews);
router.get('/reviews', authorize('admin', 'warden'),
    foodValidation.validateDateQuery, foodController.getAllReviews);
router.get('/reviews/:id', authorize('student', 'admin', 'warden'),
    foodValidation.validateReviewId, foodController.getReview);
router.put('/reviews/:id', authorize('student'), foodValidation.validateReviewId,
    foodValidation.validateReview, foodController.updateReview);

module.exports = router;