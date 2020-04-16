const mongoose = require('mongoose')
const GroupMembership = require('./groupMembership')
const groupSchema = new mongoose.Schema({
    
    name : {
        type : String,
        trim : true,
        required: true
    },
    description : {
        type: String,
        trim : true,
        required : true
    },
    securityStatus : {
        type: String,
        trim : true,
        required : true
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

groupSchema.virtual('members',{
    ref:'GroupMembership',
    localField : '_id',
    foreignField : 'group'
})
groupSchema.virtual('offers',{
    ref:'Offer',
    localField : '_id',
    foreignField : 'groups.group'
})
groupSchema.pre('remove',async function(next){
    await GroupMembership.deleteMany({group : this._id})
    next()
})
const Group = mongoose.model('Group',groupSchema)
module.exports = Group