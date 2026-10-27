const authService = require('./auth.service.js');

const register = async(req,res) =>{
    try{
        const user = await authService.register(req.body);
        res.status(201).json({
            success : true,
            data : user
        })
    } catch (error) {
        res.status(error.statusCode || 400).json({
            success : false,
            message : error.message
        })
    }
};

const  login = async(req,res) =>{
    try{
        const token = await authService.login(
            req.body.email,
            req.body.password
        );
        res.status(200).json({
            success : true,
            data : token
        })
    } catch (error) {
        res.status(error.statusCode || 400).json({
            success : false,
            message : error.message
        })
    }
};

module.exports = {
    register,
    login
}