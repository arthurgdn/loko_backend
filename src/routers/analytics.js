const express = require('express')
const User = require('../models/user')
const Offer = require('../models/offer')
const Analytics = require('../models/analytics')
const auth = require('../middleware/auth')
const moment= require('moment')

const router = new express.Router()

router.post('/admin/analytics',async (req,res)=>{
    try{
        
        if(req.body.password===process.env.ADMIN_PASS){
            const data={}
            data.user_count = (await User.find()).length
            data.offer_count =(await Offer.find()).length
            
            const analytics = await  Analytics.find()
            data.total_connexions =   analytics.length
            const dated_connexions = {}
            for(connexion of analytics){
                if(dated_connexions[connexion.date]){
                    dated_connexions[connexion.date] += 1
                }else{
                    dated_connexions[connexion.date] = 1
                }
            }
            data.dated_connexions = dated_connexions 
            
            res.send(data)
    }
    else{
        res.send('Erreur de connexion')
    }
}catch(e){
    console.log(e)
        res.status(400).send(e)
    }
})

router.post('/analytics/connect',auth,async (req,res)=>{
    try{
        const analytic = new Analytics({
            user:req.user._id,
            date:moment().format('MM/DD/YYYY')
        })
        await analytic.save()
        res.status(201).send()
    }catch(e){
        res.status(400).send(e)
    }
})

module.exports= router