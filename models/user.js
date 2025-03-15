const mongoose = require('mongoose');
const {Schema} = require("mongoose");
const {setUser} = require('../services/auth')
const {randomBytes, createHmac} = require("node:crypto");
const UserSchema = mongoose.Schema({
    full_name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    Teams: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Team'
        }
    ],
    Tasks : [{
        type: Schema.Types.ObjectId,
        ref: 'Task'
    }],
    TODOListTask:[{
        type: Schema.Types.ObjectId,
        ref: 'Task_Todo'
    }],
    salt:{
        type:String,
    },
    profilephoto:{
        type:String,
    },
    otp:{
        type:Number,
    },
    otpexpiry:{
        type:Date,
    },
    verified:{
        type:Boolean,
        default:false,
    }
})
UserSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();  // Only hash if password is modified

    this.salt = randomBytes(16).toString('hex'); // Generate a random salt
    this.password = createHmac('sha256', this.salt)
        .update(this.password)
        .digest('hex');

    next();
});
UserSchema.statics.matchPasswordAndGenerateToken = async  function (email, password) {
    const data = await this.findOne({ email });
    if(!data){
        throw new Error("User not found");
    }
    console.log("Stored Password:", data.password);
    console.log("Stored Salt:", data.salt);
    console.log("Entered Password:", password);
    const loginPassword = data.password
    const hashedPassword = createHmac('sha256', data.salt)
        .update(password)
        .digest('hex');

    // Compare hashed password with the stored password
    if (hashedPassword !== loginPassword) {
        throw new Error("Invalid password");
    }
    // generate token
    const token = await setUser(data);
    return token;
}
const User = mongoose.model('User', UserSchema);
module.exports = User;