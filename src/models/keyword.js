const mongoose = require('mongoose')

//Schéma définissant les mots clés
const keywordSchema = new mongoose.Schema({
    name : {
        type: String,
        trim: true,
        required : true
    }
})
keywordSchema.virtual('associatedOffers',{
    ref:'Offer',
    localField : '_id',
    foreignField : 'keywords.keyword'
})
keywordSchema.virtual('associatedGroups',{
    ref:'Group',
    localField : '_id',
    foreignField : 'keywords.keyword'
})
 const Keyword = mongoose.model('Keyword',keywordSchema)
 module.exports = Keyword