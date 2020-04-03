const mongoose = require('mongoose')


//create userSchema
const profileSchema = new mongoose.Schema({
    
    description : {
        type: String,
        required: false,
        trim : true
    },
    summary : {
        type: String,
        required:false,
        trim : true
    },
    skills : [{
        skill : {
            type: String,
            required : false,
            trim: true
        }
    }],
    user : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    }
},{
    timestamps : true
})

profileSchema.virtual('recommendationsReceived',{
    ref: 'UserRecommendation',
    localField : '_id',
    foreignField : 'toUser'
})


//Method to check what to do when sending back profile
profileSchema.methods.toJSON = function (){
    const profile = this
    const profileObject = profile.toObject()
    
    //delete userObject.avatar

    return profileObject
}


profileSchema.pre('remove',async function(next){
    //deals with what has to be done when a user deletes account (remove offers,publications ...)
    next()
})

const Profile = mongoose.model('Profile',profileSchema)

module.exports = Profile 