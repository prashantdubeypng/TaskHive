const {randomInt} = require('crypto');
async function generateOTP() {
    const otp = randomInt(100000, 999999).toString();
    return otp;
}
module.exports = generateOTP;