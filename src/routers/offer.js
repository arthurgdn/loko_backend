
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Offer = require('../models/offer');
const User = require('../models/user');
const Keyword = require('../models/keyword');
const auth = require('../middleware/auth');
const Group = require('../models/group');
const GroupMembership = require('../models/groupMembership');
const CollaborationDemand = require('../models/collaborationDemand');

const router = new express.Router();

//API to create a new offer
router.post('/offer/create', auth, async (req, res)=>{

  const offer = new Offer({
    ...req.body,
    owner: req.user._id,
    completedStatus: 'created',
    hasImage: false
  });
  if(!req.user.validatedEmail) {
    return res.status(400).send({error: 'User must have a verified email to do this'});
  }
  offer.keywords = [];
  offer.collaborators.push({collaborator: req.user._id});
  try{

    //Deal with keywords
    if(req.body.keywords.length>0) {
      for(const keyword of req.body.keywords) {
        const existingKeyword = await Keyword.findOne({name: keyword});
        if(!existingKeyword) {
          const newKeyword = new Keyword({name: keyword});
          offer.keywords.push({keyword: newKeyword._id});
          await newKeyword.save();
        }else{

          offer.keywords.push({keyword: existingKeyword._id});
        }
      }
    }

    if(offer.scope==='general' && !!offer.groups&& offer.groups.length>0) {
      return res.status(400).send({error: 'Cannot add groups when scope is general'});
    }

    //We check if the user is a member of the groups he publishes in
    if(offer.scope==='group') {
      for(const group of offer.groups) {
        const member = await GroupMembership.findOne({group: group.group, user: req.user._id});
        if(!member) {
          return res.status(400).send({error: 'You are not a member of this group'});
        }
      }
    }
    const formattedGroups = [];
    for(const group of offer.groups) {
      const newGroup = await Group.findById(group.group);

      if(!group) {
        return res.status(404).send();
      }
      formattedGroups.push({group: newGroup._id, groupName: newGroup.name});
    }
    const formattedKeywords = [];
    for(const keyword of offer.keywords) {

      const newKeyword = await Keyword.findById(keyword.keyword);

      if(!newKeyword) {
        return res.status(404).send();
      }
      formattedKeywords.push(newKeyword);
    }

    await offer.save();
    res.send({
      ...offer.toJSON(),
      keywords: formattedKeywords,
      groups: formattedGroups,
      hasSentDemand: false,
      publisherName: req.user.firstName + ' '+ req.user.lastName,
      publisherId: req.user._id
    });

  }catch(e) {
    console.log(e);
    res.status(400).send(e);
  }
});
//API to get an offer
router.get('/offer/:id', auth, async (req, res)=>{
  const _id = req.params.id;
  try {
    //const task = await Task.findById(_id)
    const offer = await Offer.findOne({_id});
    if (!offer) {
      return res.status(404).send();
    }
    const offerPublisher = await User.findById(offer.owner);
    //We check if the user is a member of at least one of the groups
    if(offer.scope==='group') {
      let isMember= false;
      for(const group of offer.groups) {
        const member = await GroupMembership.findOne({group: group.group, user: req.user._id});
        if(member) {
          isMember = true;
        }
      }
      if(!isMember) {
        return res.status(400).send(
          {error: 'You are not a member of the groups in which the offer is published'});
      }

    }
    const keywords = [];
    for(const keyword of offer.keywords) {

      const newKeyword = await Keyword.findById(keyword.keyword);

      if(!newKeyword) {
        return res.status(404).send();
      }
      keywords.push(newKeyword);
    }
    const collaborationDemand = await CollaborationDemand.findOne(
      {from: req.user._id, offer: offer._id});

    res.send({
      ...offer.toJSON(),
      keywords,
      publisherName: offerPublisher.firstName + ' '+ offerPublisher.lastName,
      hasSentDemand: !!collaborationDemand,
      publisherId: offerPublisher._id
    });
  }
  catch(e) {
    res.status(400).send(e);
  }


});
//API to edit an offer
router.patch('/offer/:id', auth, async (req, res)=>{

  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'title',
    'description',
    'location',
    'locationText',
    'locationRadius',
    'completedStatus',
    'keywords',
    'scope',
    'groups'
  ];
  const isValidOperation = updates.every((update)=>allowedUpdates.includes(update));
  if (!isValidOperation) {

    return res.status(400).send({error: 'Invalid updates'});
  }
  try {
    const offer = await Offer.findOne({_id: req.params.id});
    if(!offer) {

      return res.status(404).send();
    }
    if(String(offer.owner)!==String(req.user._id)) {

      return res.status(400).send({error: 'You have to be the publisher of the offer'});
    }
    for(const update of updates) {
      //We do the same thing when we encounter a new keyword
      if(update==='keywords') {
        offer.keywords = [];
        for(const keyword of req.body.keywords) {
          const existingKeyword = await Keyword.findOne({name: keyword});
          if(!existingKeyword) {
            const newKeyword = new Keyword({name: keyword});
            offer.keywords.push({keyword: newKeyword._id});

            await newKeyword.save();

          }else{

            offer.keywords.push({keyword: existingKeyword._id});

          }
        }
      }else{
        offer[update] = req.body[update];
      }
    }

    await offer.save();

    res.send({...offer.toJSON(), hasSentDemand: false});
  }

  catch(e) {

    res.status(400).send(e);
  }
});

