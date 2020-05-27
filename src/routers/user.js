const express = require('express')
const multer = require('multer')
const path = require('path')
const sharp = require('sharp')
const bcrypt = require('bcryptjs')

const auth = require('../middleware/auth')
const {sendVerificationEmail,sendGoodbyeEmail,sendPasswordResetEmail} = require('../emails/account')
const Profile = require('../models/profile')
const User = require('../models/user')
const Group = require('../models/group')
const GroupMembership = require('../models/groupMembership')
const findCollaboratorByName = require('../tools/users/findCollaboratorByName')


const router = new express.Router()

router.post('/sendVerification',auth,async(req,res)=>{
    try{
    if(req.user.validatedEmail===false){
        const verifToken = await req.user.generateVerificationToken()
        sendVerificationEmail(req.user.email,req.user.firstName,verifToken)
        await req.user.save()
        res.send()
    }}catch(e){
        res.status(400).send(e)
    }
    
})

//API to signup on the platform
router.post('/users', async (req, res) => {
    
    const user = new User({...req.body,validatedEmail : false})
    const profile = new Profile({
        user : user._id
    }) 
    try{
        const anonymousPath = path.join(__dirname,'../../avatars/anonymous.png')
    
        const buffer =await  sharp(anonymousPath).toBuffer()
        user.profilePicture = buffer
        
        const token = await user.generateAuthToken()
        const verifToken = await user.generateVerificationToken()
        await user.save()
        await profile.save()
        
        sendVerificationEmail(user.email,user.firstName,verifToken)
        res.status(201).send({user:user.toJSON(),token})
    }catch(e){
        
        res.status(400).send(e)
    }
    
})
//returns the user and some more information (his keywords and his groups)
router.get('/users/me',auth,async (req,res)=>{
    try{
        await req.user.populate({path:'groupsJoined'}).execPopulate()
        const profile = await Profile.findOne({user:req.user._id})
        if(!profile){
            return res.status(404).send()
        }
        const userGroups = []
        for(group of req.user.groupsJoined){
            
            const foundGroup = await Group.findById(group.group)
            
            if(!foundGroup){
                return res.status(404).send()
            }
            const membership = await GroupMembership.findOne({group:group.group,user:req.user._id})
            if(membership.status==='member' || membership.status==='admin'){
                userGroups.push(foundGroup)
            }
            

        }
        
        res.send({
            ...req.user.toJSON(),
            userGroups,
            userKeywords : profile.keywords
        })
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
    
})

//API to login
router.post('/users/login',async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user:user.toJSON(),token})
    }catch(e){
        
        res.status(400).send(e)
    }
})
//API to change user info
router.patch('/users/me',auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['firstName','lastName','phoneNumber','location','locationText','collaborators']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Invalid updates'})
    }
    try{ 
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })
        await req.user.save()
        
        res.send(req.user.toJSON())
    }
    catch(e){
        res.status(400).send(e)
    }
})


//API to change password
router.patch('/users/me/password',auth,async (req,res)=>{
    try{
        
        //We check for confirmation of the current password 
     const passwordValidate = await bcrypt.compare(req.body.currentPass,req.user.password)
     
    if (passwordValidate===true){
        
        req.user.password = req.body.password
        
        await req.user.save()
        res.send()
    }
    else{
        res.status(400).send({error:"L'ancien mot de passe n'est pas valide"})
    }
 }catch(e){
     
         res.status(400).send(e)
    }
 
 })

 //API to send a demand for collaboration
router.post('/users/sendcollabdemand',auth,async (req,res)=>{
    try {
        const searchedCollaborator = await User.findOne({_id:req.body._id})
        if(!searchedCollaborator){
            return res.status(404).send()
        }
        const isInCollaboratorsDemand = searchedCollaborator.collaborationDemands.find((demand)=>String(demand.demand)===String(req.user._id))
        const isInMyDemand = req.user.collaborationDemands.find((demand)=>String(demand.demand)===String(req.body._id))
        const isAlreadyCollaborator = req.user.collaborators.find((collaborator)=>String(collaborator.collaborator) ===String(req.body._id))
        
        if(isAlreadyCollaborator===undefined && String(req.body._id) !==String(req.user._id)  && isInCollaboratorsDemand===undefined && isInMyDemand===undefined){
           
            searchedCollaborator.collaborationDemands.push({demand: req.user._id})
            await searchedCollaborator.save()
            res.send(searchedCollaborator)
        }
        else{
            res.status(400).send()
        }
        }catch(e){
        res.status(400).send(e)
    }
})

//Récupérer les demandes de collaboration reçues
router.get('/users/collabdemands',auth,async(req,res)=>{
    try{
        const formattedCollaborationDemands = []
        for (demand of req.user.collaborationDemands){
            const {_id,firstName,lastName} = await User.findById(demand.demand)
            if(!_id){
                return res.status(404).send
            }
            formattedCollaborationDemands.push({demand:_id,firstName,lastName})
        }
        res.send(formattedCollaborationDemands)

    }catch(e){
        res.status(400).send(e)
    }
})

