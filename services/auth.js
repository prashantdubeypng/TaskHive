const jwt = require('jsonwebtoken');
const secret = 'prashant@2107';
function setUser(user){
    return jwt.sign({
        _id:user._id,
        email:user.email,
        name:user.full_name,
    },secret);
}
function getUser(token){
    return jwt.verify(token,secret);
}
module.exports = {setUser,getUser};
