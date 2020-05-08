const mongoose = require('mongoose')

const userRecommendationSchema = new mongoose.Schema({
    publisher : {
        type : mongoose.Schema.Types.ObjectId,
        required: true,
        ref:'User'
    },
    toUser : {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:'Profile'
    },
    content: {
        type: String,
        required: true,
        trim : true
    }
},{timestamps:true})

const UserRecommendation = mongoose.model('UserRecommendation',userRecommendationSchema)
module.exports = UserRecommendation