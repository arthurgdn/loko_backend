const express = require('express')
const auth = require('../middleware/auth')
const GroupMembership = require('../models/groupMembership')
const Group = require('../models/group')
const User = require('../models/user')

const router=  new express.Router()

//Get members of a group
router.get('/group/:id/members',auth, async(req,res)=>{
    try{
        const group = await Group.findById(req.params.id)
        if(!group){
            return res.status(404).send()
        }
        const member= await GroupMembership.findOne({user : req.user._id,group: group._id})
        //To view group members, if the group is private or onRequest, you have to be a member of the group
        if(!member && (group.securityStatus ==='onRequest' || group.securityStatus==='private')){
            return res.status(400).send({error : 'You cannot view the members'})
        }
        match = {}
        status = req.query.status
        //We can decide to fetch only certain members
        if(status){
            //You have to be admin to view requested memberships
            if(status==='requested'){
                const admin = await GroupMembership.findOne({group:group._id,user: req.user._id,status: 'admin'})
                if(!admin){
                    return res.status(400).send({error : 'You have to be admin to do this'})
                }
            }
            match.status = status
        }
        //We populate only accepted members and admins of the group
        await group.populate({path:'members',match,options : {
            limit : parseInt(req.query.limit),
            skip : parseInt(req.query.skip)
        }}).execPopulate()
        const formattedMembers = []
        for (groupMember of group.members){
            const user = await User.findById(groupMember.user)
            if(!user){
                return res.status(404).send()
            }
            formattedMembers.push({firstName : user.firstName,lastName : user.lastName,...groupMember._doc})
        }
        res.send(formattedMembers)
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
    
})
//API to join group/ request membership/invite member
router.post('/group/:id/member',auth,async(req,res)=>{
    try{
        const group = await Group.findById(req.params.id)
        
        if(!group){
            return res.status(404).send()
        }
        
        if(group.securityStatus==='onRequest' || group.securityStatus==='open'){
            const member = await GroupMembership.findOne({group:group._id,user:req.user._id})
            if(!!member){
                return res.status(400).send({error:'User is already a member of this group'})
            }
            const status = group.securityStatus ==='onRequest' ? 'requested' : 'member'
            const membership = new GroupMembership({group : group._id,user:req.user._id,status})
            await membership.save()
            res.status(201).send({firstName: req.user.firstName,lastName:req.user.lastName,...membership._doc})
        }
        else if(group.securityStatus==='private'){
            const admin = await GroupMembership.findOne({group:group._id,user: req.user._id,status: 'admin'})
            if(!admin){
                return res.status(400).send({error : 'You have to be admin to do this'})
            }
            const member = await GroupMembership.findOne({group:group._id,user:req.body._id})
            if(!!member){
                return res.status(400).send({error:'User is already a member of this group'})
            } 
            const membership = new GroupMembership({group : group._id,user:req.body._id,status : 'member'})
            await membership.save()
            const user = await User.findById(req.body._id)
            if(!user){
                return res.status(404).send()
            }
            res.status(201).send({firstName: user.firstName,lastName:user.lastName,...membership._doc})

        }
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})
//API to have member become admin or to accept a group membership request
router.patch('/group/:id/member',auth,async(req,res)=>{
    try{
        
        const group = await Group.findById(req.params.id)
        if(!group){
            return res.status(404).send()
        }
        const admin = await GroupMembership.findOne({group:group._id,user:req.user._id,status:'admin'})
        if(!admin){
            return res.status(400).send({error:'You have to be admin to do this'})
        }
        
        const updates = Object.keys(req.body.updates)
        const allowedUpdates = ['status']
        const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
        if (!isValidOperation){
            return res.status(400).send({error : 'Invalid updates'})
        }
        const newStatus = req.body.updates.status
        if(newStatus==='member'){
            const membership = await GroupMembership.findOne({group:group._id,user:req.body._id,status:'requested'})
            if(!membership){
                return res.status(400).send({error:'No requested membership found'})
            }
            membership.status= 'member'
            await membership.save()
            const user = await User.findById(req.body._id)
            if(!user){
                return res.status(404).send()
            }
            res.send({firstName : user.firstName,lastName : user.lastName,...membership._doc})
            
        }
        else if(newStatus==='admin'){
            const membership = await GroupMembership.findOne({group:group._id,user:req.body._id,status:'member'})
            if(!membership){
                return res.status(400).send({error:'No member found'})
            }
            membership.status= 'admin'
            await membership.save()
            const user = await User.findById(req.body._id)
            if(!user){
                return res.status(404).send()
            }
            res.send({firstName : user.firstName,lastName : user.lastName,...membership._doc})
        } 
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})

router.post('/group/:id/member/delete',auth,async(req,res)=>{
    try{
        
        const group = await Group.findById(req.params.id)
        if(!group){
            
            return res.status(404).send()
        }
        //On peut quitter un groupe ou annuler une demande
        if(String(req.body._id)===String(req.user._id)){
            const admins = await GroupMembership.find({group:group._id,status:'admin'})
            //If the user is the last admin then the group is deleted
            if(admins.length===1 && String(admins.user)===String(req.body._id)){
              await Group.findByIdAndDelete(group._id)
              return res.send()
            }
            const deletedMember = await GroupMembership.findOneAndDelete({group:group._id,user:req.body._id})
            return res.send(deletedMember)
        }
        const member = await GroupMembership.find({group:group._id,user:req.body._id})
        if(!member){
            return res.status(400).send({error:'Unable to find the member'})
        }
        const admin = await GroupMembership.findOne({group:group._id,user:req.user._id,status:'admin'})
        if(!admin){
            return res.status(400).send({error:'You have to be admin to do this'})
        }
        const deletedMember = await GroupMembership.findOneAndDelete({group:group._id,user:req.body._id})
        res.send(deletedMember)
        

    }catch(e){
        res.status(400).send(e)
    }
})
module.exports=router