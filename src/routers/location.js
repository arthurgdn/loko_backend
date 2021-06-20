const express = require('express');
const Offer = require('../models/offer');
const Group = require('../models/group');
const Keyword = require('../models/keyword');
const User = require('../models/user');
const auth = require('../middleware/auth');
const {distanceLatLong} = require('../tools/utils/location');

const router = new express.Router();
//API pour récuperer toutes les offres dans un rayons "radius"
router.get('/offers/location', auth, async (req, res)=>{
  try{
    const offers = await Offer.find();
    const radius = req.query.radius ? req.query.radius : Infinity;
    if(!offers) {
      return res.status(404).send();
    }
    const filteredOffers = [];
    for (const offer of offers) {
      const dist = distanceLatLong(
        offer.location.coordinates[1],
        offer.location.coordinates[0],
        req.user.location.coordinates[1],
        req.user.location.coordinates[0]);

      if(dist<=radius) {
        const keywords = [];
        for(const keyword of offer.keywords) {

          const newKeyword = await Keyword.findById(keyword.keyword);

          if(!newKeyword) {
            return res.status(404).send();
          }
          keywords.push(newKeyword);
        }
        const offerPublisher = await User.findById(offer.owner);

        filteredOffers.push({
          ...offer.toJSON(),
          keywords,
          publisherName: offerPublisher.firstName + ' '+ offerPublisher.lastName,
          publisherId: offerPublisher._id
        });

      }
    }

    res.send(filteredOffers);
  }catch(e) {
    res.status(400).send(e);
  }
});
//API pour récuperer toutes les groupes dans un rayon "radius"
router.get('/groups/location', auth, async (req, res)=>{
  try{
    const groups = await Group.find();
    const radius = req.query.radius ? req.query.radius : Infinity;
    if(!groups) {
      return res.status(404).send();
    }
    const filteredGroups = [];
    for (const group of groups) {
      const dist = distanceLatLong(
        group.location.coordinates[1],
        group.location.coordinates[0],
        req.user.location.coordinates[1],
        req.user.location.coordinates[0]
      );

      if(dist<=radius) {
        filteredGroups.push(group);
      }
    }

    res.send(filteredGroups);
  }catch(e) {
    res.status(400).send(e);
  }
});

//API to get all users in a certain radius
router.get('/users/location', auth, async (req, res)=>{
  try{
    const users = await User.find();
    const radius = req.query.radius ? req.query.radius : Infinity;
    if(!users) {
      return res.status(404).send();
    }
    const filteredUsers = [];
    for (const user of users) {
      const dist = distanceLatLong(
        user.location.coordinates[1],
        user.location.coordinates[0],
        req.user.location.coordinates[1],
        req.user.location.coordinates[0]
      );

      if(dist<=radius) {
        filteredUsers.push(user);
      }
    }

    res.send(filteredUsers);
  }catch(e) {
    res.status(400).send(e);
  }
});

module.exports = router;