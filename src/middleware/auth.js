const jwt = require('jsonwebtoken')
const User = require('../models/user')

//Gestion de l'authentification au backend en utilisant les jsonwebtoken

const auth = async (req,res,next)=>{
    try{
        
        //Extraction du token et comparaison avec celui dans la DB
        const token = req.header('Authorization').replace('Bearer ','')
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        
        const user = await User.findOne({_id : decoded._id,'tokens.token':token})
        
        if(!user){
            throw new Error('Mauvais identifiants')
        }
        
        req.token = token
        req.user = user
        
        next()
    }catch(e){
        res.status(401).send('Mauvais identifiants')
    }
    
}



module.exports = auth