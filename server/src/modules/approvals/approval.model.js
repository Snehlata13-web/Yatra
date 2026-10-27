const { supabase } = require('../../config/db.js');

const approvalSelect = 'id, pass_id, stage, decision, decided_at';

const getApprovals = async (decision) => {
    let query = supabase
        .from('pass_approvals')
        .select(approvalSelect)
        .eq('stage', 'warden')
        .order('id', { ascending: false });
    if (decision) query = query.eq('decision', decision);

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

const getApprovalByPassId = async (passId) => {
    const { data, error } = await supabase
        .from('pass_approvals')
        .select(approvalSelect)
        .eq('pass_id', passId)
        .eq('stage', 'warden')
        .maybeSingle();
    if (error) throw error;
    return data;
};

const updatePendingApproval = async (passId, decision, approverId) => {
    const { data, error } = await supabase
        .from('pass_approvals')
        .update({
            decision,
            approver_id: approverId,
            decided_at: new Date().toISOString()
        })
        .eq('pass_id', passId)
        .eq('stage', 'warden')
        .eq('decision', 'pending')
        .select(approvalSelect)
        .single();

    if (error) {
        if (error.code === 'PGRST116') error.statusCode = 409;
        throw error;
    }
    return data;
};

const updatePassStatus = async (passId, status) => {
    const { data, error } = await supabase
        .from('passes')
        .update({ status })
        .eq('id', passId)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') error.statusCode = 404;
        throw error;
    }
    return data;
};

const createGuardApproval = async (passId) => {
    const { data: existing, error: existingError } = await supabase
        .from('pass_approvals')
        .select(approvalSelect)
        .eq('pass_id', passId)
        .eq('stage', 'guard')
        .limit(1)
        .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return existing;

    const { data, error } = await supabase
        .from('pass_approvals')
        .insert({
            pass_id: passId,
            stage: 'guard',
            decision: 'pending'
        })
        .select(approvalSelect)
        .single();
    if (error) throw error;
    return data;
};

const restorePendingApproval = async (passId, decision) => {
    const { error } = await supabase
        .from('pass_approvals')
        .update({ decision: 'pending', decided_at: null })
        .eq('pass_id', passId)
        .eq('stage', 'warden')
        .eq('decision', decision);
    if (error) throw error;
};

module.exports = {
    getApprovals,
    getApprovalByPassId,
    updatePendingApproval,
    updatePassStatus,
    createGuardApproval,
    restorePendingApproval
};