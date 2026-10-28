const foodService = require('./food.service.js');

const handleError = (res, error) => res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
});

const createReview = async (req, res) => {
    try {
        res.status(201).json({
            success: true,
            data: await foodService.createReview(req.user.id, req.body)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getMyReviews = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await foodService.getMyReviews(req.user.id, {
                reviewDate: req.query.date,
                mealType: req.query.meal_type
            })
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getAllReviews = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await foodService.getAllReviews({
                reviewDate: req.query.date,
                mealType: req.query.meal_type
            })
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getReview = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user.role === 'student'
                ? await foodService.getMyReview(req.user.id, req.params.id)
                : await foodService.getReview(req.params.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const updateReview = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await foodService.updateReview(req.user.id, req.params.id, req.body)
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    createReview,
    getMyReviews,
    getAllReviews,
    getReview,
    updateReview
};