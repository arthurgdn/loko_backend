const express = require('express')
const auth = require('../middleware/auth')
const Keyword = require('../models/keyword')
const User = require('../models/user')

const {fusion_createdAtDesc} = require('../tools/utils/fusion.js')
const Profile = require('../models/profile')

const router = new express.Router()
//API to get all groups and offers attached to the specific keyword
router.get('/keyword/:id',auth,async(req,res)=>{
    try{
        const keyword = await Keyword.findById(req.params.id)
        if(!keyword){
            return res.status(404).send()
        }
        await keyword.populate({path:'associatedOffers',options : {
            limit : parseInt(req.query.limit),
            skip : parseInt(req.query.skip),
            sort:{createdAt: -1}
        }}).execPopulate()

        await keyword.populate({path:'associatedGroups',options : {
            limit : parseInt(req.query.limit),
            skip : parseInt(req.query.skip),
            sort:{createdAt: -1}
        }}).execPopulate()
        
        const fusionnedItems = fusion_createdAtDesc(keyword.associatedOffers,keyword.associatedGroups)
        const finalItems = []
        for(item of fusionnedItems){
            
            const keywords = []
            for(itemKeyword of item.keywords){
            
                const newKeyword = await Keyword.findById(itemKeyword.keyword)
        
                if(!newKeyword){
                    return res.status(404).send()
                    }
                keywords.push(newKeyword)
                }
           
            if(item.constructor.modelName ==='Offer'){
                const offerPublisher = await User.findById(item.owner)
                finalItems.push({...item.toJSON(),type:'offer',keywords,publisherName : offerPublisher.firstName + ' '+ offerPublisher.lastName, publisherId : offerPublisher._id})                 
            }
            else{
                finalItems.push({...item.toJSON(),keywords,type:'group'})
                                    
            }
            

        }
        
        res.send({feed: finalItems,name:keyword.name})
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})

//Récupérer tout les mots clés
router.get('/keywords',auth,async(req,res)=>{
    
    try{
        const keywords = await Keyword.find()
        if(!keywords){
            return res.send([])

        }
        
        res.send(keywords)
    }catch(e){
        res.status(400).send(e)
    }

})

router.post('/keyword/:id/follow',auth,async (req,res)=>{
    try{
        const keyword = await Keyword.findById(req.params.id)
        if(!keyword){
            return res.status(404).send()
        }
        const profile = await Profile.findOne({user:req.user._id})
        if(!profile){
            return res.status(404).send()
        }
        console.log(profile.keywords,'keywords')
        if (profile.keywords.find((keyword)=>String(keyword._id)===req.params.id)){
            return res.status(400).send("Erreur, vous êtes déjà intéressé par cela")
        }
        profile.keywords.push({keyword:req.params.id})
        await profile.save()
        res.send(profile.keywords[profile.keywords.length -1])
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})
module.exports = router