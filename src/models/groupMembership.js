const mongoose = require('mongoose');

//Schéma définissant l'appartenance à un groupe
const groupMembershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Group'
  },
  status: {
    type: String,
    required: true,
    trim: true
  }

}, {timestamps: true});

const GroupMembership = mongoose.model('GroupMembership', groupMembershipSchema);
module.exports = GroupMembership;