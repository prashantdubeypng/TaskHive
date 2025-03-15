const {Schema , model} = require("mongoose");
const TodoSCHEMA = new Schema({
owner:{
    type: Schema.Types.ObjectId,
    ref:'User'
},
    title: {
    type: String,
        required: true
    },
    description: {
    type: String,
        required: true
    },
   date:{
    type: Date,
   },
   status:{
    type: String,
       enum: ['pending', 'completed', 'in progress'],
       default: 'pending'
   }
},{timestamps: true});
const TODO =  model('TODO' , TodoSCHEMA) // model is not a function so just write model not new model
module.exports = TODO;