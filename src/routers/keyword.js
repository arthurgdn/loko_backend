const express = require('express')
const auth = require('../middleware/auth')
const Keyword = require('../models/keyword')

const {fusion_createdAtDesc} = require('../tools/utils/fusion.js')

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
        res.send(fusion_createdAtDesc(keyword.associatedOffers,keyword.associatedGroups))
    }catch(e){
        res.status(400).send(e)
    }
})
router.get('/keywords',auth,async(req,res)=>{
    
    try{const keywords = await Keyword.find()
    if(!keywords){
        return res.send([])

    }
    
    res.send(keywords)
}catch(e){
        res.status(400).send(e)
    }

})
module.exports = router