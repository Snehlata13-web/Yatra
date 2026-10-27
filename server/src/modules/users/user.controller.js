const userService = require('./user.service.js');

const getUsers = async (req, res) => {
    try{
        const users = await userService.getUsers();
        res.status(200).json({
            success : true,
            data : users
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}
const getUserById = async (req, res) => {
    try{
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found'});
        }
        res.status(200).json({
            success : true,
            data : user
        })

    }

    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}

const updateUser = async (req, res) => {
    try{
        const user = await userService.updateUser(req.params.id, req.body);
        if (!user) {
            return res.status(404).json({success: false, message: 'User not found'});
        }
        res.status(200).json({
            success : true,
            data : user
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}
const deleteUserbyId  = async (req,res)=>{
    try{
        const user = await userService.deleteUser(req.params.id);
        res.status(200).json({
            success : true,
            data : user
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
    getUsers,
    getUserById,
    updateUser,
    deleteUserbyId
};