const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    conversation : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'Conversation'
    },
    content : {
        type : String,
        required : true
    } //We might check later to be able to send images/files/others
},{timestamps:true})

const Message = mongoose.model('Message',messageSchema)
module.exports = Message