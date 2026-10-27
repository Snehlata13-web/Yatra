const foodModel = require('./food.model.js');

const getStudentOrThrow = async (userId) => {
    const student = await foodModel.getStudentByUserId(userId);
    if (!student) {
        const error = new Error('Student profile not found');
        error.statusCode = 404;
        throw error;
    }
    return student;
};

const createReview = async (userId, reviewData) => {
    const student = await getStudentOrThrow(userId);
    return foodModel.createReview(student.id, reviewData);
};

const getReviews = async (userId, reviewDate) => {
    const student = await getStudentOrThrow(userId);
    return foodModel.getReviews(student.id, reviewDate);
};

const getReview = async (userId, id) => {
    const student = await getStudentOrThrow(userId);
    const review = await foodModel.getReviewById(student.id, id);
    if (!review) {
        const error = new Error('Food review not found');
        error.statusCode = 404;
        throw error;
    }
    return review;
};

const updateReview = async (userId, id, reviewData) => {
    const student = await getStudentOrThrow(userId);
    return foodModel.updateReview(student.id, id, reviewData);
};

module.exports = {
    createReview,
    getReviews,
    getReview,
    updateReview
};