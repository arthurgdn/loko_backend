const mongoose = require('mongoose')

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