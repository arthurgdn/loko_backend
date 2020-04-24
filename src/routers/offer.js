
const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const Offer = require('../models/offer')
const User = require('../models/user')
const Keyword = require('../models/keyword')
const auth = require('../middleware/auth')
const Group = require('../models/group')
const GroupMembership = require('../models/groupMembership')

const router = new express.Router()

//API to create a new offer
router.post('/offer/create',auth, async (req,res)=>{
    const offer = new Offer({
        ...req.body,
        owner : req.user._id,
        completedStatus : 'created'
    })
    if(!req.user.validatedEmail){
        return res.status(400).send({error:'User must have a verified email to do this'})
    }
    offer.keywords = []
    offer.collaborators.push({collaborator : req.user._id})
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
    if(offer.scope==='general' && !!offer.groups&& offer.groups.length>0){
        return res.status(400).send({error:'Cannot add groups when scope is general'})
    }
    //We check if the user is a member of the groups he publishes in 
    if(offer.scope==='group'){
        for(group of offer.groups){
        const member = await GroupMembership.findOne({group:group.group,user:req.user._id})
        if(!member){
            return res.status(400).send({error:'You are not a member of this group'})
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
        //We check if the user is a member of at least one of the groups
        if(offer.scope==='group'){
            let isMember= false
            for(group of offer.groups){
                const member = await GroupMembership.findOne({group:group.group,user:req.user._id})
                if(!!member){
                    isMember = true
                }
            }
                if(!isMember){
                    return res.status(400).send({error:'You are not a member of the groups in which the offer is published'})
            }
        
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
    const allowedUpdates = ['title','description','location','locationRadius','completedStatus','keywords']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    } 
    try {
        const offer = await Offer.findOne({_id : req.params.id})
        if(!offer){
            return res.status(404).send()
        }
        if(String(offer.owner)!==String(req.user._id)){
            return res.status(400).send({error:'You have to be the publisher of the offer'})
        }
          for(update of updates){
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
        }
        
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
        const offer = await Offer.findbyId(req.params.id)

        
        if(!offer){
            return res.status(404).send()
        }
        if(String(offer.owner)!==String(req.user._id)){
            return res.status(400).send({error:'You have to be the publisher of the offer'})
        }
        const deletedOffer = await Offer.findByIdAndDelete(req.params.id)
        res.send(deletedOffer)
    }
    catch(e){
        res.status(400).send(e)
    }
})
//API for a user to get his created offers
router.get('/offer/me',auth,async(req,res)=>{
    match = {}
    if (req.query.status){
        match.completedStatus = req.query.status
    }
    try {
        
        await req.user.populate({
            path : 'offers',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort:{createdAt: -1}
            }
        }).execPopulate()

        
        res.send(req.user.offers)
    }
    catch(e){
        res.status(500).send(e)
    }
})
//API for a user to get the offers he collaborates on 
router.get('/offer/collaborated/me',auth,async(req,res)=>{
    match = {}
    if (req.query.status){
        match.completedStatus = req.query.status
    }
    try {
        
        await req.user.populate({
            path : 'collaboratedOffers',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort:{createdAt: -1}
            }
        }).execPopulate()

        
        res.send(req.user.collaboratedOffers)
    }
    catch(e){
        res.status(500).send(e)
    }
})
//Get all offers in a group
router.get('/offers/group/:id',auth,async(req,res)=>{
    try{
        const group = await Group.findById(req.params.id)
        if(!group){
            return res.status(404).send()
        }
        const membership = await GroupMembership.findOne({group:group._id,user:req.user._id})
        if(!membership && (group.status ==='onRequest' || group.status==='private')){
            return res.status(400).send({error: 'You do not have access to this'})
        }
        await group.populate({path:'offers',
        options : {
            limit : parseInt(req.query.limit),
            skip : parseInt(req.query.skip),
            sort:{createdAt: -1}
        }
    }).execPopulate()
        res.send(group.offers)

    }catch(e){
        res.status(400).send(e)
    }
})


const upload =multer({
    limits:{
        fileSize:2000000,
        
    },
    fileFilter(req,file,callback){
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)){
            return callback(new Error('Veuillez choisir une photo'))
        }
        
        callback(undefined,true)

    }
})

router.post('/offer/:id/image',auth,upload.single('image'),async (req,res)=>{
    
    const buffer = await sharp(req.file.buffer).resize({width : 500,height : 500}).png().toBuffer() //client side can resize the image instead of doing it when upload on server side
    const offer = await Offer.findById(req.params.id)
    if(!offer){
        return res.status(404).send()
    }
    
    offer.image = buffer
    await offer.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error: error.message})
})
//Recuperer la photo d'une offre
router.get('/offer/:id/image',async (req,res)=>{
    try{
        
        const offer = await Offer.findById(req.params.id)
        
        if(!offer || !offer.image){
            
            return res.status(404).send()
        }
        res.set('Content-Type','image/jpg')
        
        res.send(offer.image)


    }catch(e){
        res.status(404).send()
    }
})
module.exports = router