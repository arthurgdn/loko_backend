const express = require('express');

const auth = require('../middleware/auth');
const Profile = require('../models/profile');
const User = require('../models/user');
const UserRecommendation = require('../models/userRecommendation');

const router = new express.Router();

// the :id always refers to the offer's id
router.post('/profile/:id/recommendation', auth, async (req, res) => {


  try {
    const profile = await Profile.findOne({user: req.params.id});

    if(!profile) {
      return res.status(404).send();
    }
    if(!req.user.validatedEmail) {
      return res.status(400).send({error: 'User must have a verified email to do this'});
    }
    if(String(profile.user)===String(req.user._id)) {
      return res.status(400).send(
        {error: 'Vous ne pouvez pas écrire de recommendation à vous même '});
    }
    const recommendation = new UserRecommendation({
      ...req.body,
      toUser: profile._id,
      publisher: req.user._id
    });


    await recommendation.save();
    res.status(201).send({
      ...recommendation._doc, publisher: {
        _id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName
      }
    });
  }
  catch(e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.get('/profile/:id/recommendations', auth, async (req, res)=>{


  try {
    const profile = await Profile.findOne({user: req.params.id});
    if(!profile) {
      return res.status(404).send();
    }
    await profile.populate({
      path: 'recommendationsReceived',
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: {createdAt: -1}
      }
    }).execPopulate();

    const formattedRecommendations = [];
    for (const recommendation of profile.recommendationsReceived) {
      const {
        _id, firstName, lastName
      } = await User.findById(recommendation.publisher);
      if(!_id) {
        return res.status(404).send();
      }
      formattedRecommendations.push({
        ...recommendation._doc, publisher: {
          _id, firstName, lastName
        }
      });
    }


    res.send(formattedRecommendations);
  }
  catch(e) {

    res.status(500).send(e);
  }

});


router.patch('/profile/:profile_id/recommendations/:id', auth, async (req, res)=>{

  const updates = Object.keys(req.body);
  const allowedUpdates = ['content'];
  const isValidOperation = updates.every((update)=>allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({error: 'Invalid updates'});
  }

  try{
    const recommendation = await UserRecommendation.findOne({
      _id: req.params.id, toUser: req.params.profile_id, publisher: req.user._id
    });
    if(!recommendation) {
      return res.status(404).send();
    }

    updates.forEach((update)=>{

      recommendation[update] = req.body[update];
    });

    await recommendation.save();
    res.send(recommendation);
  }
  catch(e) {
    res.status(400).send(e);
  }
});

router.delete('/profile/:profile_id/recommendation/:id', auth, async (req, res)=>{

  try {
    const recommendation = await UserRecommendation.findOneAndDelete({
      _id: req.params.id, toUser: req.params.profile_id, publisher: req.user._id
    });
    if(!recommendation) {
      return res.status(404).send();
    }
    res.send(recommendation);
  }
  catch(e) {
    res.status(400).send(e);
  }
});

module.exports = router;