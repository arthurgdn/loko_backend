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
        const {firstName,lastName,locationText} = req.user
        
        
        const keywords = []
        
        for(keyword of profile.keywords){
            
            const newKeyword = await Keyword.findById(keyword.keyword)
            
            if(!newKeyword){
                return res.status(404).send()
            }
            keywords.push(newKeyword)
        }
        
        const formattedCompletedOffers = []
        for (completedOffer of profile.completedOffers){
            const offer = await Offer.findById(completedOffer.completedOffer)
            if(!offer){
                return res.status(404).send()
            }
            
            formattedCompletedOffers.push({completedOffer : offer._id,title : offer.title,description:offer.description,createdAt:offer.createdAt,completedStatus:offer.completedStatus})
        }
        
        res.send({
            ...profile._doc,
            completedOffers : formattedCompletedOffers,
            firstName,
            lastName,
            locationText,
            keywords
        })
        
    }
    catch(e){
        console.log(e)
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
        
        const formattedCompletedOffers = []
        for (completedOffer of profile.completedOffers){
            const offer = await Offer.findById(completedOffer.completedOffer)
            if(!offer){
                return res.status(404).send()
            }
            formattedCompletedOffers.push({completedOffer : offer._id,title : offer.title,description:offer.description,createdAt:offer.createdAt,completedStatus:offer.completedStatus})
        
        }
        
        res.send({
            ...profile._doc,
            completedOffers : formattedCompletedOffers,
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
router.post('/profile/completedOffers',auth,async (req,res)=>{
    
    try{
        console.log(req.body.completedOffers)
        const profile = await  Profile.findOne({user: req.user._id})
        const updatedCompletedOffers = []
        for (bodyCompletedOffer of req.body.completedOffers){
            const offer = await Offer.findOne({_id:bodyCompletedOffer._id})

            if( !!profile && !!offer && offer.completedStatus ==='completed' ){
                updatedCompletedOffers.push({completedOffer : offer._id})
        }
        
        else {
            
            return res.status(400).send({error:'Cannot add this completed offer'})
        }
    }
    profile.completedOffers = updatedCompletedOffers
    await profile.save()
    
    const {firstName,lastName,location,locationText} = req.user
        
    if(!profile || !firstName || !lastName){
        
        return res.status(404).send()
    }
    const keywords = []
    
    for(keyword of profile.keywords){
        
        const newKeyword = await Keyword.findById(keyword.keyword)
        
        if(!newKeyword){
            return res.status(404).send()
        }
        keywords.push(newKeyword.name)
    }
           
        const formattedCompletedOffers = []
        console.log('ok',profile.completedOffers)
        for (completedOffer of profile.completedOffers){
            const offer = await Offer.findById(completedOffer.completedOffer)
            if(!offer){
                return res.status(404).send()
            }
            formattedCompletedOffers.push({completedOffer : offer._id,title : offer.title,description:offer.description,createdAt:offer.createdAt,completedStatus:offer.completedStatus})
        
        }
        
        res.send({
            ...profile._doc,
            completedOffers : formattedCompletedOffers,
            firstName,
            lastName,
            location,
            locationText,
            keywords
        })
        
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
    
})
module.exports = router