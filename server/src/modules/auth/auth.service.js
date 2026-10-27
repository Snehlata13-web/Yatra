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
    const approvalStatus = requestedRole === "student" ? "approved" : "pending";
    try {
        await authModel.assignRole(user.id, role.id, approvalStatus);
    } catch (error) {
        await authModel.deleteUser(user.id).catch(() => {});
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
    if (role.approval_status !== "approved") {
        throw new Error("Your account is waiting for admin approval");
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