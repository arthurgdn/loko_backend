const mongoose = require('mongoose')
const express = require('express')
const Offer = require('../models/offer')
const User = require('../models/user')
const Keyword = require('../models/keyword')
const auth = require('../middleware/auth')


const router = new express.Router()

//API to create a new offer
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
//API to get an offer 
router.get('/offer/:id',auth,async (req,res)=>{
    const _id = req.params.id

    try {
        //const task = await Task.findById(_id)
        const offer = await Offer.findOne({_id})
        if (!offer){
            return res.status(404).send()
        }
        res.send(offer)
    }
    catch(e){
        res.status(500).send(e)
    }
    

})
//API to edit an offer
router.patch('/offer/:id',auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['title','description','location','locationRadius','completedStatus','scope','keywords']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    } 
    try {
        const offer = await Offer.findOne({_id : req.params.id})
        if(!offer){
            return res.status(404).send()
        }
        updates.forEach((update)=>{
            //We do the same thing when we encounter a new keyword
            if(update==='keywords'){
                offer.keywords = []
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
            }else{
            offer[update] = req.body[update]
            }
        })
        
        await offer.save()
        res.send(offer)
    }

    catch(e){
        res.status(400).send(e)
    }
})

//API to delete an offer
router.delete('/offer/:id', auth, async (req,res)=>{

    try {
        const offer = await Offer.findOneAndDelete({_id : req.params.id})
        
        if(!offer){
            return res.status(404).send()
        }
        res.send(offer)
    }
    catch(e){
        res.status(400).send(e)
    }
})


 //API to send a demand for collaboration
 router.post('/offer/sendcollabdemand/:id',auth,async (req,res)=>{
    try {
        const offer = await Offer.findById(req.params.id)
        if(!offer){
            return res.status(404).send()
        }
        const isInCollaboratorsDemand = offer.pendingDemands.find((demand)=>String(demand.demand)===String(req.user._id))
        const isAlreadyCollaborator = offer.collaborators.find((collaborator)=>String(collaborator.collaborator) ===String(req.user._id))
        
        if(isAlreadyCollaborator===undefined && String(offer.owner) !==String(req.user._id)  && isInCollaboratorsDemand===undefined){
            
            offer.pendingDemands.push({demand: req.user._id})
            await offer.save()
        }
        }catch(e){
        res.status(400).send()
    }
})
 //API to accept a collaborator's demand
 router.post('/offer/acceptcollab/id',auth,async (req,res)=>{
     try{
        const offer = await Offer.findById(req.params.id)
        if(!offer){
            return res.status(404).send()
        }
         const isInCollaboratorsDemand = offer.pendingDemands.find((demand)=>String(demand.demand)===String(req.body._id))
         const isAlreadyCollaborator = offer.collaborators.find((collaborator)=>String(collaborator.collaborator) ===String(req.body._id))
         const collaboratorExists = !!(await User.findOne({_id:req.body._id}))
         
         //We check if this user exists, is not already a collaborator and if it's not the publisher of the offer himself
         if(isAlreadyCollaborator===undefined && String(req.body._id) !==String(offer.owner) && collaboratorExists && isInCollaboratorsDemand!==undefined){
            offer.collaborators.push({collaborator : req.body._id})
            //we delete the collaborator's demand from the db
            offer.pendingDemands = offer.pendingDemands.filter((demand)=>String(demand.demand) !==String(req.body._id))  
            await offer.save()
            res.send()}
         else {
             res.status(400).send('Cannot add this collaborator')
         }
     }catch(e){
         res.status(400).send(e)
     }
 })
 
module.exports = router