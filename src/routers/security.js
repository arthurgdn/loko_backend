const express = require('express')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

const router = new express.Router()
router.get('/verify/:token',async(req,res)=>{
    try{
        const decoded = jwt.verify(req.params.token,process.env.JWT_SECRET)
        const user = await User.findOne({_id:decoded._id,'verifTokens.token':req.params.token})
        if(!user){
            return res.status(404).send()
        }
        if(user.validatedEmail){
            return res.status(400).send({error:'Email is already validated'})
        }
        user.validatedEmail = true
        
        user.verifTokens = user.verifTokens.filter((verifToken)=>verifToken.token!==req.params.token)
        await user.save()
        //We will deal with redirection on the frontend
        res.send()
    }catch(e){
        res.status(400).send(e)
    }
    
})

router.patch('/reset/:token',async(req,res)=>{
    try{
        const decoded = jwt.verify(req.params.token,process.env.JWT_SECRET)
        const user = await User.findOne({_id:decoded._id,'resetTokens.token':req.params.token})
        if(!user){
            return res.status(404).send()
        }
        
        user.password = req.body.password
        
        user.resetTokens = user.resetTokens.filter((resetToken)=>resetToken.token!==req.params.token)
        await user.save()
        //We will deal with redirection on the frontend
        res.send()
    }catch(e){
        res.status(400).send(e)
    }
    
})
module.exports = router