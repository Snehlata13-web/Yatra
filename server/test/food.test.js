const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/food/food.validation.js');

const execute = (middleware, body = {}, params = {}, query = {}) => {
    let result = 'next';
    const response = {
        status(code) {
            return { json() { result = code; } };
        }
    };
    middleware({ body, params, query }, response, () => {});
    return result;
};

test('accepts all supported daily meal review types', () => {
    for (const mealType of ['breakfast', 'lunch', 'snacks', 'dinner']) {
        assert.equal(execute(validation.validateReview, {
            meal_type: mealType,
            review: 'Food was good',
            review_date: '2026-10-26'
        }), 'next');
    }
});

test('rejects invalid food review input', () => {
    assert.equal(execute(validation.validateReview, {
        meal_type: 'tea',
        review: 'Good'
    }), 400);
    assert.equal(execute(validation.validateReview, {
        meal_type: 'lunch',
        review: ' '
    }), 400);
    assert.equal(execute(validation.validateReview, {
        meal_type: 'dinner',
        review: 'Good',
        student_id: 'another-student'
    }), 400);
    assert.equal(execute(validation.validateDateQuery, {}, {}, { date: '26-10-2026' }), 400);
});
