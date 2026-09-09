const supabase = require('../config/supabase');

const createUser = async (userData) => {
    const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()

    if (error) {
        throw error;
    }
    return data[0];
}
module.exports = { createUser };