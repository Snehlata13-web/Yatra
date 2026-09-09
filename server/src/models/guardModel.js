const supabase = require('../config/supabase');

const createGuard = async (guardData) => {
    const { data, error } = await supabase
        .from("guard")
        .insert([guardData])
        .select()

    if (error) {
        throw error;
    }
    return data[0];
}
module.exports = { createGuard };