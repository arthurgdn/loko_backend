const express = require('express')
const auth = require('../middleware/auth')
const Offer = require('../models/offer')
const OfferComment = require('../models/offerComment')
const router = new express.Router()

// the :id always refers to the offer's id
router.post('/offer/:id/comment',auth, async(req, res) => {
    
    const comment = new OfferComment({
        ...req.body,
        publisher : req.user._id,
        publication : req.params.id
    })
    try {
        await comment.save()
        res.status(201).send(comment)
    }
    catch(e) {
        res.status(400).send(e)
    }
})

router.get('/offer/:id/comments',auth,async (req,res)=>{
    
   
    try {
        const offer = await Offer.findById(req.params.id)
        console.log(offer)
        if(!offer){
            return res.status(404).send()
        }
        await offer.populate({
            path : 'offerComments'
        }).execPopulate()

        
        res.send(offer.offerComments)
    }
    catch(e){
        res.status(500).send(e)
    }
    
})





router.patch('/offer/:offer_id/comments/:id',auth, async (req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['content']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    
    try{
        const offerComment = await OfferComment.findOne({_id : req.params.id, publication : req.params.offer_id})
        if(!offerComment){
            return res.status(404).send()
        }
        updates.forEach((update)=>{
            offerComment[update] = req.body[update]
        })
        
        await offerComment.save()
        res.send(offerComment)
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.delete('/offer/:offer_id/comments/:id', auth, async (req,res)=>{

    try {
        const offerComment = await OfferComment.findOneAndDelete({_id : req.params.id,publication : req.params.offer_id,publisher : req.user._id})
        if(!offerComment){
            return res.status(404).send()
        }
        res.send(offerComment)
    }
    catch(e){
        res.status(400).send(e)
    }
})

module.exports = router