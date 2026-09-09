const supabase = require('../config/supabase');

const createAdmin = async (adminData) => {
    const { data, error } = await supabase
        .from("admin")
        .insert([adminData])
        .select()

    if (error) {
        throw error;
    }
    return data[0];
}
module.exports = { createAdmin };