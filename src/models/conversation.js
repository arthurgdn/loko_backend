const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
    members : [{
        member : {
            type: mongoose.Schema.Types.ObjectId,
            required : false,
            ref : 'User'
        }
    }],
    name : {
        type : String,
        required : false,
        trim : true
    },
    description : {
        type: String,
        required : false,
        trim : true
    },
    image : {
        type: Buffer,
        required : false
    }
},{timestamps: true})

conversationSchema.virtual('messages',{
    ref:'Message',
    localField : '_id',
    foreignField : 'conversation'
})
const Conversation = mongoose.model('Conversation',conversationSchema)
module.exports = Conversation