const express = require('express')
const auth = require('../middleware/auth')
const Offer = require('../models/offer')
const User = require('../models/user')
const OfferComment = require('../models/offerComment')
const router = new express.Router()

// the :id always refers to the offer's id
router.post('/offer/:id/comment',auth, async(req, res) => {
    
    try {
    const offer = await Offer.findById(req.params.id)
    if(!offer){
        return res.status(404).send()
    }
    if(!req.user.validatedEmail){
        return res.status(400).send({error:'User must have a verified email to do this'})
    }
    const comment = new OfferComment({
        ...req.body,
        publisher : req.user._id,
        publication : req.params.id
    })
    
        if(offer.scope==='group'){
            let isMember= false
            for(group of offer.groups){
                const member = await GroupMembership.findOne({group:group.group._id,user:req.user._id})
                if(!!member){
                    isMember = true
                }
            }
                if(!isMember){
                    return res.status(400).send({error:'You are not a member of the groups in which the offer is published'})
            }
        
    }
        await comment.save()
        
        
        res.status(201).send({...comment._doc,publisherId:req.user._id,publisherName:req.user.firstName+' '+req.user.lastName})
    }
    catch(e) {
        
        res.status(400).send(e)
    }
})

router.get('/offer/:id/comments',auth,async (req,res)=>{
    
   
    try {
        const offer = await Offer.findById(req.params.id)
        
        if(!offer){
            return res.status(404).send()
        }
        if(offer.scope==='group'){
            let isMember= false
            for(group of offer.groups){
                const member = await GroupMembership.findOne({group:group.group._id,user:req.user._id})
                if(!!member){
                    isMember = true
                }
            }
                if(!isMember){
                    return res.status(400).send({error:'You are not a member of the groups in which the offer is published'})
            }
        
    }

        await offer.populate({
            path : 'offerComments',
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort:{createdAt: -1}
            }
        }).execPopulate()
        const formattedComments = []
        for (const comment of offer.offerComments){
            const publisher = await User.findById(comment.publisher)
            if(!publisher){
                return res.status(404).send()
            }
            formattedComments.push({...comment._doc,publisherId:publisher._id,publisherName:publisher.firstName + ' '+publisher.lastName})
        }
        
        res.send(formattedComments)
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
        const offerComment = await OfferComment.findOne({_id : req.params.id, publication : req.params.offer_id,publisher:req.user._id})
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