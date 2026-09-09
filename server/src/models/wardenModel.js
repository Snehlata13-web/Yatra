const supabase = require('../config/supabase');

const createWarden = async (wardenData) => {
    const { data, error } = await supabase
        .from("warden")
        .insert([wardenData])
        .select()

    if (error) {
        throw error;
    }
    return data[0];
}
module.exports = { createWarden };