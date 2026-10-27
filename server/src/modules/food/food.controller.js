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

const getReviews = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await foodService.getReviews(req.user.id, req.query.date)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getReview = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await foodService.getReview(req.user.id, req.params.id)
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
    getReviews,
    getReview,
    updateReview
};