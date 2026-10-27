const { supabase } = require('../../config/db.js');

const updateApprovalStatus = async (userId, approvalStatus) => {
	const { data, error } = await supabase
		.from('user_roles')
		.update({ approval_status: approvalStatus })
		.eq('user_id', userId)
		.select()
		.single();

	if (error) {
		throw error;
	}
	return data;
};

// Lists Warden/Guard accounts whose approval_status is still 'pending'.
const getPendingStaffAccounts = async () => {
	const { data: roles, error: rolesError } = await supabase
		.from('roles')
		.select('id, name');
	if (rolesError) throw rolesError;

	const staffRoles = (roles || []).filter((role) =>
		['warden', 'guard'].includes(String(role.name).toLowerCase()));
	if (!staffRoles.length) return [];

	const { data: userRoles, error: userRolesError } = await supabase
		.from('user_roles')
		.select('user_id, role_id, approval_status')
		.eq('approval_status', 'pending')
		.in('role_id', staffRoles.map((role) => role.id));
	if (userRolesError) throw userRolesError;
	if (!userRoles || !userRoles.length) return [];

	const { data: users, error: usersError } = await supabase
		.from('users')
		.select('id, name, email, phone')
		.in('id', userRoles.map((userRole) => userRole.user_id));
	if (usersError) throw usersError;

	const roleNameById = new Map(staffRoles.map((role) => [String(role.id), String(role.name).toLowerCase()]));
	const roleByUserId = new Map(userRoles.map((userRole) => [String(userRole.user_id), userRole]));

	return (users || []).map((user) => {
		const userRole = roleByUserId.get(String(user.id));
		return {
			...user,
			role: roleNameById.get(String(userRole.role_id)),
			approval_status: userRole.approval_status
		};
	});
};

module.exports = {
	updateApprovalStatus,
	getPendingStaffAccounts
};