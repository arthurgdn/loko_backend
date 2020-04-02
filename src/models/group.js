const mongoose = require('mongoose')
const groupSchema = new mongoose.Schema({
    offers : [{
        offer : {
            type: mongoose.Schema.Types.ObjectId,
            required : false,
            ref : 'Offer'
        }
    }],
    description : {
        type: String,
        trim : true,
        required : true
    },
    securityStatus : {
        type: String,
        trim : true,
        required : false
    },
    image : {
        type :Buffer,
        required : false
    },
    keywords : [{
        keyword : {
            type: mongoose.Schema.Types.ObjectId,
            required : false,
            ref : 'Keyword'
        }
    }],
    groupType : {
        type: String,
        required: false,
        trim: true
    },
    location : {
        type: {
            type: String, 
            enum: ['Point'], 
            required: false
          },
          coordinates: {
            type: [Number],
            required: false
          }
        }
    
},{timestamps:true})

groupeSchema.virtual('members',{
    ref:'GroupMembership',
    localField : '_id',
    foreignField : 'group'
})

const Group = mongoose.model('Group',groupSchema)
module.exports = Group