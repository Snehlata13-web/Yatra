const passService = require('./pass.service');

const createPass = async (req, res) => {
    try{
        const pass = await passService.createPass(req.user.id, req.body);
        res.status(201).json({
            success : true,
            data : pass
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}
const getAllPasses = async (req, res) => {
    try{
        const passes = await passService.getAllPasses(req.user);
        res.status(200).json({
            success : true,
            data : passes
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}

const getPassById = async (req, res) => {
    try{
        const pass = await passService.getPassById(req.params.id, req.user);
        res.status(200).json({
            success : true,
            data : pass
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}

const updatePassbyId = async (req, res) => {
    try{
        const pass = await passService.updatePassbyId(req.params.id, req.body, req.user);
        res.status(200).json({
            success : true,
            data : pass
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}

const deletePassbyId  = async (req,res)=>{
    try{
        const pass = await passService.deletePassbyId(req.params.id, req.user);
        res.status(200).json({
            success : true,
            data : pass
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}

module.exports = {
    createPass,
    getAllPasses,
    getPassById,
    updatePassbyId,
    deletePassbyId
}