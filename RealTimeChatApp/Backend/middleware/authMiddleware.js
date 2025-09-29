const jwt = require('jsonwebtoken');
const response = require('../utils/responseHandler');

const authMiddleware = (req, res, next) => {
    const authToken = req.cookies?.auth_token;

    if(!authToken) {
        return response(res, 401, 'authentication token missing, please provide token');
    }
    try {
        const decode = jwt.verify(authToken, process.env.JWT_SECRET);
        req.user = decode;
        console.log(req.user);
        next();
    }
    catch(err) {
        console.error(err);
        console.log('token verification error');
        return response(res, 401, 'invalid or expired token');
    }
}

module.exports = authMiddleware;