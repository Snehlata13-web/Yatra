const { validateName, emailPattern, phonePattern } = require('../auth/auth.validation.js');

const validateUpdateUser = (req,res,next)=>{
    const body = req.body || {};
    const {name,email,phone} = body;
    const hasValue = value => value !== undefined && value !== null && String(value).trim() !== '';
    const allowedFields = ['name', 'email', 'phone'];
    const unknownFields = Object.keys(body).filter(field => !allowedFields.includes(field));

    if(unknownFields.length){
        return res.status(400).json({message:`Unsupported field(s): ${unknownFields.join(', ')}`});
    }

    if(!hasValue(name) && !hasValue(email) && !hasValue(phone)){
        return res.status(400).json({message:"At least one field is required"});
    }
    if (name !== undefined && (!validateName(name))) {
        return res.status(400).json({success: false, message:"Name must be 2 to 100 characters"});
    }
    if (email !== undefined && (typeof email !== 'string' || !emailPattern.test(email.trim()))) {
        return res.status(400).json({success: false, message:"A valid email is required"});
    }
    if (phone !== undefined && phone !== null &&
        (typeof phone !== 'string' || !phonePattern.test(phone.trim()))) {
        return res.status(400).json({success: false, message:"Phone number format is invalid"});
    }
    req.body = {
        ...(name !== undefined ? {name: name.trim()} : {}),
        ...(email !== undefined ? {email: email.trim().toLowerCase()} : {}),
        ...(phone !== undefined ? {phone: phone === null ? null : phone.trim()} : {})
    };
    next();
}

const validateDeleteUserbyId = (req,res,next)=>{
    const {id} = req.params;
    if(!id ?.trim()){
        return res.status(400).json({message:"User id is required"});
    }
    next();
}

const validateGetUserbyId = (req,res,next)=>{
    const {id} = req.params;
    if(!id ?.trim()){
        return res.status(400).json({message:"User id is required"});
    }
    next();
}

module.exports = {
    validateUpdateUser,
    validateDeleteUserbyId,
    validateGetUserbyId
}