//API to delete an offer
router.delete('/offer/:id', auth, async (req, res)=>{

  try {
    const offer = await Offer.findById(req.params.id);


    if(!offer) {
      return res.status(404).send();
    }
    if(String(offer.owner)!==String(req.user._id)) {
      return res.status(400).send({error: 'You have to be the publisher of the offer'});
    }
    const deletedOffer = await Offer.findByIdAndDelete(req.params.id);
    res.send(deletedOffer);
  }
  catch(e) {

    res.status(400).send(e);
  }
});
//API for a user to get his created offers
router.get('/offers/me', auth, async (req, res)=>{

  const match = {};
  if (req.query.status) {
    match.completedStatus = req.query.status;
  }
  try {

    await req.user.populate({
      path: 'offers',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: {createdAt: -1}
      }
    }).execPopulate();
    const formatedOffers = [];
    for(const offer of req.user.offers) {
      const keywords = [];
      for(const keyword of offer.keywords) {

        const newKeyword = await Keyword.findById(keyword.keyword);

        if(!newKeyword) {
          return res.status(404).send();
        }
        keywords.push(newKeyword);
      }
      const formattedGroups = [];
      for(const group of offer.groups) {
        const newGroup = await Group.findById(group.group);
        if(!group) {
          return res.status(404).send();
        }
        formattedGroups.push({group: newGroup._id, groupName: newGroup.name});
      }

      const collaborators = [];
      for (const collaborator of offer.collaborators) {
        const newCollaborator = await User.findById(collaborator.collaborator);
        if(!newCollaborator) {
          return res.status(404).send();
        }
        collaborators.push(newCollaborator);

      }
      const offerPublisher = await User.findById(offer.owner);
      const collaborationDemand = await CollaborationDemand.findOne(
        {offer: offer._id, from: req.user._id});
      formatedOffers.push({
        ...offer.toJSON(),
        collaborators,
        keywords, hasSentDemand: !!collaborationDemand,
        groups: formattedGroups,
        publisherName: offerPublisher.firstName + ' '+ offerPublisher.lastName,
        publisherId: offerPublisher._id
      });

    }

    res.send(formatedOffers);
  }
  catch(e) {

    res.status(400).send(e);
  }
});
//API for a user to get the offers he collaborates on
router.get('/offers/collaborated/me', auth, async (req, res)=>{

  const match = {};
  if (req.query.status) {
    match.completedStatus = req.query.status;
  }
  try {

    await req.user.populate({
      path: 'collaboratedOffers',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: {createdAt: -1}
      }
    }).execPopulate();
    const formatedOffers = [];
    for(const offer of req.user.collaboratedOffers) {
      const keywords = [];
      for(const keyword of offer.keywords) {

        const newKeyword = await Keyword.findById(keyword.keyword);

        if(!newKeyword) {
          return res.status(404).send();
        }
        keywords.push(newKeyword);
      }
      const formattedGroups = [];
      for(const group of offer.groups) {
        const newGroup = await Group.findById(group.group);

        if(!group) {
          return res.status(404).send();
        }

        formattedGroups.push({group: newGroup._id, groupName: newGroup.name});
      }
      const collaborators = [];
      for (const collaborator of offer.collaborators) {
        const newCollaborator = await User.findById(collaborator.collaborator);
        if(!newCollaborator) {
          return res.status(404).send();
        }
        collaborators.push(newCollaborator);

      }
      const offerPublisher = await User.findById(offer.owner);
      const collaborationDemand = await CollaborationDemand.findOne(
        {offer: offer._id, from: req.user._id});
      formatedOffers.push({
        ...offer.toJSON(),
        collaborators,
        groups: formattedGroups,
        keywords, hasSentDemand: !!collaborationDemand,
        publisherName: offerPublisher.firstName + ' '+ offerPublisher.lastName,
        publisherId: offerPublisher._id
      });

    }

    res.send(formatedOffers);
  }
  catch(e) {

    res.status(400).send(e);
  }
});
//Get all offers in a group
router.get('/offers/group/:id', auth, async (req, res)=>{
  try{

    const group = await Group.findById(req.params.id);
    if(!group) {
      return res.status(404).send();
    }
    const membership = await GroupMembership.findOne({group: group._id, user: req.user._id});
    if(!membership && (group.status ==='onRequest' || group.status==='private')) {
      return res.status(400).send({error: 'You do not have access to this'});
    }
    await group.populate({
      path: 'offers',
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: {createdAt: -1}
      }
    }).execPopulate();
    const formatedOffers = [];
    for(const offer of group.offers) {
      const keywords = [];
      for(const keyword of offer.keywords) {

        const newKeyword = await Keyword.findById(keyword.keyword);

        if(!newKeyword) {
          return res.status(404).send();
        }
        keywords.push(newKeyword);
      }
      const offerPublisher = await User.findById(offer.owner);
      const collaborationDemand = await CollaborationDemand.findOne(
        {offer: offer._id, from: req.user._id});
      formatedOffers.push({
        ...offer.toJSON(),
        keywords,
        publisherName: offerPublisher.firstName + ' '+ offerPublisher.lastName,
        hasSentDemand: !!collaborationDemand,
        publisherId: offerPublisher._id
      });

    }

    res.send(formatedOffers);

  }catch(e) {
    console.log(e);
    res.status(400).send(e);
  }
});


const upload =multer({
  limits: {fileSize: 5242880, },
  fileFilter (req, file, callback) {
    if (!file.originalname.match(/\.(png|jpg|gif|JPG|PNG|GIF)$/)) {
      return callback(new Error('Veuillez choisir une photo'));
    }

    callback(undefined, true);

  }
});

router.post('/offer/:id/image', auth, upload.single('image'), async (req, res)=>{
  //client side can resize the image instead of doing it when upload on server side
  const buffer = await sharp(req.file.buffer).resize({width: 500, height: 500}).toBuffer();
  const offer = await Offer.findById(req.params.id);
  if(!offer) {
    return res.status(404).send();
  }

  offer.image = buffer;
  offer.hasImage = true;
  await offer.save();
  res.send(buffer);
}, (error, req, res)=>{

  res.status(400).send({error: error.message});
});
//Recuperer la photo d'une offre
router.get('/offer/:id/image', async (req, res)=>{
  try{

    const offer = await Offer.findById(req.params.id);

    if(!offer || !offer.image) {

      return res.status(404).send();
    }
    res.set('Content-Type', 'image/jpg');

    res.send(offer.image);


  }catch(e) {
    res.status(404).send();
  }
});
module.exports = router;