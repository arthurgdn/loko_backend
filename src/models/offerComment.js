const mongoose = require('mongoose')

//Schéma pour un commentaire sur une annonce
const offerCommentSchema = new mongoose.Schema({
    publisher : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    },
    publication : {
        type: mongoose.Schema.Types.ObjectId,
        required : true,
        ref: 'Offer'
    },
    content : {
        type: String,
        required : true,
        trim: true
    }

},{timestamps:true})

const OfferComment = mongoose.model('OfferComment',offerCommentSchema)
module.exports = OfferComment