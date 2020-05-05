const express = require('express')
const auth = require('../middleware/auth')
const Profile = require('../models/profile')
const Offer = require('../models/offer')
const User = require('../models/user')
const Keyword = require('../models/keyword')
const router = new express.Router()
router.patch('/profile',auth,async (req,res)=>{
    
    const updates = Object.keys(req.body)
    
    const allowedUpdates = ['description','summary','skills','keywords']
    
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    try{ 
        const profile = await Profile.findOne({user:req.user._id})
        if(!profile){
            return res.status(404).send()
        }
        for(update of updates){
            //We do the same thing when we encounter a new keyword
            if(update==='keywords'){
                profile.keywords = []
                for(keyword of req.body.keywords){
                    const existingKeyword = await Keyword.findOne({name:keyword})
                    if(!existingKeyword){
                        const newKeyword = new Keyword({name:keyword})
                        profile.keywords.push({keyword:newKeyword._id})
                        
                        await newKeyword.save()
                        
                    }else{
                         
                        profile.keywords.push({keyword:existingKeyword._id})
                        
                    }
                }
            }else{
            profile[update] = req.body[update]
            }
        }
        await profile.save()
        res.send(profile)
    }
    catch(e){
        
        res.status(400).send(e)
    }
})
router.get('/profile/:id',auth,async (req,res)=>{
    try{
        const profile = await  Profile.findOne({user: req.params.id})
        
        const {firstName,lastName,location,locationText,profilePicture} = await User.findById(req.params.id)
        
        if(!profile || !firstName || !lastName){
            
            return res.status(404).send()
        }
        const keywords = []
        
        for(keyword of profile.keywords){
            
            const newKeyword = await Keyword.findById(keyword.keyword)
            
            if(!newKeyword){
                return res.status(404).send()
            }
            keywords.push(newKeyword)
        }
        
        res.send({
            ...profile._doc,
            firstName,
            lastName,
            location,
            locationText,
            profilePicture,
            keywords
        })
    }catch(e){
        
        res.status(400).send(e)
    }
})

//API to add a completed offer to the profile
router.post('/profile/completedOffer',auth,async (req,res)=>{
    try{
        const profile = await  Profile.findOne({user: req.user._id})
        const isAlreadyCompletedOffer =  profile.completedOffers.find((completedOffer)=>String(completedOffer.completedOffer) ===String(req.body._id))
        const offer = await Offer.findOne({_id:req.body._id})

        if(isAlreadyCompletedOffer===undefined  && !!profile && !!offer && offer.completedStatus ==='completed' ){
           profile.completedOffers.push({completedOffer : req.body._id})
           
           await profile.save()
           res.send({completedOffer : req.body._id})}
        else {
            res.status(400).send({error:'Cannot add this completed offer'})
        }
    }catch(e){
        res.status(400).send(e)
    }
    
})
module.exports = router