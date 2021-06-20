const mongoose = require('mongoose');

//Schéma d'un message
//Il faudra éventuellement réfléchir à la possibilité d'envoyer des images,
// ou des fichiers, ou plus pertinement : une position
const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Conversation'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  content: {
    type: String,
    required: true
  }
}, {timestamps: true});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;