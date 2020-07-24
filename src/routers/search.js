const express = require('express')
const auth = require('../middleware/auth')
const Offer = require('../models/offer')
const User = require('../models/user')
const Group = require('../models/group')
const CollaborationDemand = require('../models/collaborationDemand')
const GroupMembership = require('../models/groupMembership')
const router = new express.Router() 

router.get('/search/:searchText',auth,async (req,res)=>{
    try{
        const searchResults = {users:[],offers:[],groups:[]}
        const offers = await Offer.find()
        const groups = (await Group.find()).map((group)=>group.toJSON())
        const users = (await User.find()).map((user)=>user.toJSON())
        searchResults.offers = offers.filter((offer)=>offer.title.toLowerCase().includes(req.params.searchText.toLowerCase()))
        const formattedOffers = []
        for(offer of searchResults.offers){
            const collaborationDemand = await CollaborationDemand.findOne({from:req.user._id,offer:offer._id})
            if(offer.scope==='group'){
                let isMember= false
                for(group of offer.groups){
                    const member = await GroupMembership.findOne({group:group.group,user:req.user._id})
                    if(!!member){
                        isMember = true
                    }
                }
                    if(isMember){
                        formattedOffers.push({...offer.toJSON(),hasSentDemand:!!collaborationDemand})
                }
            
        }
            
        }
        
        searchResults.offers = formattedOffers
        searchResults.groups = groups.filter((groups)=>groups.name.toLowerCase().includes(req.params.searchText.toLowerCase()))
        
        searchResults.users = users.filter((user)=>{
            return (String(user._id)!==String(req.user._id)) && ((user.firstName + ' '+user.lastName).toLowerCase().includes(req.params.searchText.toLowerCase()))
            
        })
        console.log(searchResults)
        res.send(searchResults)
    }catch(e){
        res.status(400).send(e)
    }
})

module.exports = router