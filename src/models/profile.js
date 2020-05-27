const mongoose = require('mongoose')


//Schéma pour le profil d'un utilisateur
// l'idée était de pouvoir séparer les API relatives à l'utilisateur et à son profil
// il serait peut être plus optimal de les regrouper (--> piste d'amélioration)
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
    skills : {
        type : Array,
        required : false
    },
    keywords : [{
        keyword : {
            type :mongoose.Schema.Types.ObjectId,
            required : false,
            ref : 'Keyword'
        }
    }],
    completedOffers :[{
        completedOffer : {
            type : mongoose.Schema.Types.ObjectId,
            required : false,
            ref : 'Offer'
        }
    }],
    user : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    },

},{
    timestamps : true,
    skipVersioning:{completedOffers:true}
})

profileSchema.virtual('recommendationsReceived',{
    ref: 'UserRecommendation',
    localField : '_id',
    foreignField : 'toUser'
})



const Profile = mongoose.model('Profile',profileSchema)

module.exports = Profile 