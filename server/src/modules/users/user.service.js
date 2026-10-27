const userModel = require('./user.model.js');

const getUsers = async() =>{
    const users = await userModel.getUsers();
    return users;
};

const getUserById = async(id) =>{
    const user = await userModel.getUserById(id);
    return user;
}

const updateUser = async(id, userData) =>{
    const user = await userModel.updateUser(id, userData);
    return user;
}

const deleteUser = async(id) =>{
    const user = await userModel.deleteUser(id);
    return user;
}

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};
