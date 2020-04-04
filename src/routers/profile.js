const express = require('express')
const auth = require('../middleware/auth')
const Profile = require('../models/profile')
const User = require('../models/user')
const router = new express.Router()
router.patch('/profile',auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','summary','skills']
    
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    try{ 
        const profile = await Profile.findOne({user:req.user._id})
        if(!profile){
            return res.status(404).send()
        }
        updates.forEach((update)=>{
            profile[update] = req.body[update]
        })
        await profile.save()
        //const user = await User.findByIdAndUpdate(_id,req.body,{new : true,runValidators:true})
        res.send(profile)
    }
    catch(e){
        res.status(400).send(e)
    }
})
router.get('/profile/me',auth,async (req,res)=>{
    try{
        const profile = Profile.findOne({user: req.user._id})
        if(!profile){
            return res.status(404).send()
        }
        res.send(profile)
    }catch(e){
        res.status(400).send(e)
    }
})

//API to add a completed offer to the profile
router.post('/profile/completedOffer',auth,async (req,res)=>{
    try{
        const profile = Profile.findOne({user: req.user._id})
        const isAlreadyCompletedOffer = profile.completedOffers.find((completedOffer)=>String(completedOffer.completedOffer) ===String(req.body._id))
        const offerExists = !!(await Offer.findOne({_id:req.body._id}))
        
        //We check if this user exists, is not already a collaborator and if it's not the user himself
        if(isAlreadyCompletedOffer===undefined  && offerExists){
           profile.completedOffers.push({completedOffer : req.body._id})
           
           await profile.save()
           res.send()}
        else {
            res.status(400).send('Cannot add this completed offer')
        }
    }catch(e){
        res.status(400).send(e)
    }
})
module.exports = router