
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user && req.user.role;
        if(!userRole){
            return res.status(403).json({
                success : false,
                message : "User role not found"
            });
        }
        const roles = allowedRoles.flat();
        if(!roles.includes(userRole)){
            return res.status(403).json({
                success : false,
                message : "Access denied"
            });
        }
        next();
    };
}

module.exports = {
    authorize,
    authorizeSelfOrRoles: (paramName, ...allowedRoles) => (req, res, next) => {
        const roles = allowedRoles.flat();
        if (roles.includes(req.user && req.user.role) ||
            String(req.user && req.user.id) === String(req.params[paramName])) {
            return next();
        }
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
}