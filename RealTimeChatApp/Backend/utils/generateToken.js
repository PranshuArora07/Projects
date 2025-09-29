const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    try {
        return jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '1y'
    })
        
    }
    catch(err) {
        console.error('error while generating token');
        throw new Error('error while generating token');
    }
   
}

module.exports = generateToken;