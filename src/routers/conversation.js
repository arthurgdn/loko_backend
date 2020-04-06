const express = require('express')
const Offer = require('../models/offer')
const User = require('../models/user')
const Conversation = require('../models/conversation')
const auth = require('../middleware/auth')

const router = new express.Router()

//API to fetch conversation info : members, description,admins, image...
router.get('/conversation/:id',auth,async (req,res)=>{
    try{
        const conversation =await Conversation.findById(req.params.id)
        if(!conversation){
            return res.status(404).send()
        }
        //We check if the user is a member of this conversation
        if(conversation.members.find((member)=>String(member.member)===String(req.user._id))===null){
            return res.status(400).send('User is not a member of this conversation')
        }
        res.send(conversation)
    }catch(e){
        res.status(400).send(e)
    }
})
//API to change conversation info 
router.patch('/conversation/:id',auth,async(req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','name','image']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    
    try{
        const conversation = await Conversation.findById(req.params.id)
        
        
        
        //const task = await Task.findByIdAndUpdate(_id,req.body,{new : true,runValidators:true})
        if(!conversation){
            return res.status(404).send()
        }
        if(conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))===null){
            return res.status(400).send('User has to be admin to do this')
        }
        updates.forEach((update)=>{
            conversation[update] = req.body[update]
        })
        await conversation.save()
        
        res.send(conversation)
    }
    catch(e){
        res.status(400).send(e)
    }
})
//API to create a conversation
router.post('conversation',auth,async(req,res)=>{
    const conversation = new Conversation({
        ...req.body,
        admins : [{admin : req.user._id}],
    })
    try {
        await conversation.save()
        res.status(201).send(conversation)
    }catch(e){
        res.status(400).send(e)
    }
})
//API to delete a conversation
//API to change the status of a member from admin/to admin
//API to add/remove a member

//API for a user to fetch all his conversations
router.get('/conversations/me',auth,async(req,res)=>{
    try{
        await req.user.populate({
            path : 'conversations'
        }).execPopulate()
        res.send(req.user.conversations)
    }catch(e){
        res.status(400).send(e)
    }
})
module.exports = router