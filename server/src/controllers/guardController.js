const bcrypt = require('bcrypt');
const guardModel = require('../models/guardModel');

const createGuard = async (req, res) => {
    try {
        const guardData = req.body;
        guardData.password = await bcrypt.hash(guardData.password, 10);
        const guard = await guardModel.createGuard(guardData);
        res.status(201).json({
            message: "Guard created successfully",
            guard: guard
        });
    } catch (error) {
        res.status(400).json({
            message: "Guard Creation Failed",
            error: error.message
        });
    }
};

module.exports = {
    createGuard,
};