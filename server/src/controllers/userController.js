const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

const createUser = async (req, res) => {
    try {
        const userData = req.body;
        userData.password = await bcrypt.hash(userData.password, 10);
        const user = await userModel.createUser(userData);
        res.status(201).json({
            message: "User created successfully",
            user: user
        })

    } catch (error) {
        res.status(400).json({
            message: "User Creation Failed",
            error: error.message
        });
    }
};

module.exports = {
    createUser,
};