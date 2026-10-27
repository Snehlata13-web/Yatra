const { supabase } = require('../../config/db.js')

const getUsers = async() =>{
    const {data,error} = await supabase
                        .from('users')
                        .select('id,name,email,phone,is_active');

            if(error){
                throw error;
            }
            return data;
}

const getUserById = async(id) =>{
    const {data,error} = await supabase
                        .from('users')
                        .select('id,name,email,phone,is_active')
                        .eq('id',id)
                        .maybeSingle();

            if(error){
                throw error;
            }
            return data;
}

const updateUser = async(id, userData) =>{
    const {data,error} = await supabase
                        .from('users')
                        .update(userData)
                        .eq('id',id)
                        .select()
                        .single();

            if(error){
                if (error.code === '23505') error.statusCode = 409;
                throw error;
            }
            return data;
}

const deleteUser = async(id) =>{
    const {data,error} = await supabase
                        .from('users')
                        .delete()
                        .eq('id',id)
                        .select()
                        .single();

            if(error){
                throw error;
            }
            return data;
}
module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
}