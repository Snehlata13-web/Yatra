const mealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const badRequest = (res, message) => res.status(400).json({
    success: false,
    message
});

const validateReview = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return badRequest(res, 'Request body must be an object');
    }

    const allowedFields = ['meal_type', 'review', 'review_date'];
    const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
    if (unknownFields.length) {
        return badRequest(res, `Unsupported field(s): ${unknownFields.join(', ')}`);
    }
    if (!mealTypes.includes(body.meal_type)) {
        return badRequest(res, 'meal_type must be breakfast, lunch, snacks, or dinner');
    }
    if (typeof body.review !== 'string' ||
        body.review.trim().length < 1 ||
        body.review.trim().length > 2000) {
        return badRequest(res, 'Review must be between 1 and 2000 characters');
    }
    if (body.review_date !== undefined &&
        (typeof body.review_date !== 'string' || !datePattern.test(body.review_date) ||
            Number.isNaN(Date.parse(`${body.review_date}T00:00:00Z`)))) {
        return badRequest(res, 'review_date must be a valid YYYY-MM-DD date');
    }

    req.body = {
        meal_type: body.meal_type,
        review: body.review.trim(),
        review_date: body.review_date || new Date().toISOString().slice(0, 10)
    };
    next();
};

const validateReviewId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return badRequest(res, 'Review id is required');
    }
    next();
};

const validateDateQuery = (req, res, next) => {
    if (req.query.date !== undefined &&
        (typeof req.query.date !== 'string' || !datePattern.test(req.query.date) ||
            Number.isNaN(Date.parse(`${req.query.date}T00:00:00Z`)))) {
        return badRequest(res, 'date must be a valid YYYY-MM-DD date');
    }
    next();
};

module.exports = {
    mealTypes,
    validateReview,
    validateReviewId,
    validateDateQuery
};