const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

const auth = require('../middleware/auth')

const User = require('../models/user')
const Conversation = require('../models/conversation')


const router = new express.Router()

//Route pour récuperer les informations propres à une conversation
router.get('/conversation/:id',auth,async (req,res)=>{
    try{
        const conversation =await Conversation.findById(req.params.id)
        if(!conversation){
            return res.status(404).send()
        }
        if(!conversation.members.find((member)=>String(member.member)===String(req.user._id))){
            return res.status(400).send({error:'User is not a member of this conversation'})
        }
        const formattedMembers = []
        for (member of conversation.members){
            const {_id,firstName,lastName} = await User.findById(member.member)
            if(!_id){
                return res.status(404).send()
            }
            formattedMembers.push({member:_id,firstName,lastName})}
        res.send({...conversation._doc,members:formattedMembers})
    }catch(e){
        res.status(400).send(e)
    }
})

//Route pour changer les informations générales d'une conversation
//Une vérification est effectuée pour déterminer quels éléments sont modifiables
//Les updates sont directement fournies dans le body
router.patch('/conversation/:id',auth,async(req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','name']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if (!isValidOperation){
        return res.status(400).send({error : 'Champs modifés invalides'})
    }
    
    try{
        const conversation = await Conversation.findById(req.params.id)
        if(!conversation){
            return res.status(404).send()
        }
        if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))){
            return res.status(400).send({error:"Vous n'avez pas l'authorization requise"})
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

//Route pour créer une conversation
//Il est seulement nécessaire d'avoir un email vérifié
router.post('/conversation',auth,async(req,res)=>{
    const conversation = new Conversation({
        ...req.body,
        admins : [{admin : req.user._id}],
        hasImage: false
    })
    if(!req.user.validatedEmail){
        return res.status(400).send({error:'User must have a verified email to do this'})
    }
    try {
        conversation.members.push({member : req.user._id})
        await conversation.save()
        const formattedMembers = []
        for (member of conversation.members){
            const {_id,firstName,lastName} = await User.findById(member.member)
            if(!_id){
                return res.status(404).send()
            }
            formattedMembers.push({member:_id,firstName,lastName})}
        res.status(201).send({...conversation._doc,members:formattedMembers})
    }catch(e){
        res.status(400).send(e)
    }
})

//Route pour supprimer une conversation
//Le client doit être un admin de la conversation
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

//Route pour promouvoir en admin un membre de la conversation
//Format du body : {_id:member.id,newStatus:'admin'}
router.post('/conversation/:id/admin',auth,async(req,res)=>{
    try{
        const conversation = await Conversation.findById(req.params.id)
        const user = await User.findById(req.body._id)
        if(!user || !conversation){
            return res.status(404).send()
        }
        if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))){
            return res.status(400).send({error:"Vous n'avez pas l'authorization requise"})
        }

        if(req.body.newStatus==='admin'){
            if(!!conversation.admins.find((admin)=>String(admin.admin)===String(req.body._id))){
                return res.status(400).send({error:"L'utilisateur est déjà administrateur"})
            }else if(!conversation.members.find((member)=>String(member.member)===String(req.body._id))){
                return res.status(400).send({error:"L'utilisateur n'est pas membre de la conversation"})
            }
            conversation.admins.push({admin:req.body._id})
            

        }else{
            return res.status(404).send()
        }
        await conversation.save()
        //Les membres de la conversation sont formatés pour renvoyer les informations requises par le client
        const formattedMembers = []
        for (member of conversation.members){
            const {_id,firstName,lastName} = await User.findById(member.member)
            if(!_id){
                return res.status(404).send()
            }
            formattedMembers.push({member:_id,firstName,lastName})
        }
        res.send({...conversation._doc,members:formattedMembers})
    }catch(e){
        res.status(400).send(e)
    }
})
//Route pour ajouter ou supprimer un nouveau membre
//Format du body : {action:'add'/'remove'}
router.post('/conversation/:id/member',auth, async(req,res)=>{
    try{
        const conversation = await Conversation.findById(req.params.id)
        const user = await User.findById(req.body._id)
        if(!user || !conversation){
            return res.status(404).send()
        }
        if(!conversation.admins.find((admin)=>String(admin.admin)===String(req.user._id))){
            return res.status(400).send({error:"Vous n'avez pas l'authorization requise"})
        }
        if(String(req.user._id)===String(req.body._id)){
            return res.status(400).send({error:"Vous ne pouvez pas effectuer cette action sur vous même"})
        }

        if(req.body.action==='add'){
            if(!!conversation.members.find((member)=>String(member.member)===String(req.body._id))){
                return res.status(400).send({error:"L'utilisateur est déjà membre de la conversation"})
            }
            conversation.members.push({member:req.body._id})
            

        }else if (req.body.action==='remove'){
            if(!conversation.members.find((member)=>String(member.member)===String(req.body._id))){
                return res.status(400).send({error:"L'utilisateur n'est pas membre de la conversation"})
            }
            if(conversation.members.length===2){
                await Conversation.findByIdAndDelete(req.params.id)
                return res.send({})
            }
            conversation.members = conversation.members.filter((member)=>String(member.member)!==String(req.body._id))
              
        }else{
            return res.status(404).send()
        }
        await conversation.save()
        //On formate la conversation pour la renvoyer au client
        const formattedMembers = []
            for (member of conversation.members){
                const {_id,firstName,lastName} = await User.findById(member.member)
                if(!_id){
                    return res.status(404).send()
                }
                formattedMembers.push({member:_id,firstName,lastName})}
            res.send({...conversation._doc,members:formattedMembers})

    }catch(e){
        res.status(400).send(e)
    }
})
//Route pour qu'un utilisateur récupère toutes ses conversations
router.get('/conversations/me',auth,async(req,res)=>{
    try{
        
        await req.user.populate({
            path : 'conversations',
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort:{createdAt: -1}
            }
        }).execPopulate()
        const formattedConversations = []
        for (conversation of req.user.conversations){
            const formattedMembers = []
            for (member of conversation.members){
                const {_id,firstName,lastName} = await User.findById(member.member)
                if(!_id){
                    return res.status(404).send()
                }
                formattedMembers.push({member:_id,firstName,lastName})
            }
            formattedConversations.push({...conversation._doc,members : formattedMembers})
        }

        res.send(formattedConversations)
    }catch(e){
        
        res.status(400).send(e)
    }
})
//Gestion de l'upload d'image
const upload =multer({
    limits:{
        fileSize:5000000,
        
    },
    fileFilter(req,file,callback){
        if (!file.originalname.match(/\.(png|jpg|jpeg|gif|PNG|JPG|GIF)$/)){
            return callback(new Error('Veuillez choisir une photo'))
        }
        
        callback(undefined,true)

    }
})

//Ajouter une image à une conversation
router.post('/conversation/:id/image',auth,upload.single('image'),async (req,res)=>{
    
    const buffer = await sharp(req.file.buffer).resize({width : 250,height : 250}).png().toBuffer() //client side can resize the image instead of doing it when upload on server side
    const conversation = await Conversation.findById(req.params.id)
    if(!conversation){
        return res.status(404).send()
    }
    
    conversation.image = buffer
    conversation.hasImage = true
    await conversation.save()
    res.send(buffer)
},(error,req,res,next)=>{
    
    res.status(400).send({error: error.message})
})
//Recuperer la photo de la conversation
router.get('/conversation/:id/image',async (req,res)=>{
    try{
        
        const conversation = await Conversation.findById(req.params.id)
        
        if(!conversation || !conversation.image){
            
            return res.status(404).send()
        }
        res.set('Content-Type','image/jpg')
        
        res.send(conversation.image)


    }catch(e){
        res.status(404).send()
    }
})

module.exports = router