const mongoose = require('mongoose')
const validator = require('validator')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//create userSchema
const userSchema = new mongoose.Schema({
    firstName: {
        type : String,
        required : true,
        trim : true
    },
    lastName:{
        type: String,
        required: true,
        trim : true
    },
    password : {
        type : String,
        required : true,
        trim : true,
        minlength : 6,
        validate(value){
            if (value.toLowerCase().includes('password')){
                throw new Error('Do not use password in your password')
            }
        }
    },
    email : {
        type : String,
        required : true,
        trim : true,
        unique : true,
        lowercase : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },
    validatedEmail : {
        type: Boolean,
        required: true
    },
    phoneNumber : {
        type:String,
        required : false,
        unique: true,
        trim: true,
        validate(value){
            if(!validator.isMobilePhone(value)){
                throw new Error('Phone is invalid')
            }
        }
    },
    validatedPhoneNumber : {
        type: Boolean,
        required: false
    },
    profilePicture : {
        type: Buffer,
        required : false
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
    ,
    collaborators : [{
        collaborator : {
            type : mongoose.Schema.Types.ObjectId,
            required : true,
            ref:'User'
        } 
    }],
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }]
},{
    timestamps : true
})


userSchema.virtual('profile',{
    ref:'Profile',
    localField : '_id',
    foreignField : 'user'
})

userSchema.virtual('offers',{
    ref:'Offer',
    localField : '_id',
    foreignField : 'owner'
})

userSchema.virtual('conversations',{
    ref:'Conversation',
    localField : '_id',
    foreignField : 'member'
})

userSchema.virtual('offerComments',{
    ref:'OfferComment',
    localField : '_id',
    foreignField : 'publisher'
})
userSchema.virtual('recommendationsPublished',{
    ref: 'UserRecommendation',
    localField : '_id',
    foreignField : 'publisher'
})

user.Schema.virtual('groupsJoined',{
    ref:'GroupMembership',
    localField: '_id',
    foreignField : 'user'
})

//this static is to be used for login
userSchema.statics.findByCredentials = async (email,password)=>{
    const user = await User.findOne({email})
    if (!user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if (!isMatch){
        throw new Error('Unable to login')
    }
    return user
}

//this method is to be used to generate the token when loging in
userSchema.methods.generateAuthToken = async function (){
    const user = this
    const token = jwt.sign({ _id: user._id.toString()},process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

//Method to check what to do when sending back user
userSchema.methods.toJSON = function (){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    //delete userObject.avatar

    return userObject
}
//Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})

userSchema.pre('remove',async function(next){
    //deals with what has to be done when a user deletes account (remove offers,publications ...)
    next()
})

const User = mongoose.model('User',userSchema)

module.exports = User 