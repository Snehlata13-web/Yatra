const { supabase } = require('../../config/db');

const approvePass = async (passId, decision) => {
    const { data, error } = await supabase
        .from('pass_approvals')
        .update({
            decision,
            decided_at: new Date().toISOString()
        })
        .eq('pass_id', passId)
        .eq('stage', 'warden')
        .eq('decision', 'pending')
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') error.statusCode = 409;
        throw error;
    }

    const { data: pass, error: passError } = await supabase
        .from('passes')
        .update({ status: decision })
        .eq('id', passId)
        .select()
        .single();

    if (passError) {
        await supabase
            .from('pass_approvals')
            .update({ decision: 'pending', decided_at: null })
            .eq('pass_id', passId)
            .eq('stage', 'warden')
            .eq('decision', decision);
        if (passError.code === 'PGRST116') passError.statusCode = 404;
        throw passError;
    }

    return { approval: data, pass };
};

const getCurrentWarden = async()=>{
    const { data, error } = await supabase
        .from('wardens')
        .select('*')
        .eq('is_current', true)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getPendingApprovals = async()=>{
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'warden')
        .eq('decision', 'pending');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getApprovedPasses = async()=>{
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'warden')
        .eq('decision', 'approved');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getRejectedPasses = async()=>{
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'warden')
        .eq('decision', 'rejected');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}


const updatePassById = async (passId, passData) => {
    const { data, error } = await supabase
        .from('passes')
        .update(passData)
        .eq('id', passId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getAllPasses = async () => {
    const { data, error } = await supabase
        .from('passes')
        .select('*');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getPassById = async (passId) => {
    const { data, error } = await supabase
        .from('passes')
        .select('*')
        .eq('id', passId)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

module.exports = {
    approvePass,
    getCurrentWarden,
    getPendingApprovals,
    getApprovedPasses,
    getRejectedPasses,
    updatePassById,
    getAllPasses,
    getPassById
}
