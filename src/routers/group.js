const express = require('express');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const Group = require('../models/group');
const GroupMembership = require('../models/groupMembership');
const Keyword = require('../models/keyword');
const Profile = require('../models/profile');

const {distanceLatLong} = require('../tools/utils/location');


const router = new express.Router();
//API to create a new group the request should have the following body:
// {name,description,securityStatus = open/onRequest/private,keywords,groupType,location}
router.post('/group', auth, async (req, res)=>{
  const group = new Group({...req.body, hasImage: false});
  const admin = new GroupMembership({
    user: req.user._id,
    group: group._id,
    status: 'admin'
  });
  if(!req.user.validatedEmail) {
    return res.status(400).send({error: 'User must have a verified email to do this'});
  }
  group.keywords = [];
  try{
    //Deal with keywords
    if(req.body.keywords.length>0) {
      for(const keyword of req.body.keywords) {
        const existingKeyword = await Keyword.findOne({name: keyword});
        if(!existingKeyword) {
          const newKeyword = new Keyword({name: keyword});
          group.keywords.push({keyword: newKeyword._id});
          await newKeyword.save();
        }else{

          group.keywords.push({keyword: existingKeyword._id});
        }
      }
    }
    await group.save();
    await admin.save();

    const keywords = [];
    for(const keyword of group.keywords) {

      const newKeyword = await Keyword.findById(keyword.keyword);

      if(!newKeyword) {
        return res.status(404).send();
      }
      keywords.push(newKeyword);
    }
    res.status(201).send({
      ...group.toJSON(), keywords, membership: 'admin'
    });
  }catch(e) {
    console.log(e);
    res.status(400).send(e);
  }
});

//API to get a group's info (you do not have to be a member for this)
router.get('/group/:id', auth, async (req, res)=>{
  try{
    const group = await Group.findById(req.params.id);
    if(!group) {
      return res.status(404).send();
    }
    const keywords = [];
    for(const keyword of group.keywords) {

      const newKeyword = await Keyword.findById(keyword.keyword);

      if(!newKeyword) {
        return res.status(404).send();
      }
      keywords.push(newKeyword);
    }
    const membership = await GroupMembership.findOne({group: group._id, user: req.user._id});
    res.send({
      ...group.toJSON(), keywords, membership: membership?membership.status:'notMember'
    });
  }catch(e) {

    res.status(500).send(e);
  }
});
router.patch('/group/:id', auth, async (req, res)=>{
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'name',
    'description',
    'location',
    'locationText',
    'keywords',
    'groupType',
    'securityStatus'
  ];
  const isValidOperation = updates.every((update)=>allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({error: 'Invalid updates'});
  }
  try {
    const group = await Group.findOne({_id: req.params.id});
    if(!group) {
      return res.status(404).send();
    }
    const admin = await GroupMembership.findOne({
      group: req.params.id, user: req.user._id, status: 'admin'
    });
    if(!admin) {
      return res.status(400).send({error: 'User has to be admin to change this'});
    }
    for(const update of updates) {
      //We do the same thing when we encounter a new keyword
      if(update==='keywords') {
        group.keywords = [];
        for(const keyword of req.body.keywords) {
          const existingKeyword = await Keyword.findOne({name: keyword});
          if(!existingKeyword) {
            const newKeyword = new Keyword({name: keyword});
            group.keywords.push({keyword: newKeyword._id});

            await newKeyword.save();

          }else{

            group.keywords.push({keyword: existingKeyword._id});

          }
        }
      }else{
        group[update] = req.body[update];
      }
    }

    await group.save();
    const keywords = [];
    for(const keyword of group.keywords) {

      const newKeyword = await Keyword.findById(keyword.keyword);

      if(!newKeyword) {
        return res.status(404).send();
      }
      keywords.push(newKeyword);
    }
    const membership = await GroupMembership.findOne({group: group._id, user: req.user._id});
    res.send({
      ...group.toJSON(), keywords, membership: membership?membership.status:'notMember'
    });
  }

  catch(e) {
    res.status(400).send(e);
  }
});

router.delete('/group/:id', auth, async (req, res)=>{
  try{
    const admin = await GroupMembership.findOne({
      group: req.params.id, user: req.user._id, status: 'admin'
    });
    if (!admin) {
      return res.status(400).send({error: 'User has to be admin to do this'});
    }
    const group = await Group.findByIdAndDelete(req.params.id);
    if(!group) {
      return res.status(404).send();
    }
    res.send(group);
  }catch(e) {
    res.status(400).send(e);
  }
});


const upload =multer({
  limits: {fileSize: 5000000, },
  fileFilter (req, file, callback) {
    if (!file.originalname.match(/\.(png|jpg|jpeg|gif|JPEG|JPG|PNG|GIF)$/)) {
      return callback(new Error('Veuillez choisir une photo'));
    }

    callback(undefined, true);

  }
});

router.post('/group/:id/image', auth, upload.single('image'), async (req, res)=>{
  //client side can resize the image instead of doing it when upload on server side
  const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
  const group = await Group.findById(req.params.id);
  if(!group) {
    return res.status(404).send();
  }

  group.image = buffer;
  group.hasImage = true;
  await group.save();
  res.send();
}, (error, req, res)=>{

  res.status(400).send({error: error.message});
});
//Recuperer la photo d'un groupe
router.get('/group/:id/image', async (req, res)=>{
  try{

    const group = await Group.findById(req.params.id);

    if(!group || !group.image) {

      return res.status(404).send();
    }
    res.set('Content-Type', 'image/jpg');

    res.send(group.image);


  }catch(e) {
    res.status(404).send();
  }
});

router.get('/suggestedgroups', auth, async (req, res)=>{
  try{
    const suggestions = [];
    //On note les id de chaque offre qu'on a déjà aujouté au fil d'actualité
    const suggestionsIds=[];
    const profile = await Profile.findOne({user: req.user._id});
    //On récupere les annonces avec les mots-clés associés au profil de l'utilisateur
    if(!!profile.keywords && profile.keywords.length>0) {
      for(const keywordObj of profile.keywords) {
        const keyword = await Keyword.findById(keywordObj.keyword);
        if(!keyword) {
          return res.status(404).send();
        }
        await keyword.populate({
          path: 'associatedGroups',
          options: {sort: {createdAt: -1}}
        }).execPopulate();
        for(const group of keyword.associatedGroups) {
          const member = await GroupMembership.findOne({group: group._id, user: req.user._id});

          if(!member) {


            const index = suggestionsIds.indexOf(String(group._id));
            let points;
            let distance;
            if(index>=0) {
              suggestions[index].points += 10;

            }else{
              points = 0;

              if(group.location.coordinates.length>0) {
                const dist = distanceLatLong(
                  group.location.coordinates[1],
                  group.location.coordinates[0],
                  req.user.location.coordinates[1],
                  req.user.location.coordinates[0]
                );
                points += Math.max(20-Math.floor(dist*2), 0);
                distance = dist;
              }
              const keywords = [];
              for(const groupKeyword of group.keywords) {

                const newKeyword = await Keyword.findById(groupKeyword.keyword);

                if(!newKeyword) {
                  return res.status(404).send();
                }
                keywords.push(newKeyword);
              }
              suggestions.push({
                ...group.toJSON(), points, distance, keywords, membership: 'notMember'
              });

              suggestionsIds.push(String(group._id));

            }
          }}}}


    res.send(suggestions.sort((a, b) => a.points < b.points ? 1 : -1));
  }catch(e) {
    console.log(e);
    res.status(400).send(e);
  }
});
module.exports= router;