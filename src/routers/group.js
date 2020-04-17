const express = require('express')
const auth = require('../middleware/auth')
const Group = require('../models/group')
const GroupMembership = require('../models/groupMembership')
const Keyword = require('../models/keyword')


const router = new express.Router()
//API to create a new group the request should have the following body:
// {name,description,securityStatus = open/onRequest/private,keywords,groupType,location}
router.post('/group',auth,async (req,res)=>{
    const group = new Group(req.body)
    const admin = new GroupMembership({
        user : req.user._id,
        group : group._id,
        status : 'admin'
    })
    group.keywords = []
    try{
        //Deal with keywords
    if(req.body.keywords.length>0){
        for(keyword of req.body.keywords){
            const existingKeyword = await Keyword.findOne({name:keyword})
            if(!existingKeyword){
                const newKeyword = new Keyword({name:keyword})
                group.keywords.push({keyword:newKeyword._id})
                await newKeyword.save()
            }else{
                 
                group.keywords.push({keyword:existingKeyword._id})
            }
        }
    }
    await admin.save()
    await group.save()
    res.status(201).send(group)
    }catch(e){
        res.status(400).send(e)
    }
})

//API to get a group's info (you do not have to be a member for this)
router.get('/group/:id',auth,async(req,res)=>{
    try{
        const group = await Group.findById(req.params.id)
        if(!group){
            return res.status(404).send()
        }
        
        res.send(group)
    }catch(e){
        res.status(500).send(e)
    }
})
router.patch('/group/:id',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','description','location','keywords','groupType','securityStatus']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    } 
    try {
        const group = await Group.findOne({_id : req.params.id})
        if(!group){
            return res.status(404).send()
        }
        const admin = await GroupMembership.findOne({group: req.params.id,user : req.user._id,status:'admin'})
        if(!admin){
            return res.status(400).send({error: 'User has to be admin to change this'})
        }
        for(update of updates){
            //We do the same thing when we encounter a new keyword
            if(update==='keywords'){
                group.keywords = []
                for(keyword of req.body.keywords){
                    const existingKeyword = await Keyword.findOne({name:keyword})
                    if(!existingKeyword){
                        const newKeyword = new Keyword({name:keyword})
                        group.keywords.push({keyword:newKeyword._id})
                        
                        await newKeyword.save()
                        
                    }else{
                         
                        group.keywords.push({keyword:existingKeyword._id})
                        
                    }
                }
            }else{
            group[update] = req.body[update]
            }
        }
        
        await group.save()
        
        res.send(group)
    }

    catch(e){
        res.status(400).send(e)
    }
})

router.delete('/group/:id',auth,async(req,res)=>{
    try{
        const admin = await GroupMembership.findOne({group : req.params.id,user: req.user._id,status:'admin'})
        if (!admin){
            return res.status(400).send({error: 'User has to be admin to do this'})
        }
        const group = await Group.findByIdAndDelete(req.params.id)
        if(!group){
            return res.status(404).send()
        }
        res.send(group)
    }catch(e){
        res.status(400).send(e)
    }
})

module.exports= router