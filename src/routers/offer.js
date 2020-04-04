const mongoose = require('mongoose')
const express = require('express')
const Offer = require('../models/offer')
const User = require('../models/user')
const Keyword = require('../models/keyword')
const auth = require('../middleware/auth')


const router = new express.Router()
router.post('/offer/create',auth, async (req,res)=>{
    const offer = new Offer({
        ...req.body,
        owner : req.user._id,
        completedStatus : 'created'
    })
    offer.keywords = []
    try{
    //Deal with keywords
    if(req.body.keywords.length>0){
        for(keyword of req.body.keywords){
            const existingKeyword = await Keyword.findOne({name:keyword})
            if(!existingKeyword){
                const newKeyword = new Keyword({name:keyword})
                offer.keywords.push({keyword:newKeyword._id})
                await newKeyword.save()
            }else{
                 
                offer.keywords.push({keyword:existingKeyword._id})
            }
        }
    }
        await offer.save()
        res.status(201).send(offer)
    }catch(e){
        res.status(400).send(e)
    }
    })
module.exports = router