const mongoose = require('mongoose');

//Schéma pour une recommendation envoyée à un utilisateur
const userRecommendationSchema = new mongoose.Schema({
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Profile'
  },
  content: {
    type: String,
    required: true,
    trim: true
  }
}, {timestamps: true});

const UserRecommendation = mongoose.model('UserRecommendation', userRecommendationSchema);
module.exports = UserRecommendation;