const bcrypt = require('bcrypt');
const adminModel = require('../models/adminModel');

const createAdmin = async (req, res) => {
    try {
        const adminData = req.body;
        adminData.password = await bcrypt.hash(adminData.password, 10);
        const admin = await adminModel.createAdmin(adminData);
        res.status(201).json({
            message: "Admin created successfully",
            admin: admin
        })

    } catch (error) {
        res.status(400).json({
            message: "Admin Creation Failed",
            error: error.message
        });
    }
};

module.exports = {
    createAdmin,
};