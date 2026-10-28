const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authModel = require("./auth.model.js");

const register = async (userData) => {
    const existingUser = await authModel.findUserByEmail(userData.email);
    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }
    const requestedRole = userData.role.toLowerCase();
    if (requestedRole === "admin") {
        throw new Error("Admin registration is not allowed");
    }

    const role = await authModel.findRoleByName(requestedRole);
    if (!role) {
        throw new Error("Role not found");
    }
    const passwordHash = await bcrypt.hash(
        userData.password,
        10
    );
    const user = await authModel.createUser({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        password_hash: passwordHash,
        is_active: true
    });
    const approvalStatus = 'pending';
    let roleAssigned = false;
    try {
        await authModel.assignRole(user.id, role.id, approvalStatus);
        roleAssigned = true;
        if (requestedRole === "student") {
            const {
                roll_number,
                admission_number,
                college_email,
                branch,
                academic_year,
                room_number,
                block_no,
                batch,
                course
            } = userData;
            await authModel.createStudentProfile({
                user_id: user.id,
                roll_number,
                admission_number,
                college_email,
                branch,
                academic_year,
                room_no: room_number,
                block_no,
                batch,
                course
            });
        } else if (requestedRole === "warden") {
            const { employee_id, phone_number, hostel_block } = userData;
            await authModel.createWardenProfile({
                user_id: user.id,
                employee_id,
                phone_number,
                hostel_block
            });
        } else if (requestedRole === "guard") {
            const { employee_id, gate_number } = userData;
            await authModel.createGuardProfile({
                user_id: user.id,
                employee_id,
                gate_number
            });
        }
    } catch (error) {
        const cleanupErrors = [];
        const deleteProfile = requestedRole === 'student'
            ? authModel.deleteStudentProfile
            : requestedRole === 'warden' ? authModel.deleteWardenProfile
                : requestedRole === 'guard' ? authModel.deleteGuardProfile : null;
        if (deleteProfile) {
            try {
                await deleteProfile(user.id);
            } catch (cleanupError) {
                cleanupErrors.push(cleanupError);
            }
        }
        if (roleAssigned) {
            try {
                await authModel.deleteUserRole(user.id);
            } catch (cleanupError) {
                cleanupErrors.push(cleanupError);
            }
        }
        try {
            await authModel.deleteUser(user.id);
        } catch (cleanupError) {
            cleanupErrors.push(cleanupError);
        }
        if (cleanupErrors.length) {
            const rollbackError = new Error('Registration failed and account cleanup could not be completed');
            rollbackError.statusCode = 500;
            rollbackError.cause = new AggregateError([error, ...cleanupErrors]);
            throw rollbackError;
        }
        throw error;
    }
    delete user.password_hash;
    return user;
};

const login = async (email, password) => {
    const user = await authModel.findUserByEmail(email);

    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const passwordMatched = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatched) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }
    const role = await authModel.findRoleByUserId(user.id);
    if (!role) {
        throw new Error("User role not found");
    }
    if (role.approval_status === 'rejected') {
        throw new Error('Your account registration was rejected');
    }
    if (role.approval_status !== "approved") {
        throw new Error("Your account is waiting for approval");
    }
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: role.name.toLowerCase(),
            approvalStatus: role.approval_status
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
    delete user.password_hash;
    return {
        user,
        token
    };
};

module.exports = {
    register,
    login
};