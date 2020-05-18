const express = require('express')
const auth = require('../middleware/auth')
const Offer = require('../models/offer')
const User = require('../models/user')
const Group = require('../models/group')
const router = new express.Router() 

router.get('/search/:searchText',auth,async (req,res)=>{
    try{
        const searchResults = {users:[],offers:[],groups:[]}
        const offers = await Offer.find()
        const groups = await Group.find()
        const users = await User.find()
        searchResults.offers = offers.filter((offer)=>offer.title.toLowerCase().includes(req.params.searchText.toLowerCase()))
        searchResults.groups = groups.filter((groups)=>groups.name.toLowerCase().includes(req.params.searchText.toLowerCase()))
        searchResults.users = users.filter((user)=>{
            return (String(user._id)!==String(req.user._id)) && ((user.firstName + ' '+user.lastName).toLowerCase().includes(req.params.searchText.toLowerCase()))
            
        })
        res.send(searchResults)
    }catch(e){
        res.status(400).send(e)
    }
})

module.exports = router