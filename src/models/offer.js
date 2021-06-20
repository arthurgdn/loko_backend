const mongoose = require('mongoose');

const OfferComment = require('./offerComment');
const CollaborationDemand = require('./collaborationDemand');

//Schéma d'une annonce
const offerSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  //Le choix fait ici pour stocker la position est d'utiliser deux champs, un premier sous
  // forme de coordonnées latitude/longitude pour procéder aux calculs de distance sur le back
  // un second sous forme de texte faisant référence au lieu pour l'afficher sur le front
  // sans avoir à faire appel à l'API de mapbox à chaque fois
  location: {
    type: {
      type: String,
      enum: ['Point'], // sans avoir à faire appel à l'API de mapbox à chaque fois
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  locationText: {
    type: String,
    required: false,
    trim: true
  },
  locationRadius: {
    type: Number,
    required: false
  },
  completedStatus: {
    type: String,
    required: true
  },
  scope: {
    type: String,
    required: true,
    trim: true
  },
  groups: [
    {
      group: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Group'
      }
    }
  ],
  keywords: [{
    keyword: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Keyword'
    }
  }],
  collaborators: [{
    collaborator: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User'
    }
  }],
  image: {
    type: Buffer,
    required: false
  },
  hasImage: {
    type: Boolean,
    required: false
  }
}, {timestamps: true});

offerSchema.virtual('offerComments', {
  ref: 'OfferComment',
  localField: '_id',
  foreignField: 'publication'
});
offerSchema.virtual('collaborationDemands', {
  ref: 'CollaborationDemand',
  localField: '_id',
  foreignField: 'offer'
});

//Lorsqu'une annonce est supprimée, on supprime les commentaires et les réponses à celle-ci
offerSchema.pre('remove', async function (next) {
  const offer = this;
  await OfferComment.deleteMany({publication: offer._id});
  await CollaborationDemand.deleteMany({offer: offer._id});
  next();
});
//On minimise la taille des réponses
offerSchema.methods.toJSON = function () {
  const offer = this.toObject();
  delete offer.image;

  return offer;
};

const Offer = mongoose.model('Offer', offerSchema);
module.exports = Offer;