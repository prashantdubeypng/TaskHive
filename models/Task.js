const {Schema , model} = require("mongoose");
const TaskSchema = new Schema({
    AssignedTo:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'in progress'],
        default: 'pending'
    },
    team:{
        type: Schema.Types.ObjectId,
        ref:'Team'
    },
    started:{
        type:Date,
        default: null
    },
    end:{
        type: Date,
        default: null
    }
},{timestamps:true})
const Task =  model('Task', TaskSchema);
module.exports = Task;