const mongoose = require('mongoose')
const express = require('express')
const Offer = require('../models/offer')
const User = require('../models/user')
const auth = require('../middleware/auth')
const CollaborationDemand = require('../models/collaborationDemand')
const router = new express.Router()
router.get('/offer/:id/demands',auth,async (req,res)=>{
    try{
        const offer = await Offer.findById(req.params.id)
        if(!offer){
            return res.status(404).send()
        }
        await offer.populate({
            path : 'collaborationDemands'
        }).execPopulate()
        res.send(offer.collaborationDemands)
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/offer/:id/demand',auth,async (req,res)=>{
    //try {
    const offer = await Offer.findById(req.params.id)
    
        if(!offer){
            return res.status(404).send()
        }
    const inCollaborators = offer.collaborators.find((collaborator)=>String(collaborator.collaborator) ===String(req.user._id))
    const existingDemand = await CollaborationDemand.find({offer:req.params.id,from:req.user._id})
    
    if(!!existingDemand && existingDemand.length !==0){
        return res.status(400).send('A collaboration request has already been sent')
    }
    if(!!inCollaborators){
        return res.status(400).send('This member is already collaborating')
    }
    const demand = new CollaborationDemand({
        message : req.body.message,
        offer: req.params.id,
        from : req.user._id
    })
    await demand.save()
    res.status(201).send(demand)
    
})

router.delete('/offer/:id/demand',auth,async(req,res)=>{
    try{
        const demand = await CollaborationDemand.findOneAndDelete({from:req.body._id,offer:req.params.id})
        if(!demand){
            return res.status(404).send()
        }
        if(req.body.status ==='accepted'){
            const offer = await Offer.findById(req.params.id)
            if (!offer){
                return res.status(404).send()
            }
            offer.collaborators.push({collaborator:req.body._id})
            await offer.save()
            res.send(demand)
        }
    }catch(e){
        res.status(400).send(e)
    }
})


module.exports = router