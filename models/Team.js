const {Schema , model} = require("mongoose");
const TeamSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    Admin:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    tasks:[{
        type:Schema.Types.ObjectId,
        ref:'Task'
    }],
    members:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }]
},{timestamps:true});
const Team =  model('Team', TeamSchema);
module.exports = Team;