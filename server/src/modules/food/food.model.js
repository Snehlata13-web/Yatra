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

const getReviews = async (studentId, reviewDate) => {
    let query = supabase
        .from('food_reviews')
        .select('*')
        .eq('student_id', studentId)
        .order('review_date', { ascending: false })
        .order('meal_type', { ascending: true });
    if (reviewDate) query = query.eq('review_date', reviewDate);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

const getReviewById = async (studentId, id) => {
    const { data, error } = await supabase
        .from('food_reviews')
        .select('*')
        .eq('id', id)
        .eq('student_id', studentId)
        .maybeSingle();
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