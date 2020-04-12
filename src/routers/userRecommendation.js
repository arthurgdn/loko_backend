const express = require('express')
const auth = require('../middleware/auth')
const User = require('../models/user')
const Profile = require('../models/profile')
const UserRecommendation = require('../models/userRecommendation')
const router = new express.Router()

// the :id always refers to the offer's id
router.post('/profile/:id/recommendation',auth, async(req, res) => {
    
    
    try {
        const profile = await Profile.findById(req.params.id)
        
        if(!profile){
            return res.status(404).send()
        }
        if(String(profile.user)===String(req.user._id)){
            return res.status(400).send('Vous ne pouvez pas écrire de recommendation à vous même ')
        }
            const recommendation = new UserRecommendation({
        ...req.body,
        toUser : profile._id,
        publisher : req.user._id
    })
        
        
        await recommendation.save()
        res.status(201).send(recommendation)
    }
    catch(e) {
        res.status(400).send(e)
    }
})

router.get('/profile/:id/recommendations',auth,async (req,res)=>{
    
   
    try {
        const profile = await Profile.findById(req.params.id)
        if(!profile){
            return res.status(404).send()
        }
        await profile.populate({
            path : 'recommendationsReceived'
        }).execPopulate()

        
        res.send(profile.recommendationsReceived)
    }
    catch(e){
        res.status(500).send(e)
    }
    
})





router.patch('/profile/:profile_id/recommendations/:id',auth, async (req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['content','note']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    
    try{
        const recommendation = await UserRecommendation.findOne({_id : req.params.id, toUser : req.params.profile_id})
        if(!recommendation){
            return res.status(404).send()
        }
        
        updates.forEach((update)=>{
            console.log(req.body[update])
            recommendation[update] = req.body[update]
        })
        
        await recommendation.save()
        res.send(recommendation)
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.delete('/profile/:profile_id/recommendation/:id', auth, async (req,res)=>{

    try {
        const recommendation = await UserRecommendation.findOneAndDelete({_id : req.params.id,toUser : req.params.profile_id})
        if(!recommendation){
            return res.status(404).send()
        }
        res.send(recommendation)
    }
    catch(e){
        res.status(400).send(e)
    }
})

module.exports = router