const express = require('express');
const moment= require('moment');

const auth = require('../middleware/auth');


const User = require('../models/user');
const Offer = require('../models/offer');
const Analytics = require('../models/analytics');

const router = new express.Router();

//Cette route permet de récuperer les données d'analyse du flux des utilisateurs
//La connexion demande un mot de passe
//Les infos renvoyées sont : le nombre d'users,
// d'annonces publiées, le nombre de connexions par jours
router.post('/admin/analytics', async (req, res)=>{
  try{

    if(req.body.password===process.env.ADMIN_PASS) {
      const data={};
      data.user_count = (await User.find()).length;
      data.offer_count =(await Offer.find()).length;

      const analytics = await  Analytics.find();
      data.total_connexions =   analytics.length;
      const dated_connexions = {};
      for(const connexion of analytics) {
        if(dated_connexions[connexion.date]) {
          dated_connexions[connexion.date] += 1;
        }else{
          dated_connexions[connexion.date] = 1;
        }
      }
      data.dated_connexions = dated_connexions;

      res.send(data);
    }
    else{
      res.send('Erreur de connexion');
    }
  }catch(e) {
    console.log(e);
    res.status(400).send(e);
  }
});

//Cette route est appelée lorsqu'un utilisateur se connecte
//Une entrée dans la DB comporte uniquement l'id de l'user ainsi que la date de connexion
router.post('/analytics/connect', auth, async (req, res)=>{
  try{
    const analytic = new Analytics({
      user: req.user._id,
      date: moment().format('MM/DD/YYYY')
    });
    await analytic.save();
    res.status(201).send();
  }catch(e) {
    res.status(400).send(e);
  }
});

module.exports= router;