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

const getMyReviews = async (userId, { reviewDate, mealType }) => {
    const student = await getStudentOrThrow(userId);
    return foodModel.getReviews({ studentId: student.id, reviewDate, mealType });
};

const getAllReviews = ({ reviewDate, mealType }) =>
    foodModel.getReviews({ reviewDate, mealType });

const getMyReview = async (userId, id) => {
    const student = await getStudentOrThrow(userId);
    const review = await foodModel.getReviewById(id, student.id);
    if (!review) {
        const error = new Error('Food review not found');
        error.statusCode = 404;
        throw error;
    }
    return review;
};

const getReview = async (id) => {
    const review = await foodModel.getReviewById(id);
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
    getMyReviews,
    getAllReviews,
    getMyReview,
    getReview,
    updateReview
};