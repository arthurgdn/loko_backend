
const express = require('express');

const auth = require('../middleware/auth');
const Offer = require('../models/offer');
const User = require('../models/user');
const CollaborationDemand = require('../models/collaborationDemand');

const router = new express.Router();

//Recupère les réponses à une annonce, accessibles uniquement au créateur de l'annonce
router.get('/offer/:id/demands', auth, async (req, res)=>{
  try{
    const offer = await Offer.findById(req.params.id);
    if(!offer) {
      return res.status(404).send();
    }
    if(String(offer.owner)!==String(req.user._id)) {
      return res.status(400).send({error: 'Vous n\'avez pas accès à cela'});
    }
    await offer.populate({
      path: 'collaborationDemands',
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: {createdAt: -1}
      }
    }).execPopulate();

    //On formate les réponses de manière à avoir accès à l'utilisateur
    const finalDemands =[];
    for(const demand of offer.collaborationDemands) {
      const user = await User.findById(demand.from);
      if(!user) {
        return res.status(404).send('Aucun utilisateur ne correspond');
      }
      finalDemands.push({
        message: demand.message, offer: demand.offer, from: user.toJSON()
      });
    }
    res.send(finalDemands);
  }catch(e) {
    res.status(400).send(e);
  }
});

//Route permettant de répondre à une annonce
//On vérifie que l'utilisateur a un email validé
// qu'il n'a pas déjà répondu à l'annonce ou qu'il ne travaille pas encore dessus
//Format du body : {message}
router.post('/offer/:id/demand', auth, async (req, res)=>{
  try {
    const offer = await Offer.findById(req.params.id);
    if(!offer) {
      return res.status(404).send();
    }
    if(!req.user.validatedEmail) {
      return res.status(400).send({error: 'Vous devez avoir un email vérifié'});
    }
    const inCollaborators = offer.collaborators.find(
      (collaborator)=>String(collaborator.collaborator) ===String(req.user._id));
    const existingDemand = await CollaborationDemand.find(
      {offer: req.params.id, from: req.user._id});

    if(!!existingDemand && existingDemand.length !==0) {
      return res.status(400).send('Vous avez déjà répondu à cette annonce');
    }
    if(inCollaborators) {
      return res.status(400).send('Vous travaillez déjà sur cette annonce');
    }
    const demand = new CollaborationDemand({
      message: req.body.message,
      offer: req.params.id,
      from: req.user._id
    });
    await demand.save();
    res.status(201).send(demand);

  }catch(e) {
    console.log(e);
    res.status(400).send(e);
  }

});

//Permet d'accepter ou de refuser une réponse à une annonce
//Seul le créateur de l'annonce peut effectuer cette action
//Format du body : {status} --> "accepted" pour acepter, sinon on refuse
router.post('/offer/:id/demand/sort', auth, async (req, res)=>{
  try{
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).send();
    }

    if(String(offer.owner)!==String(req.user._id)) {
      return res.status(400).send({error: 'Vous n\'êtes pas authorisé à faire cela'});
    }
    const demand = await CollaborationDemand.findOneAndDelete(
      {from: req.body._id, offer: req.params.id});
    if(!demand) {
      return res.status(404).send();
    }

    if(req.body.status ==='accepted') {
      offer.collaborators.push({collaborator: req.body._id});
      await offer.save();
      res.send(demand);
    }else{
      res.send(demand);
    }
  }catch(e) {
    res.status(400).send(e);
  }
});


module.exports = router;