const mongoose = require('mongoose')

const keywordSchema = new mongoose.Schema({
    name : {
        type: String,
        trim: true,
        required : true
    }
})
 const Keyword = mongoose.model('Keyword',keywordSchema)
 module.exports = Keyword