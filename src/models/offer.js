const mongoose = require('mongoose')
const OfferComment = require('./offerComment')
const CollaborationDemand = require('./collaborationDemand')

const offerSchema = new mongoose.Schema({
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    },
    title: {
        type: String,
        required: true,
        trim : true
    },
    description : {
        type: String,
        required : true,
        trim : true
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
        },
    locationText:{
        type : String,
        required : false,
        trim : true
    }
    ,
    locationRadius : {
        type: Number,
        required : false
    },
    completedStatus : {
        type: String,
        required: true
    },
    scope : {       //Defines which user can see the offer (groups/projects for example)
        type : String,
        required : true,
        trim : true
    },
    groups : [
        {
            group : {
                type : mongoose.Schema.Types.ObjectId,
                required : false,
                ref : 'Group'
            }
        }
    ],
    keywords : [{
        keyword : {
            type :mongoose.Schema.Types.ObjectId,
            required : false,
            ref : 'Keyword'
        }
    }],
    collaborators : [{
        collaborator : {
            type : mongoose.Schema.Types.ObjectId,
            required: false,
            ref:'User'
        }
    }],
    image : {
        type :Buffer,
        required : false
    },
    hasImage : {
        type : Boolean,
        required : false
    }
},{timestamps:true})

offerSchema.virtual('offerComments',{
    ref:'OfferComment',
    localField : '_id',
    foreignField : 'publication'
})
offerSchema.virtual('collaborationDemands',{
    ref : 'CollaborationDemand',
    localField : '_id',
    foreignField : 'offer'
})
offerSchema.pre('remove',async function(next){
    //deals with what has to be done when an offer is deleted
    const offer = this
    await OfferComment.deleteMany({publication : offer._id})
    await CollaborationDemand.deleteMany({offer : offer._id})
    next()
})

offerSchema.methods.toJSON = function (){
    const offer = this.toObject()
    delete offer.image

    return offer
}

const Offer = mongoose.model('Offer',offerSchema)
module.exports = Offer