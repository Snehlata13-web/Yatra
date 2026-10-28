const { supabase } = require('../../config/db.js');

const getStudentByUserId = async (userId) => {
    const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data;
};

const createReview = async (studentId, reviewData) => {
    const { data, error } = await supabase
        .from('food_reviews')
        .insert({ ...reviewData, student_id: studentId })
        .select()
        .single();
    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

const getReviews = async ({ studentId, reviewDate, mealType }) => {
    let query = supabase
        .from('food_reviews')
        .select('*')
        .order('review_date', { ascending: false })
        .order('meal_type', { ascending: true });
    if (reviewDate) query = query.eq('review_date', reviewDate);
    if (mealType) query = query.eq('meal_type', mealType);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

const getReviewById = async (id, studentId) => {
    let query = supabase
        .from('food_reviews')
        .select('*')
        .eq('id', id);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
};

const updateReview = async (studentId, id, reviewData) => {
    const { data, error } = await supabase
        .from('food_reviews')
        .update(reviewData)
        .eq('id', id)
        .eq('student_id', studentId)
        .select()
        .single();
    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        if (error.code === 'PGRST116') error.statusCode = 404;
        throw error;
    }
    return data;
};

module.exports = {
    getStudentByUserId,
    createReview,
    getReviews,
    getReviewById,
    updateReview
};