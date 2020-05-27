const mongoose = require('mongoose')

//Schéma de réponse à une annonce

const collaborationDemandSchema = new mongoose.Schema({
    offer:{
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'Offer'
    },
    from : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    },
    message : {
        type: String,
        trim : true,
        required : false
    }
    
    
},{timestamps:true})

const CollaborationDemand = mongoose.model('CollaborationDemand',collaborationDemandSchema)

module.exports = CollaborationDemand