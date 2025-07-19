const { getUser } = require('../services/auth');

// ✅ Attach user if token exists
function checkAuth(tokenKey) {
    return (req, res, next) => {
        const token = req.cookies[tokenKey];
        if (token) {
            try {
                const payload = getUser(token); // Decode token
                req.user = payload;
            } catch (err) {
                console.error('Invalid token:', err);
                res.clearCookie(tokenKey);
            }
        }
        next();
    };
}

// ✅ Block guests for protected routes
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.redirect('/logic/guest'); // Redirect guest to guest page
    }
    next();
}

module.exports = { checkAuth, requireAuth };
