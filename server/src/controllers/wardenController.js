const bcrypt = require('bcrypt');
const wardenModel = require('../models/wardenModel');

const createWarden = async(req,res)=>{
    try{
        const wardendata = req.body;
        wardendata.password = await bcrypt.hash(wardendata.password, 10);
        const warden = await wardenModel.createWarden(wardendata);
        res.status(201).json({
            message: "Warden created successfully",
            warden: warden
        })
    }                  
    catch(error){
        res.status(400).json({
            message: "Warden Creation Failed",
            error: error.message
        });
    }
}
module.exports = {
    createWarden
};