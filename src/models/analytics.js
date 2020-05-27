const mongoose = require('mongoose')

//Ce schéma a pour but de conserver une trace de la fréquence de connexion des utilisateurs
//Le modèle sera à revoir lors du passage en prod, des moyens plus puissants peuvent être nécéssaires ici

const analyticsSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date:{
        type:String,
        required:true
    }
})

const Analytics = mongoose.model('Analytics',analyticsSchema)

module.exports = Analytics