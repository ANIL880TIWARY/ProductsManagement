const jwt = require('jsonwebtoken');
require('dotenv').config();

const create = (userId) => {
    return jwt.sign({
        userId: userId
    },"secreetkey", { expiresIn: '1h' });
}

const verify = (res, token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, "secreetkey", (error, decodedToken) => {
            if (error) {
                return res.status(401).send({
                    status: false,
                    message: error.message
                });
            }
            resolve(decodedToken);
        });
    });
}

module.exports = {
    createToken: create,
    verifyToken: verify
}