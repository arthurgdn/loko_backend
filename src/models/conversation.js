const mongoose = require('mongoose');

const Message = require('./message');

//Schéma contenant les informations relatives à une conversation

const conversationSchema = new mongoose.Schema({
  members: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User'
    }
  }],
  admins: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User'
    }
  }],
  name: {
    type: String,
    required: false,
    trim: true
  },

  description: {
    type: String,
    required: false,
    trim: true
  },
  image: {
    type: Buffer,
    required: false
  },
  hasImage: {
    type: Boolean,
    required: false
  }
}, {timestamps: true});

conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation'
});

//On minimise la taille des données à renvoyer
conversationSchema.methods.toJSON = function () {
  const conversation = this;
  const conversationObject = conversation.toObject();
  delete conversationObject.image;

  return conversationObject;
};

//On supprime les messages d'une conversation lorsqu'on supprime cette dernière
conversationSchema.pre('remove', async function (next) {
  const conversation = this;
  await Message.deleteMany({conversation: conversation._id});
  next();
});
const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;