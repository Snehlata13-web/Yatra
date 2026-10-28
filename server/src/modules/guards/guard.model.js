const { supabase } = require('../../config/db.js');
const { attachStudentDetails } = require('../../utils/studentDetails.js');

const ensureGuardApprovals = async () => {
    const { data: approvedPasses, error: passesError } = await supabase
        .from('passes')
        .select('id')
        .eq('status', 'approved');
    if (passesError) throw passesError;

    if (!approvedPasses || approvedPasses.length === 0) return;

    const passIds = approvedPasses.map((pass) => pass.id);
    const { data: existingApprovals, error: approvalsError } = await supabase
        .from('pass_approvals')
        .select('pass_id')
        .eq('stage', 'guard')
        .in('pass_id', passIds);
    if (approvalsError) throw approvalsError;

    const existingPassIds = new Set(
        (existingApprovals || []).map((approval) => String(approval.pass_id))
    );
    const missingApprovals = approvedPasses
        .filter((pass) => !existingPassIds.has(String(pass.id)))
        .map((pass) => ({
            pass_id: pass.id,
            stage: 'guard',
            decision: 'pending'
        }));

    if (missingApprovals.length === 0) return;

    const { error: insertError } = await supabase
        .from('pass_approvals')
        .insert(missingApprovals);
    if (insertError && insertError.code !== '23505') throw insertError;
};

const approvePass = async (id, approverId) => {
    const { data, error } = await supabase
        .from('pass_approvals')
        .update({
            decision: 'approved',
            approver_id: approverId,
            decided_at: new Date().toISOString()
        })
        .eq('pass_id', id)
        .eq('stage', 'guard')
        .eq('decision', 'pending')
        .select()
        .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
        const conflict = new Error('Pending guard approval not found');
        conflict.statusCode = 409;
        throw conflict;
    }
    return data[0];
}

const updateGateStatus = async (id, action, guardUserId) => {
    const { data: pass, error: passError } = await supabase
        .from('passes')
        .select('id, status, current_stage')
        .eq('id', id)
        .maybeSingle();
    if (passError) throw passError;
    if (!pass) {
        const notFound = new Error('Pass not found');
        notFound.statusCode = 404;
        throw notFound;
    }
    if (pass.status !== 'approved') {
        const conflict = new Error('Only approved passes can be recorded at the gate');
        conflict.statusCode = 409;
        throw conflict;
    }

    const { data: guardApproval, error: approvalError } = await supabase
        .from('pass_approvals')
        .select('id')
        .eq('pass_id', id)
        .eq('stage', 'guard')
        .eq('decision', 'approved')
        .limit(1)
        .maybeSingle();
    if (approvalError) throw approvalError;
    if (!guardApproval) {
        const conflict = new Error('Guard must verify the pass before gate entry/exit');
        conflict.statusCode = 409;
        throw conflict;
    }

    const currentStage = (pass.current_stage || '').toUpperCase();
    if (action === 'OUT' && currentStage === 'OUT') {
        const conflict = new Error('Pass is already marked OUT');
        conflict.statusCode = 409;
        throw conflict;
    }
    if (action === 'OUT' && currentStage === 'IN') {
        const conflict = new Error('This pass has already been used — the student has returned');
        conflict.statusCode = 409;
        throw conflict;
    }
    if (action === 'IN' && currentStage !== 'OUT') {
        const conflict = new Error('Pass must be marked OUT before it can be marked IN');
        conflict.statusCode = 409;
        throw conflict;
    }

    // Record the exact moment (and which guard) the student left / returned.
    const now = new Date().toISOString();
    const gateUpdate = action === 'OUT'
        ? { current_stage: 'OUT', gate_out_at: now, gate_out_by: guardUserId || null }
        : { current_stage: 'IN', gate_in_at: now, gate_in_by: guardUserId || null };

    const { data, error } = await supabase
        .from('passes')
        .update(gateUpdate)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

const getPassById = async (id) => {
    const { data, error } = await supabase
        .from('passes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return attachStudentDetails(data);
}

const getCurrentGuard = async (userId) => {
    const { data, error } = await supabase
        .from('guards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data;
};

const updatePassbyId = async (id, passData) => {
    const { data, error } = await supabase
        .from('passes')
        .update(passData)
        .eq('id', id)
        .select()
        .single
        ();
    if (error) {
        throw new Error(error.message);
    }
return data;
}

const getPendingApprovals = async () => {
    await ensureGuardApprovals();
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'guard')
        .eq('decision', 'pending');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getApprovedPasses = async()=>{
    await ensureGuardApprovals();
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'guard')
        .eq('decision', 'approved');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getRejectedPasses = async()=>{
    await ensureGuardApprovals();
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'guard')
        .eq('decision', 'rejected');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

// Every warden-approved pass the guard works with, in one call:
// pass fields + guard_decision (pending/approved) + guard_verified + student details.
const getGatePasses = async () => {
    await ensureGuardApprovals();
    const { data: approvals, error: approvalsError } = await supabase
        .from('pass_approvals')
        .select('pass_id, decision, decided_at')
        .eq('stage', 'guard')
        .in('decision', ['pending', 'approved']);
    if (approvalsError) throw approvalsError;
    if (!approvals || approvals.length === 0) return [];

    const decisionByPassId = new Map(approvals.map((approval) => [String(approval.pass_id), approval]));
    const { data: passes, error: passesError } = await supabase
        .from('passes')
        .select('*')
        .eq('status', 'approved')
        .in('id', approvals.map((approval) => approval.pass_id))
        .order('departure_time', { ascending: true });
    if (passesError) throw passesError;

    const withStudents = await attachStudentDetails(passes || []);
    return withStudents.map((pass) => {
        const approval = decisionByPassId.get(String(pass.id));
        return {
            ...pass,
            guard_decision: approval ? approval.decision : 'pending',
            guard_verified: Boolean(approval && approval.decision === 'approved'),
            guard_verified_at: approval ? approval.decided_at : null
        };
    });
};

module.exports = {
    approvePass,
    getPassById,
    getCurrentGuard,
    updatePassbyId,
    getPendingApprovals,
    getApprovedPasses,
    getRejectedPasses,
    updateGateStatus,
    getGatePasses
}