const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Importation des modèles utilisés
const Offer = require('./offer');
const OfferComment = require('./offerComment');
const Message = require('./message');
const Profile = require('./profile');
const UserRecommendation = require('./userRecommendation');
const GroupMembership = require('./groupMembership');

//Schéma définissant un utilisateur
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
    validate (value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Ne mettez pas password dans votre mot de passe');
      }
    }
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate (value) {
      if(!validator.isEmail(value)) {
        throw new Error('Email invalide');
      }
    }
  },
  validatedEmail: {
    type: Boolean,
    required: true
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    validate (value) {
      if(!validator.isMobilePhone(value)) {
        throw new Error('Numéro de téléphone invalide');
      }
    }
  },
  validatedPhoneNumber: {
    type: Boolean,
    required: false
  },
  profilePicture: {
    type: Buffer,
    required: false
  },
  //Le choix fait ici pour stocker la position est d'utiliser deux champs, un premier sous
  // forme de coordonnées latitude/longitude pour procéder aux calculs de distance sur le back
  // un second sous forme de texte faisant référence au lieu pour l'afficher sur le front
  // sans avoir à faire appel à l'API de mapbox à chaque fois
  location: {
    type: {
      type: String,
      enum: ['Point'],
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
  }
  ,
  collaborators: [{
    collaborator: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User'
    }
  }],
  collaborationDemands: [{
    demand: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User'
    }
  }],
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  verifTokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  resetTokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, {timestamps: true});

//On définit les différents champs virtuels
//Certains ne sont pas utilisés, possibilité d'en supprimer certains
userSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'user'
});

userSchema.virtual('offers', {
  ref: 'Offer',
  localField: '_id',
  foreignField: 'owner'
});
userSchema.virtual('collaboratedOffers', {
  ref: 'Offer',
  localField: '_id',
  foreignField: 'collaborators.collaborator'
});
userSchema.virtual('conversations', {
  ref: 'Conversation',
  localField: '_id',
  foreignField: 'members.member'
});

userSchema.virtual('offerComments', {
  ref: 'OfferComment',
  localField: '_id',
  foreignField: 'publisher'
});
userSchema.virtual('recommendationsPublished', {
  ref: 'UserRecommendation',
  localField: '_id',
  foreignField: 'publisher'
});

userSchema.virtual('groupsJoined', {
  ref: 'GroupMembership',
  localField: '_id',
  foreignField: 'user'
});

//Méthode statique utilisée lors de la connexion de l'utilisateur avec ses identifiants
userSchema.statics.findByCredentials = async (email, password)=>{
  const user = await User.findOne({email});
  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email ou mot de passe incorrect');
  }
  return user;
};

//Méthode pour générer un token d'authentification
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({token});
  await user.save();
  return token;
};
//Méthode pour générer un token de vérification d'email
userSchema.methods.generateVerificationToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET);
  user.verifTokens = user.verifTokens.concat({token});
  await user.save();
  return token;
};
//Méthode pour générer un token de réinitialisation de mot de passe
userSchema.methods.generateResetToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET);
  user.resetTokens = user.resetTokens.concat({token});
  await user.save();
  return token;
};

//On minimise la taille des données à renvoyer et on supprime les informations sensibles
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.email;
  delete userObject.resetTokens;
  delete userObject.verifTokens;
  delete userObject.profilePicture;

  return userObject;
};
//Hash le mot de passe avant la sauvegarde
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});
//Supprime les données liées à l'utilisateur
userSchema.pre('remove', async function (next) {
  const user = this;
  await Offer.deleteMany({owner: user._id});
  await UserRecommendation.deleteMany({toUser: user._id});
  await UserRecommendation.deleteMany({publisher: user._id});
  await Profile.deleteMany({user: user._id});
  await OfferComment.deleteMany({publisher: user._id});
  await GroupMembership.deleteMany({user: user._id});
  await Message.deleteMany({author: user._id});
  for (const collaborator of user.collaborators) {
    const correspondingCollaborator = await User.findById(collaborator.collaborator);
    correspondingCollaborator.collaborators =
      correspondingCollaborator.collaborators.filter((otherCollaborator)=>{
        return String(otherCollaborator.collaborator)!== String(user._id);
      });
    await correspondingCollaborator.save();
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;