const { getUser } = require('../services/auth');

function checkAuth(tokenkey) {
    return (req, res, next) => {
        const checktoken = req.cookies[tokenkey]; // Get token from cookies

        if (!checktoken) {

            return res.redirect('/user/'); // No token, continue without authentication
        }

        try {
            const payload = getUser(checktoken); // Decode token
            req.user = payload; // Attach user info to req
        } catch (e) {
            console.error('Authentication Error:', e); // Log error for debugging
        }

        next(); // Always call next(), even if token verification fails
    };
}
module.exports = checkAuth;
