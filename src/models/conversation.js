const mongoose = require('mongoose')
const Message = require('./message')
const conversationSchema = new mongoose.Schema({
    members : [{
        member : {
            type: mongoose.Schema.Types.ObjectId,
            required : false,
            ref : 'User'
        }
    }],
    admins : [{
        admin : {
            type : mongoose.Schema.Types.ObjectId,
            required : false,
            ref:'User'
        }
    }],
    name : {
        type : String,
        required : false,
        trim : true
    },
    slicedName: {
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



conversationSchema.pre('remove', async function(next){
    const conversation = this
    await Message.deleteMany({conversation : conversation._id})
    next()
})
const Conversation = mongoose.model('Conversation',conversationSchema)
module.exports = Conversation