//Récupérer les collaborateurs actuels
router.get('/users/collab',auth,async(req,res)=>{
    try{
        const formattedCollaborators = []
        for (collaborator of req.user.collaborators){
            const {_id,firstName,lastName} = await User.findById(collaborator.collaborator)
            if(!_id){
                return res.status(404).send
            }
            
            formattedCollaborators.push({collaborator:_id,firstName,lastName})
        }
        res.send(formattedCollaborators)

    }catch(e){
        res.status(400).send(e)
    }
})
 //API to accept or reject a collaborator's demand
 router.post('/users/sortcollab/',auth,async (req,res)=>{
     try{
         
         const isInCollaboratorsDemand = req.user.collaborationDemands.find((demand)=>String(demand.demand)===String(req.body._id))
         const isAlreadyCollaborator = req.user.collaborators.find((collaborator)=>String(collaborator.collaborator) ===String(req.body._id))
         const collaboratorExists = !!(await User.findOne({_id:req.body._id}))
         
         //We check if this user exists, is not already a collaborator and if it's not the user himself
         if(isAlreadyCollaborator===undefined && String(req.body._id) !==String(req.user._id) && collaboratorExists && isInCollaboratorsDemand!==undefined ){
            if(req.body.status==='accept'){
                req.user.collaborators.push({collaborator : req.body._id})
                const collaborator = await User.findById(req.body._id)
                if(!collaborator){
                    res.status(404).send()
                }

                collaborator.collaborators.push({collaborator : req.user._id})
                await collaborator.save()
                req.user.collaborationDemands = req.user.collaborationDemands.filter((demand)=>String(demand.demand) !==String(req.body._id))  
                await req.user.save()
            
                res.send({collaborator: collaborator._id,firstName: collaborator.firstName,lastName:collaborator.lastName})
            }
            else{
                req.user.collaborationDemands = req.user.collaborationDemands.filter((demand)=>String(demand.demand) !==String(req.body._id))  
                await req.user.save()
                res.send()
            }}
            
            
            
         else {
             
             res.status(400).send('Cannot add this collaborator')
         }
     }catch(e){
         
         res.status(400).send(e)
     }
 })
 
 //API to fetch collaborator by name
 router.get('/users/collaborators/name',auth,async(req,res)=>{
    const matchingCollaborators = await findCollaboratorByName(req.body.searchString,req.user)
    
    res.send(matchingCollaborators) 
 })

 //API to add phone number

 router.post('/users/phone',auth,async(req,res)=>{
     const phoneNumber = req.body.phoneNumber
     const existingUser = await User.findOne({phoneNumber})
     
     if(existingUser===null){
         req.user.phoneNumber = phoneNumber
         await req.user.save()
         res.send()
     }else{
         res.status(400).send('This phone number is already used by another user')
     }
 })

 //API to deal with avatar

 const upload =multer({
    limits:{
        fileSize:5000000,
        
    },
    fileFilter(req,file,callback){
        if (!file.originalname.match(/\.(png|jpg|jpeg|PNG|JPG|gif|GIF)$/)){
            return callback(new Error('Please upload an image'))
        }
        
        callback(undefined,true)

    }
})

router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
    
    const buffer = await sharp(req.file.buffer).resize({width : 250,height : 250}).png().toBuffer() //client side can resize the image instead of doing it when upload on server side
    req.user.profilePicture = buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    
    res.status(400).send({error: error.message})
})
//Recuperer la photo d'un utilisateur
router.get('/users/:id/avatar',async (req,res)=>{
    try{
        
        const user = await User.findById(req.params.id)
        
        if(!user || !user.profilePicture){
            
            return res.status(404).send()
        }
        res.set('Content-Type','image/jpg')
        
        res.send(user.profilePicture)


    }catch(e){
        res.status(404).send()
    }
})
//API pour réinitialiser le mot de passe
router.post('/user/reset',async(req,res)=>{
    try{
        
        const user = await User.findOne({email:req.body.email})
        if(!user){
            return res.status(404).send()
        }
        const resetToken = await user.generateResetToken()
        sendPasswordResetEmail(user.email,user.firstName,resetToken)
        res.send()
    }catch(e){
        res.status(400).send(e)
    }
})

//API to logout

router.post('/users/logout',auth,async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>token.token !== req.token)
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

//API to logout of all sessions 
router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

//API to delete account
router.post('/users/me/delete',auth, async (req,res)=>{
     
    try {
        
        const passwordValidate = await bcrypt.compare(req.body.password,req.user.password)
        
        if(!passwordValidate){
            return res.status(400).send({error:'Unable to delete account '})
        }
        const email = req.user.email
        const name = req.user.firstName
        await req.user.remove()
        sendGoodbyeEmail(email,name)
        res.send(req.user)
    }
    catch(e){
        
        res.status(400).send(e)
    }
})

module.exports = router


