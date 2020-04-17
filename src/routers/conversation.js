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
        if(!conversation.members.find((member)=>String(member.member)===String(req.user._id))){
            return res.status(400).send({error:'User is not a member of this conversation'})
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
        if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))){
            return res.status(400).send({error:'User has to be admin to do this'})
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
router.post('/conversation',auth,async(req,res)=>{
    const conversation = new Conversation({
        ...req.body,
        admins : [{admin : req.user._id}],
    })
    try {
        conversation.members.push({member : req.user._id})
        await conversation.save()
        res.status(201).send(conversation)
    }catch(e){
        res.status(400).send(e)
    }
})
//API to delete a conversation
router.delete('/conversation/:id',auth,async(req,res)=>{
    try{
        const conversation = await Conversation.findById(req.params.id)
        if(!conversation){
            return res.status(404).send()
        }
        if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))){
            return res.status(400).send({error:'User has to be admin to do this'})
        }
        const deletedConversation = await Conversation.findByIdAndDelete(req.params.id)
        
        res.send(deletedConversation)
    }catch(e){
        res.status(400).send(e)
    }
})
//API to change the status of a member from admin/to admin
//form of req.body : {_id:member.id,newStatus:'admin'/'unadmin'}
router.post('/conversation/:id/admin',auth,async(req,res)=>{
    try{
        const conversation = await Conversation.findById(req.params.id)
        const user = await User.findById(req.body._id)
        if(!user || !conversation){
            return res.status(404).send()
        }
        if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))){
            return res.status(400).send({error:'User has to be admin to do this'})
        }

        if(req.body.newStatus==='admin'){
            if(!!conversation.admins.find((admin)=>String(admin.admin)===String(req.body._id))){
                return res.status(400).send({error:'User is already admin'})
            }else if(!conversation.members.find((member)=>String(member.member)===String(req.body._id))){
                return res.status(400).send({error:'User is not a member of this conversation'})
            }
            conversation.admins.push({admin:req.body._id})
            await conversation.save()
            res.send(conversation)

        }else if (req.body.newStatus==='unadmin'){
            if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.body._id))){
                return res.status(400).send({error:'User is not an admin'})
            }else if(!conversation.members.find((member)=>String(member.member)===String(req.body._id))){
                return res.status(400).send({error:'User is not a member of this conversation'})
            }

            conversation.admins = conversation.admins.filter((admin)=>String(admin.admin)!==String(req.body._id))
            await conversation.save()
            res.send(conversation)
        }else{
            return res.status(404).send()
        }
    }catch(e){
        res.status(400).send(e)
    }
})
//API to add/remove a member
router.post('/conversation/:id/member',auth, async(req,res)=>{
    try{
        const conversation = await Conversation.findById(req.params.id)
        const user = await User.findById(req.body._id)
        if(!user || !conversation){
            return res.status(404).send()
        }
        if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))){
            return res.status(400).send({error:'User has to be admin to do this'})
        }
        if(String(req.user._id)===String(req.body._id)){
            return res.status(400).send({error:'You cannot edit your own status'})
        }

        if(req.body.action==='add'){
            if(!!conversation.members.find((member)=>String(member.member)===String(req.body._id))){
                return res.status(400).send({error:'User is already a member'})
            }
            conversation.members.push({member:req.body._id})
            await conversation.save()
            res.send(conversation)

        }else if (req.body.action==='remove'){
            if(!conversation.members.find((member)=>String(member.member)===String(req.body._id))){
                return res.status(400).send({error:'User is not a member'})
            }
            if(conversation.members.length===2){
                res.send(await Conversation.findByIdAndDelete(req.params.id))
            }
            conversation.members = conversation.members.filter((members)=>String(member.member)!==String(req.body._id))
            await conversation.save()
            res.send(conversation)
        }else{
            return res.status(404).send()
        }

    }catch(e){
        res.status(400).send(e)
    }
})
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